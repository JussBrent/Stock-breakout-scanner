"""
dashboard_service.py

Builds daily dashboard intelligence:
- Top 5 AI-scored setups from a full universe scan
- Sector performance heatmap (SPDRs + major ETFs)
- Market sentiment (VIX, SPY/QQQ/IWM)

Polygon data strategy:
  1. Try bulk snapshot (fast, works during market hours)
  2. If snapshot returns no data (market closed / weekend), fall back to
     /v2/aggs/ticker/{sym}/prev for each symbol in parallel (max 10 concurrent)
     This gives the last session close and the prior session close so we can
     compute a real change_pct instead of showing -100%.
Results cached in Supabase; refreshed on demand or daily cron.
"""

import asyncio
import logging
import os
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_KEY", "")

# -- Sector ETF universe -----------------------------------------------------
SECTOR_ETFS = {
    "Technology": "XLK",
    "Healthcare": "XLV",
    "Financials": "XLF",
    "Consumer Disc.": "XLY",
    "Consumer Staples": "XLP",
    "Energy": "XLE",
    "Industrials": "XLI",
    "Materials": "XLB",
    "Utilities": "XLU",
    "Real Estate": "XLRE",
    "Communication Svcs": "XLC",
    "Semiconductors": "SOXX",
    "Biotech": "XBI",
    "Clean Energy": "ICLN",
    "AI/Cloud": "WCLD",
}

# -- Market breadth proxies --------------------------------------------------
BREADTH_SYMBOLS = ["SPY", "QQQ", "IWM", "VIX"]

# -- All symbols we need in one batch ----------------------------------------
_ALL_DASHBOARD_SYMBOLS = list(SECTOR_ETFS.values()) + BREADTH_SYMBOLS

# -- Polygon helpers ---------------------------------------------------------
_POLYGON_BASE = "https://api.polygon.io"


def _polygon_key() -> str:
    from config import settings
    return settings.POLYGON_API_KEY or ""


async def _poly_get(path: str, params: dict | None = None, timeout: int = 20) -> dict:
    """Thin async wrapper for Polygon REST calls."""
    key = _polygon_key()
    if not key:
        return {}
    p = dict(params or {})
    p["apiKey"] = key
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(f"{_POLYGON_BASE}{path}", params=p)
        if resp.status_code == 200:
            return resp.json()
        logger.warning("Polygon %s -> %s %s", path, resp.status_code, resp.text[:100])
        return {}


async def _bulk_snapshots(symbols: list[str]) -> dict[str, dict]:
    """Fetch snapshots for multiple tickers in ONE API call.
    Returns dict keyed by uppercase symbol.
    NOTE: This endpoint returns empty results on weekends / when market is closed.
    """
    if not symbols:
        return {}
    tickers_param = ",".join(s.upper() for s in symbols)
    data = await _poly_get(
        "/v2/snapshot/locale/us/markets/stocks/tickers",
        {"tickers": tickers_param},
        timeout=30,
    )
    result: dict[str, dict] = {}
    for ticker_data in data.get("tickers", []):
        sym = ticker_data.get("ticker", "").upper()
        if sym:
            result[sym] = ticker_data
    logger.info("_bulk_snapshots: got %d results for %d symbols", len(result), len(symbols))
    return result


async def _prev_agg_snapshot(sym: str, sem: asyncio.Semaphore) -> dict | None:
    """Fetch the last 2 daily bars for a symbol using the aggregates endpoint.
    Returns a dict compatible with Polygon snapshot format (day + prevDay).
    Used as fallback when the snapshot endpoint returns no data (market closed).
    """
    async with sem:
        from_date = str(date.today() - timedelta(days=7))
        to_date = str(date.today())
        data = await _poly_get(
            f"/v2/aggs/ticker/{sym.upper()}/range/1/day/{from_date}/{to_date}",
            {"adjusted": "true", "sort": "desc", "limit": "2"},
        )
        results = data.get("results", [])
        if not results:
            logger.warning("_prev_agg_snapshot: no agg results for %s", sym)
            return None
        # Build a snapshot-compatible object
        latest = results[0]
        prior = results[1] if len(results) > 1 else latest
        return {
            "ticker": sym.upper(),
            "day": {"c": latest.get("c", 0), "v": latest.get("v", 0), "vw": latest.get("vw", 0)},
            "prevDay": {"c": prior.get("c", 0)},
            "lastTrade": {},
            "_source": "agg",
            "_agg_date": datetime.fromtimestamp(latest.get("t", 0) / 1000).strftime("%Y-%m-%d") if latest.get("t") else "unknown",
        }


async def _get_all_snapshots(symbols: list[str]) -> dict[str, dict]:
    """Smart snapshot fetcher:
    1. Try bulk snapshot first (1 API call, works during market hours)
    2. If returns < 50% of symbols (market closed / weekend), fall back to
       individual prev-agg calls in parallel (max 10 concurrent)
    """
    snapshots = await _bulk_snapshots(symbols)

    # If we got most symbols, snapshot is working fine
    if len(snapshots) >= len(symbols) * 0.5:
        return snapshots

    # Market closed or weekend — fall back to agg bars
    logger.info("Snapshot returned only %d/%d symbols -- falling back to agg bars", len(snapshots), len(symbols))
    missing = [s for s in symbols if s.upper() not in snapshots]

    sem = asyncio.Semaphore(10)  # max 10 concurrent (paid plan handles this fine)
    tasks = [_prev_agg_snapshot(sym, sem) for sym in missing]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for sym, res in zip(missing, results):
        if isinstance(res, Exception):
            logger.error("_prev_agg_snapshot failed for %s: %s", sym, res)
        elif res is not None:
            snapshots[sym.upper()] = res

    logger.info("After agg fallback: have %d/%d symbols", len(snapshots), len(symbols))
    return snapshots


def _parse_snapshot(sym: str, ticker_data: dict) -> dict:
    """Extract price + change_pct from a Polygon snapshot or agg-fallback object.
    Never returns -100% -- always safe division.
    """
    day = ticker_data.get("day", {})
    prev = ticker_data.get("prevDay", {})

    close = day.get("c") or ticker_data.get("lastTrade", {}).get("p") or 0
    prev_close = prev.get("c") or 0

    # If close is 0 (empty day), use prev as the price (market closed)
    if not close or close == 0:
        close = prev_close

    # Still no price -- nothing we can do
    if not close:
        return {"symbol": sym, "price": 0.0, "change_pct": 0.0, "volume": 0, "relative_volume": 1.0}

    # Protect against div-by-zero (same-day data where prev==0)
    if not prev_close or prev_close == 0:
        prev_close = close  # 0% change rather than -100%

    change_pct = round(((close - prev_close) / prev_close) * 100, 2)
    volume = int(day.get("v") or 0)
    vwap = float(day.get("vw") or 0)
    rel_vol = round(volume / vwap, 2) if vwap > 0 and volume > 0 else 1.0

    return {
        "symbol": sym,
        "price": round(float(close), 4),
        "change_pct": change_pct,
        "volume": volume,
        "relative_volume": rel_vol,
    }


async def _get_ticker_details(symbol: str) -> dict:
    """Fetch company name, sector, market cap."""
    data = await _poly_get(f"/v3/reference/tickers/{symbol.upper()}")
    res = data.get("results", {})
    return {
        "company_name": res.get("name", symbol),
        "sector": res.get("sic_description", ""),
        "market_cap": res.get("market_cap") or 0,
    }


# -- Supabase helpers --------------------------------------------------------

def _sb_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


async def _sb_upsert(table: str, rows: list[dict]) -> None:
    if not rows or not SUPABASE_URL:
        return
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            url,
            json=rows,
            headers={**_sb_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"},
        )
        if r.status_code not in (200, 201):
            logger.error("Supabase upsert %s -> %s %s", table, r.status_code, r.text[:200])
        else:
            logger.info("Supabase upsert %s: %d rows OK", table, len(rows))


async def _sb_select(table: str, params: dict | None = None) -> list[dict]:
    if not SUPABASE_URL:
        return []
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params or {}, headers=headers)
        if r.status_code == 200:
            return r.json()
        logger.error("Supabase select %s -> %s %s", table, r.status_code, r.text[:200])
        return []


# -- Sector performance -------------------------------------------------------

async def build_sector_heatmap(snapshots: dict[str, dict] | None = None) -> list[dict]:
    """Fetch all sector ETFs, score them, save to DB."""
    today = str(date.today())
    if snapshots is None:
        snapshots = await _get_all_snapshots(list(SECTOR_ETFS.values()))

    rows = []
    for sector, etf_sym in SECTOR_ETFS.items():
        ticker_data = snapshots.get(etf_sym.upper())
        if not ticker_data:
            logger.warning("No data for sector ETF %s", etf_sym)
            continue
        snap = _parse_snapshot(etf_sym, ticker_data)
        source = ticker_data.get("_source", "snapshot")
        agg_date = ticker_data.get("_agg_date", today)
        row = {
            "scan_date": agg_date if source == "agg" else today,
            "sector": sector,
            "etf_symbol": etf_sym,
            "change_pct": snap["change_pct"],
            "volume": snap["volume"],
            "relative_volume": snap["relative_volume"],
            "price": snap["price"],
            "is_breaking_out": snap["relative_volume"] > 1.5 and snap["change_pct"] > 0.5,
        }
        rows.append(row)
        logger.info("Sector %s (%s): $%.2f %+.2f%% [%s]", sector, etf_sym, snap["price"], snap["change_pct"], source)

    if rows:
        await _sb_upsert("sector_performance", rows)
    return rows


# -- Market sentiment ---------------------------------------------------------

async def build_market_sentiment(snapshots: dict[str, dict] | None = None) -> dict:
    """Compute market sentiment from SPY/QQQ/IWM + VIX."""
    today = str(date.today())
    if snapshots is None:
        snapshots = await _get_all_snapshots(BREADTH_SYMBOLS)

    def _snap(sym: str) -> dict:
        td = snapshots.get(sym.upper(), {})
        return _parse_snapshot(sym, td) if td else {"symbol": sym, "price": 0.0, "change_pct": 0.0}

    spy = _snap("SPY")
    qqq = _snap("QQQ")
    iwm = _snap("IWM")
    vix_snap = _snap("VIX")

    spy_chg = spy["change_pct"]
    qqq_chg = qqq["change_pct"]
    iwm_chg = iwm["change_pct"]
    vix = vix_snap["price"] if vix_snap["price"] > 0 else 20.0

    logger.info("Sentiment inputs: SPY=%+.2f%% QQQ=%+.2f%% IWM=%+.2f%% VIX=%.2f", spy_chg, qqq_chg, iwm_chg, vix)

    raw = (spy_chg + qqq_chg + iwm_chg) / 3
    vix_penalty = max(0.0, (vix - 15) * 1.5)
    score = max(0.0, min(100.0, 50 + raw * 8 - vix_penalty))

    if score >= 70:
        sentiment = "bullish"
    elif score >= 55:
        sentiment = "cautiously_bullish"
    elif score >= 45:
        sentiment = "neutral"
    elif score >= 30:
        sentiment = "cautiously_bearish"
    else:
        sentiment = "bearish"

    # Use the agg date if we fell back to agg data
    spy_td = snapshots.get("SPY", {})
    data_date = spy_td.get("_agg_date", today) if spy_td.get("_source") == "agg" else today

    row = {
        "scan_date": data_date,
        "sentiment": sentiment,
        "sentiment_score": round(score, 2),
        "vix": vix,
        "spy_change": spy_chg,
        "qqq_change": qqq_chg,
        "iwm_change": iwm_chg,
        "market_notes": f"SPY {spy_chg:+.2f}% | QQQ {qqq_chg:+.2f}% | IWM {iwm_chg:+.2f}% | VIX {vix:.1f}",
    }
    await _sb_upsert("market_sentiment", [row])
    return row


# -- Top 5 AI-scored setups --------------------------------------------------

async def build_top_setups(limit: int = 5) -> list[dict]:
    """Run scanner, AI-score top candidates, save to DB."""
    today = str(date.today())

    try:
        from scan.scan_universe import scan_universe
        from services.ai_analysis import get_ai_service
    except ImportError as exc:
        logger.error("Import error in build_top_setups: %s", exc)
        return []

    try:
        raw_results = await scan_universe(None)
    except Exception as exc:
        logger.error("scan_universe failed: %s", exc)
        return []

    if not raw_results:
        return []

    candidates = []
    for r in raw_results:
        try:
            vol = getattr(r, "volume", 0) or 0
            score = 0
            ai_ratings = getattr(r, "ai_ratings", None)
            if ai_ratings and hasattr(ai_ratings, "opportunity_score"):
                score = ai_ratings.opportunity_score or 0
            if vol > 300_000 and score > 0:
                candidates.append((r, score))
        except Exception:
            continue

    candidates.sort(key=lambda x: x[1], reverse=True)
    top = candidates[:max(limit * 3, 15)]
    ai_svc = get_ai_service()

    rows = []
    for rank, (result, _base_score) in enumerate(top[:limit], start=1):
        try:
            sym = getattr(result, "symbol", "")
            if not sym:
                continue

            try:
                ai_ratings_list = await ai_svc.analyze_stocks([result])
                ai_rating = ai_ratings_list[0] if ai_ratings_list else None
            except Exception as exc:
                logger.warning("AI re-score failed for %s: %s", sym, exc)
                ai_rating = getattr(result, "ai_ratings", None)

            details = await _get_ticker_details(sym)
            setup_type = str(getattr(result, "setup_type", "") or "")
            is_extended = "extended" in setup_type.lower() or "parabolic" in setup_type.lower()
            is_sideways = any(x in setup_type.lower() for x in ("flat", "sideways", "base"))

            sector = details.get("sector", "")
            etf_sym = next((v for k, v in SECTOR_ETFS.items() if k.lower() in sector.lower()), None)
            group_breakout = False

            ai_score = float(getattr(ai_rating, "opportunity_score", 0) or 0) if ai_rating else 0.0
            opportunity_score = ai_score
            confidence = str(getattr(ai_rating, "confidence", "") or "") if ai_rating else ""
            analysis_text = str(getattr(ai_rating, "analysis", "") or "") if ai_rating else ""
            kf = (getattr(ai_rating, "key_factors", []) or []) if ai_rating else []
            key_factors = list(kf) if isinstance(kf, (list, tuple)) else [str(kf)]
            risk_level = str(getattr(ai_rating, "risk_level", "") or "") if ai_rating else ""
            recommendation = str(getattr(ai_rating, "recommendation", "") or "") if ai_rating else ""

            rows.append({
                "scan_date": today,
                "rank": rank,
                "symbol": sym,
                "company_name": details.get("company_name", sym),
                "sector": sector or details.get("sector", ""),
                "setup_type": setup_type,
                "ai_score": round(ai_score, 2),
                "opportunity_score": round(opportunity_score, 2),
                "confidence": confidence,
                "price": round(float(getattr(result, "price", 0) or 0), 4),
                "price_change_pct": round(float(getattr(result, "price_change_pct", 0) or 0), 4),
                "volume": int(getattr(result, "volume", 0) or 0),
                "market_cap": int(details.get("market_cap", 0)),
                "etf_group": etf_sym or "",
                "analysis": analysis_text,
                "key_factors": key_factors,
                "risk_level": risk_level,
                "recommendation": recommendation,
                "is_extended": is_extended,
                "is_sideways": is_sideways,
                "group_breakout": group_breakout,
            })
        except Exception as exc:
            logger.error("build_top_setups row %s failed: %s", rank, exc)

    await _sb_upsert("daily_top_setups", rows)
    return rows


# -- Full refresh ------------------------------------------------------------

async def refresh_dashboard() -> dict:
    """Fetch ONE set of snapshots (with agg fallback) then run all builders."""
    logger.info("refresh_dashboard: fetching %d symbols", len(_ALL_DASHBOARD_SYMBOLS))
    try:
        all_snapshots = await _get_all_snapshots(_ALL_DASHBOARD_SYMBOLS)
    except Exception as exc:
        logger.error("refresh_dashboard snapshot fetch failed: %s", exc)
        all_snapshots = {}

    logger.info("refresh_dashboard: %d snapshots ready", len(all_snapshots))

    sentiment, sectors, setups = await asyncio.gather(
        build_market_sentiment(all_snapshots),
        build_sector_heatmap(all_snapshots),
        build_top_setups(5),
        return_exceptions=True,
    )

    if isinstance(sentiment, Exception):
        logger.error("build_market_sentiment failed: %s", sentiment)
    if isinstance(sectors, Exception):
        logger.error("build_sector_heatmap failed: %s", sectors)
    if isinstance(setups, Exception):
        logger.error("build_top_setups failed: %s", setups)

    return {
        "sentiment": sentiment if not isinstance(sentiment, Exception) else {"error": str(sentiment)},
        "sectors_count": len(sectors) if isinstance(sectors, list) else 0,
        "top_setups_count": len(setups) if isinstance(setups, list) else 0,
        "snapshot_count": len(all_snapshots),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# -- Read helpers (for API endpoints) ----------------------------------------

async def get_today_top_setups() -> list[dict]:
    today = str(date.today())
    rows = await _sb_select("daily_top_setups", {"scan_date": f"eq.{today}", "order": "rank.asc", "limit": "10"})
    if not rows:
        rows = await _sb_select("daily_top_setups", {"order": "scan_date.desc,rank.asc", "limit": "10"})
    return rows


async def get_today_sectors() -> list[dict]:
    today = str(date.today())
    rows = await _sb_select("sector_performance", {"scan_date": f"eq.{today}", "order": "change_pct.desc"})
    if not rows:
        latest = await _sb_select("sector_performance", {"order": "scan_date.desc", "limit": "1"})
        if latest:
            d = latest[0].get("scan_date", "")
            if d:
                rows = await _sb_select("sector_performance", {"scan_date": f"eq.{d}", "order": "change_pct.desc"})
    return rows


async def get_today_sentiment() -> dict:
    today = str(date.today())
    rows = await _sb_select("market_sentiment", {"scan_date": f"eq.{today}", "limit": "1"})
    if not rows:
        rows = await _sb_select("market_sentiment", {"order": "scan_date.desc", "limit": "1"})
    return rows[0] if rows else {}
