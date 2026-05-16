"""
Options chain and paper trading API endpoints.
Primary source: Polygon v3 snapshot (requires paid plan).
Fallback: yfinance (free, synchronous — runs in thread executor).
Includes live order placement via SnapTrade and Supabase paper-trade logging.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
import asyncio
import httpx
import logging
import random
import threading
import time
from datetime import date, datetime, timedelta, timezone

from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from middleware.validation import validate_ticker, validate_expiry, validate_quantity, validate_price
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

POLYGON_BASE = "https://api.polygon.io"

# ── Yahoo Finance fallback cache + persistent session + concurrency gate ───────
# Cache avoids re-hitting Yahoo Finance on every request.
# Persistent session reuses TCP connections (keep-alive) so Yahoo doesn't see
# a flood of new-connection requests from the Railway IP.
# Semaphore prevents concurrent requests from saturating Yahoo's rate limit
# (multiple tickers loading at once all fall back to yfinance simultaneously).
_YF_CACHE: dict = {}
_YF_CACHE_TTL = 1800         # 30 minutes — options data is slow-moving
_YF_CACHE_LOCK = threading.Lock()

_YF_SESSION = None           # module-level, shared across all requests
_YF_SESSION_LOCK = threading.Lock()

# Only 2 yfinance calls may run concurrently; extras queue until a slot is free.
# Created lazily on first awaitable use so it binds to the running event loop.
_YF_SEMAPHORE: asyncio.Semaphore | None = None


def _get_yf_semaphore() -> asyncio.Semaphore:
    global _YF_SEMAPHORE
    if _YF_SEMAPHORE is None:
        _YF_SEMAPHORE = asyncio.Semaphore(2)
    return _YF_SEMAPHORE

def _cache_get(key: str):
    with _YF_CACHE_LOCK:
        entry = _YF_CACHE.get(key)
        if entry and (time.monotonic() - entry["ts"]) < _YF_CACHE_TTL:
            return entry["data"]
    return None

def _cache_set(key: str, data) -> None:
    with _YF_CACHE_LOCK:
        _YF_CACHE[key] = {"data": data, "ts": time.monotonic()}

def _get_yf_session():
    """Return (or create) the module-level persistent requests.Session."""
    global _YF_SESSION
    with _YF_SESSION_LOCK:
        if _YF_SESSION is None:
            import requests
            from requests.adapters import HTTPAdapter
            s = requests.Session()
            # Generous connection pool so keep-alive sockets are reused
            adapter = HTTPAdapter(pool_connections=4, pool_maxsize=8, max_retries=0)
            s.mount("https://", adapter)
            s.headers.update({
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
            })
            _YF_SESSION = s
        return _YF_SESSION


# ── Pydantic models ────────────────────────────────────────────────────────────

class PaperTradeCreate(BaseModel):
    symbol: str
    contract_ticker: str        # e.g. "O:AAPL240119C00150000"
    contract_type: Literal["call", "put"]
    strike_price: float
    expiration_date: str        # "YYYY-MM-DD"
    action: Literal["buy", "sell"]
    quantity: int               # number of contracts
    price_per_contract: float   # premium in dollars
    notes: Optional[str] = None

    @field_validator("symbol")
    @classmethod
    def upper_symbol(cls, v: str) -> str:
        import re
        s = v.strip().upper()
        if not re.match(r'^[A-Z]{1,5}$', s):
            raise ValueError(f"Invalid ticker symbol: {v!r}")
        return s

    @field_validator("quantity")
    @classmethod
    def positive_qty(cls, v: int) -> int:
        if v < 1 or v > 10_000:
            raise ValueError("Quantity must be 1–10,000")
        return v

    @field_validator("price_per_contract")
    @classmethod
    def positive_price(cls, v: float) -> float:
        if v <= 0 or v > 100_000:
            raise ValueError("Price must be > 0 and ≤ 100,000")
        return round(v, 2)

    @field_validator("expiration_date")
    @classmethod
    def valid_expiry(cls, v: str) -> str:
        import re
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError(f"Invalid expiry date format (expected YYYY-MM-DD): {v!r}")
        return v

    @field_validator("strike_price")
    @classmethod
    def positive_strike(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Strike price must be positive")
        return v


class OptionsOrderRequest(BaseModel):
    account_id: str
    symbol: str
    option_symbol: str
    action: Literal["BUY", "SELL"]
    order_type: Literal["Market", "Limit"]
    quantity: int
    limit_price: Optional[float] = None

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        import re
        s = v.strip().upper()
        if not re.match(r'^[A-Z]{1,5}$', s):
            raise ValueError(f"Invalid ticker symbol: {v!r}")
        return s

    @field_validator("quantity")
    @classmethod
    def validate_qty(cls, v: int) -> int:
        if v < 1 or v > 10_000:
            raise ValueError("Quantity must be 1–10,000")
        return v

    @field_validator("limit_price")
    @classmethod
    def validate_limit_price(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Limit price must be positive")
        return v


# ── Polygon helpers ────────────────────────────────────────────────────────────

async def polygon_get(path: str, params: dict = None) -> dict:
    url = f"{POLYGON_BASE}{path}"
    p = {"apiKey": settings.POLYGON_API_KEY, **(params or {})}
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=p)
        if r.status_code == 404:
            return {"results": []}
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()

def _contract_to_row(r: dict) -> dict:
    """Flatten a Polygon options snapshot result into a compact row."""
    details = r.get("details", {})
    greeks = r.get("greeks") or {}
    last_quote = r.get("last_quote") or {}
    last_trade = r.get("last_trade") or {}
    day = r.get("day") or {}

    return {
        "ticker": details.get("ticker", ""),
        "contract_type": details.get("contract_type", ""),
        "strike": details.get("strike_price"),
        "expiration": details.get("expiration_date", ""),
        "bid": last_quote.get("bid"),
        "ask": last_quote.get("ask"),
        "last": last_trade.get("price") or day.get("close"),
        "volume": day.get("volume") or 0,
        "open_interest": r.get("open_interest") or 0,
        "iv": r.get("implied_volatility"),
        "delta": greeks.get("delta"),
        "gamma": greeks.get("gamma"),
        "theta": greeks.get("theta"),
        "vega": greeks.get("vega"),
    }


async def _fetch_options_chain(
    symbol: str,
    expiration_date: Optional[str],
    contract_type: Optional[str],
    limit: int,
) -> list[dict]:
    """Call Polygon v3 options snapshot and return normalised rows."""
    params: dict = {
        "apiKey": settings.POLYGON_API_KEY,
        "limit": min(limit, 250),
    }
    if expiration_date:
        params["expiration_date"] = expiration_date
    if contract_type:
        params["contract_type"] = contract_type.lower()

    url = f"{POLYGON_BASE}/v3/snapshot/options/{symbol.upper()}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)

    if resp.status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Options data requires a Polygon paid plan.",
        )
    if resp.status_code != 200:
        logger.error("Polygon options error %s: %s", resp.status_code, resp.text[:200])
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Polygon returned {resp.status_code}",
        )

    data = resp.json()
    results = data.get("results") or []
    return [_contract_to_row(r) for r in results]


# ── yfinance fallback ──────────────────────────────────────────────────────────

def _yfinance_row(row, contract_type: str, expiry: str) -> dict:
    """Convert a yfinance DataFrame row to our standard contract dict."""
    def _f(v, default=None):
        try:
            val = float(v)
            return val if val == val else default  # NaN check
        except (TypeError, ValueError):
            return default

    def _i(v, default=0):
        try:
            val = int(v)
            return val if val == val else default
        except (TypeError, ValueError):
            return default

    return {
        "ticker": str(row.get("contractSymbol", "")),
        "contract_type": contract_type,
        "strike": _f(row.get("strike")),
        "expiration": expiry,
        "bid": _f(row.get("bid")),
        "ask": _f(row.get("ask")),
        "last": _f(row.get("lastPrice")),
        "volume": _i(row.get("volume")),
        "open_interest": _i(row.get("openInterest")),
        "iv": _f(row.get("impliedVolatility")),
        # yfinance does not provide greeks
        "delta": None,
        "gamma": None,
        "theta": None,
        "vega": None,
    }


async def _fetch_options_chain_yfinance(
    symbol: str,
    expiration_date: Optional[str],
    contract_type: Optional[str],
    limit: int,
) -> tuple[list[dict], list[str]]:
    """
    Fetch options chain from Yahoo Finance (free tier).
    Uses a 5-minute in-memory cache and a browser User-Agent to avoid rate limiting.
    Retries once after 2 s on a 429/rate-limit response.
    Runs the synchronous yfinance calls in a thread executor.
    Returns (rows, all_expirations).
    """
    cache_key = f"chain|{symbol.upper()}|{expiration_date}|{contract_type}|{limit}"
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.info("yfinance cache hit for %s", symbol)
        return cached

    def _sync_fetch() -> tuple[list[dict], list[str]]:
        import yfinance as yf

        session = _get_yf_session()   # reuse the persistent module-level session
        sym = symbol.upper()
        ticker = yf.Ticker(sym, session=session)

        # Exponential backoff: up to 3 retries at 5 s, 15 s, 30 s
        _BACKOFFS = [5, 15, 30]
        all_expirations: list[str] = []
        last_exc: Exception | None = None
        for attempt, backoff in enumerate([0] + _BACKOFFS):
            if backoff:
                logger.warning(
                    "yfinance rate-limited for %s (attempt %d/%d), waiting %d s…",
                    sym, attempt, len(_BACKOFFS) + 1, backoff,
                )
                time.sleep(backoff)
            try:
                all_expirations = list(ticker.options)
                last_exc = None
                break
            except Exception as exc:
                last_exc = exc
                msg = str(exc).lower()
                if "rate" in msg or "429" in msg or "too many" in msg:
                    continue       # eligible for retry
                # Non-rate-limit error — bail immediately
                logger.error("yfinance options list failed for %s: %s", sym, exc, exc_info=True)
                raise

        if last_exc is not None:
            logger.error("yfinance still rate-limited after retries for %s: %s", sym, last_exc, exc_info=True)
            raise last_exc

        if not all_expirations:
            return [], []

        if expiration_date and expiration_date in all_expirations:
            expirations_to_fetch = [expiration_date]
        elif expiration_date:
            expirations_to_fetch = all_expirations[:1]
        else:
            expirations_to_fetch = all_expirations[:4]

        rows: list[dict] = []
        for expiry in expirations_to_fetch:
            try:
                chain = ticker.option_chain(expiry)
            except Exception as exc:
                logger.warning("yfinance option_chain(%s, %s) failed: %s", sym, expiry, exc)
                continue

            if contract_type != "put":
                for _, row in chain.calls.iterrows():
                    rows.append(_yfinance_row(row.to_dict(), "call", expiry))

            if contract_type != "call":
                for _, row in chain.puts.iterrows():
                    rows.append(_yfinance_row(row.to_dict(), "put", expiry))

        return rows[:limit], all_expirations

    loop = asyncio.get_event_loop()
    sem = _get_yf_semaphore()
    async with sem:
        # Jitter spreads concurrent callers across time so they don't burst Yahoo
        # Finance simultaneously even after acquiring the semaphore in sequence.
        jitter = random.uniform(0.3, 1.5)
        await asyncio.sleep(jitter)
        try:
            result = await loop.run_in_executor(None, _sync_fetch)
            _cache_set(cache_key, result)
            return result
        except Exception as exc:
            logger.error("yfinance fallback failed for %s: %s", symbol, exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Options data unavailable: {exc}",
            )


async def _fetch_expiries_yfinance(symbol: str) -> list[str]:
    """Return available expiration dates from yfinance (free-tier fallback, cached 5 min)."""
    cache_key = f"expiries|{symbol.upper()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.info("yfinance expiries cache hit for %s", symbol)
        return cached

    def _sync() -> list[str]:
        import yfinance as yf

        session = _get_yf_session()   # reuse the persistent module-level session
        ticker = yf.Ticker(symbol.upper(), session=session)

        _BACKOFFS = [5, 15, 30]
        last_exc: Exception | None = None
        for attempt, backoff in enumerate([0] + _BACKOFFS):
            if backoff:
                logger.warning(
                    "yfinance rate-limited (expiries) for %s (attempt %d/%d), waiting %d s…",
                    symbol, attempt, len(_BACKOFFS) + 1, backoff,
                )
                time.sleep(backoff)
            try:
                return list(ticker.options)
            except Exception as exc:
                last_exc = exc
                msg = str(exc).lower()
                if "rate" in msg or "429" in msg or "too many" in msg:
                    continue
                logger.warning("yfinance expiries failed for %s: %s", symbol, exc)
                return []

        logger.warning("yfinance expiries still rate-limited after retries for %s: %s", symbol, last_exc)
        return []

    loop = asyncio.get_event_loop()
    sem = _get_yf_semaphore()
    async with sem:
        jitter = random.uniform(0.3, 1.5)
        await asyncio.sleep(jitter)
        try:
            result = await loop.run_in_executor(None, _sync)
            _cache_set(cache_key, result)
            return result
        except Exception as exc:
            logger.warning("yfinance expiries executor failed for %s: %s", symbol, exc)
            return []


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/expiries/{symbol}")
@limiter.limit("30/minute")
async def get_option_expiries(
    symbol: str,
    request: Request,
    _user: dict = Depends(get_current_user),
):
    """Return available expiration dates for a symbol. Tries Polygon first, yfinance as fallback."""
    symbol = validate_ticker(symbol)
    expiries: list[str] = []
    try:
        today = date.today().isoformat()
        data = await polygon_get(
            "/v3/reference/options/contracts",
            {
                "underlying_ticker": symbol,
                "expiration_date.gte": today,
                "limit": 250,
                "sort": "expiration_date",
                "order": "asc",
            },
        )
        results = data.get("results", [])
        expiries = sorted({r["expiration_date"] for r in results if "expiration_date" in r})
    except Exception as e:
        logger.info("Polygon expiries failed for %s (%s) — falling back to yfinance", symbol, e)

    if not expiries:
        expiries = await _fetch_expiries_yfinance(symbol)

    return {"symbol": symbol.upper(), "expiration_dates": expiries}


@router.get("/chain/{symbol}")
@limiter.limit("30/minute")
async def get_options_chain(
    request: Request,
    symbol: str,
    expiration_date: Optional[str] = Query(None, description="Filter to YYYY-MM-DD expiration"),
    contract_type: Optional[Literal["call", "put"]] = Query(None),
    limit: int = Query(100, ge=1, le=250),
    _user: dict = Depends(get_current_user),
):
    """
    Return the live options chain for a ticker.
    Tries Polygon first; falls back to yfinance when Polygon is on the free tier (403).
    """
    symbol = validate_ticker(symbol)
    if expiration_date:
        expiration_date = validate_expiry(expiration_date)
    all_expirations: list[str] = []

    try:
        rows = await _fetch_options_chain(symbol, expiration_date, contract_type, limit)
    except HTTPException as exc:
        logger.info(
            "Polygon options chain failed (%s) for %s — falling back to yfinance",
            exc.status_code, symbol,
        )
        rows, all_expirations = await _fetch_options_chain_yfinance(
            symbol, expiration_date, contract_type, limit
        )

    calls = sorted(
        [r for r in rows if r["contract_type"] == "call"],
        key=lambda r: (r["expiration"], r["strike"] or 0),
    )
    puts = sorted(
        [r for r in rows if r["contract_type"] == "put"],
        key=lambda r: (r["expiration"], r["strike"] or 0),
    )

    expirations = all_expirations or sorted({r["expiration"] for r in rows if r["expiration"]})

    return {
        "symbol": symbol.upper(),
        "calls": calls,
        "puts": puts,
        "expirations": expirations,
        "total": len(rows),
    }


@router.get("/contract/{option_ticker:path}")
@limiter.limit("30/minute")
async def get_option_contract(
    option_ticker: str,
    request: Request,
    _user: dict = Depends(get_current_user),
):
    """Return reference data for a single option contract."""
    try:
        data = await polygon_get(f"/v3/reference/options/contracts/{option_ticker}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching contract %s: %s", option_ticker, e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order")
@limiter.limit("5/minute")
async def place_options_order(
    order: OptionsOrderRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Place a live options order via SnapTrade."""
    try:
        from services.supabase_client import supabase as _supabase
        from services.snaptrade_service import SnapTradeService, snaptrade

        user_id = current_user["user_id"]

        rows = await _supabase.table("snaptrade_users").select("user_secret").eq("user_id", user_id).execute()
        if not rows or len(rows) == 0:
            raise HTTPException(status_code=404, detail="SnapTrade account not linked. Please register first.")
        user_secret = rows[0]["user_secret"]

        service = SnapTradeService()
        accounts = await service.list_accounts(user_id, user_secret)
        account_ids = {a["id"] for a in accounts}
        if order.account_id not in account_ids:
            raise HTTPException(status_code=403, detail="Account does not belong to authenticated user")

        result = await snaptrade.place_order(
            user_id=user_id,
            account_id=order.account_id,
            symbol=order.option_symbol,
            action=order.action,
            order_type=order.order_type,
            quantity=order.quantity,
            limit_price=order.limit_price,
        )
        return {"order": result, "status": "submitted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error placing options order: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/paper-trade", status_code=201)
@limiter.limit("20/minute")
async def create_paper_trade(
    request: Request,
    body: PaperTradeCreate,
    user: dict = Depends(get_current_user),
):
    """
    Log a simulated (paper) options trade to Supabase.
    premium_paid = price_per_contract × quantity × 100  (each contract = 100 shares)
    """
    from services.supabase_client import supabase

    premium_paid = round(body.price_per_contract * body.quantity * 100, 2)

    row = {
        "user_id": user["user_id"],
        "symbol": body.symbol,
        "contract_ticker": body.contract_ticker,
        "contract_type": body.contract_type,
        "strike_price": body.strike_price,
        "expiration_date": body.expiration_date,
        "action": body.action,
        "quantity": body.quantity,
        "price_per_contract": body.price_per_contract,
        "premium_paid": premium_paid,
        "status": "open",
        "notes": body.notes,
        "traded_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        rows = await supabase.table("paper_trades").insert([row]).execute()
        return rows[0] if rows else {**row, "id": None}
    except Exception as exc:
        logger.error("paper-trade insert failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save paper trade",
        )


@router.get("/paper-trades")
@limiter.limit("30/minute")
async def list_paper_trades(
    request: Request,
    user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
):
    """Return the authenticated user's paper trade history, newest first."""
    from services.supabase_client import supabase

    try:
        rows = await (
            supabase.table("paper_trades")
            .select("*")
            .eq("user_id", user["user_id"])
            .order("traded_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"trades": rows or []}
    except Exception as exc:
        logger.error("list paper-trades failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch paper trades",
        )
