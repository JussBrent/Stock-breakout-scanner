"""
SnapTrade API routes for brokerage integration.
Handles account linking, portfolio, trading, and activity history.
"""
from fastapi import APIRouter, Request, Security, HTTPException, Query
from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from middleware.validation import validate_ticker, validate_account_id
from services.snaptrade_service import SnapTradeService
from services.supabase_client import supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Order size limits ──────────────────────────────────────────────────
MAX_EQUITY_SHARES = 10_000
MAX_OPTIONS_CONTRACTS = 1_000
MAX_ORDER_VALUE_USD = 500_000


def get_snaptrade_service() -> SnapTradeService:
    return SnapTradeService()


# ── Pydantic Models ────────────────────────────────────────────────────

class PlaceOrderRequest(BaseModel):
    account_id: str
    symbol: str  # universal_symbol_id
    action: Literal["BUY", "SELL"]
    order_type: Literal["Market", "Limit", "StopLimit", "StopLoss"]
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: Literal["Day", "GTC"] = "Day"

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        if v > MAX_EQUITY_SHARES:
            raise ValueError(f"Quantity exceeds maximum allowed ({MAX_EQUITY_SHARES} shares)")
        return v

    @field_validator('price', 'stop_price')
    @classmethod
    def validate_prices(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Price must be positive")
        return v


class OrderImpactRequest(BaseModel):
    account_id: str
    symbol: str
    action: Literal["BUY", "SELL"]
    order_type: Literal["Market", "Limit", "StopLimit", "StopLoss"]
    quantity: float
    price: Optional[float] = None

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        if v > MAX_EQUITY_SHARES:
            raise ValueError(f"Quantity exceeds maximum allowed ({MAX_EQUITY_SHARES} shares)")
        return v


class SymbolSearchRequest(BaseModel):
    query: str


# ── Helper: get user_secret from Supabase ──────────────────────────────

async def get_user_secret(user_id: str) -> str:
    """Retrieve the user's SnapTrade user_secret from Supabase."""
    rows = await supabase.table("snaptrade_users").select("user_secret").eq("user_id", user_id).execute()
    if not rows or len(rows) == 0:
        raise HTTPException(status_code=404, detail="SnapTrade account not linked. Please register first.")
    return rows[0]["user_secret"]


# ── Registration & Linking ─────────────────────────────────────────────

@router.post("/register")
@limiter.limit("5/minute")
async def register_snaptrade_user(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Register user with SnapTrade and store user_secret."""
    service = get_snaptrade_service()
    user_id = user["user_id"]

    result = await service.register_user(user_id)
    user_secret = result.get("userSecret")

    if user_secret:
        # Store user_secret in Supabase
        try:
            existing = await supabase.table("snaptrade_users").select("id").eq("user_id", user_id).execute()
            if existing and len(existing) > 0:
                await supabase.table("snaptrade_users").update({"user_secret": user_secret}).eq("user_id", user_id).execute()
            else:
                await supabase.table("snaptrade_users").insert([{
                    "user_id": user_id,
                    "user_secret": user_secret,
                }]).execute()
        except Exception as e:
            logger.error(f"Failed to store user_secret: {e}")
            raise HTTPException(status_code=500, detail="Failed to save SnapTrade credentials")

    return {"status": "registered", "user_id": user_id}


@router.get("/connect")
@limiter.limit("10/minute")
async def get_connect_url(
    request: Request,
    redirect_uri: Optional[str] = Query(None, description="URL to redirect the popup to after OAuth completes"),
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get SnapTrade Connect redirect URL for brokerage linking."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    result = await service.get_login_redirect_url(user_id, user_secret, custom_redirect=redirect_uri)
    redirect_url = result.get("redirectURI") or result.get("loginLink")

    if not redirect_url:
        raise HTTPException(status_code=500, detail="Failed to generate connect URL")

    return {"redirect_url": redirect_url}


@router.get("/status")
@limiter.limit("20/minute")
async def get_connection_status(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Check if user has SnapTrade account and linked brokerages."""
    user_id = user["user_id"]

    try:
        user_secret = await get_user_secret(user_id)
        service = get_snaptrade_service()
        accounts = await service.list_accounts(user_id, user_secret)
        return {
            "registered": True,
            "accounts_linked": len(accounts) if accounts else 0,
            "accounts": accounts or [],
        }
    except HTTPException:
        return {"registered": False, "accounts_linked": 0, "accounts": []}
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {"registered": False, "accounts_linked": 0, "accounts": []}


# ── Accounts & Balances ────────────────────────────────────────────────

@router.get("/accounts")
@limiter.limit("20/minute")
async def list_accounts(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """List all linked brokerage accounts."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    accounts = await service.list_accounts(user_id, user_secret)
    return {"accounts": accounts or []}


@router.get("/authorizations")
@limiter.limit("20/minute")
async def list_authorizations(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """List the user's active brokerage authorizations (each has an id for unlinking)."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)
    auths = await service.list_user_brokerage_authorizations(user_id, user_secret)
    return {"authorizations": auths or []}


@router.delete("/authorizations/{authorization_id}", status_code=204)
@limiter.limit("10/minute")
async def remove_brokerage_account(
    authorization_id: str,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Unlink a brokerage by removing its authorization ID."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)
    await service.remove_brokerage_authorization(user_id, user_secret, authorization_id)


@router.get("/accounts/{account_id}/balances")
@limiter.limit("20/minute")
async def get_account_balances(
    account_id: str,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get balances for a specific account."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    # Verify account belongs to the authenticated user
    accounts = await service.list_accounts(user_id, user_secret)
    account_ids = {str(a.get("id") or a.get("accountId", "")) for a in (accounts or [])}
    if account_id not in account_ids:
        raise HTTPException(status_code=403, detail="Account does not belong to authenticated user")

    balances = await service.get_account_balances(user_id, user_secret, account_id)
    return {"balances": balances or []}


# ── Portfolio / Holdings ───────────────────────────────────────────────

@router.get("/holdings/{account_id}")
@limiter.limit("20/minute")
async def get_holdings(
    account_id: str,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get positions/holdings for a specific account."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    # Verify account belongs to the authenticated user
    accounts = await service.list_accounts(user_id, user_secret)
    account_ids = {str(a.get("id") or a.get("accountId", "")) for a in (accounts or [])}
    if account_id not in account_ids:
        raise HTTPException(status_code=403, detail="Account does not belong to authenticated user")

    holdings = await service.get_holdings(user_id, user_secret, account_id)
    return {"holdings": holdings}


@router.get("/holdings")
@limiter.limit("20/minute")
async def get_all_holdings(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get holdings across all linked accounts."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    all_holdings = await service.get_all_holdings(user_id, user_secret)
    return {"holdings": all_holdings}


# ── Trading ────────────────────────────────────────────────────────────

@router.post("/order/preview")
@limiter.limit("20/minute")
async def preview_order(
    body: OrderImpactRequest,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Preview order impact before placing."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    # Verify account belongs to the authenticated user
    accounts = await service.list_accounts(user_id, user_secret)
    account_ids = {str(a.get("id") or a.get("accountId", "")) for a in (accounts or [])}
    if body.account_id not in account_ids:
        raise HTTPException(status_code=403, detail="Account does not belong to authenticated user")

    # Validate order value if price is provided
    if body.price and body.quantity * body.price > MAX_ORDER_VALUE_USD:
        raise HTTPException(status_code=422, detail=f"Order value exceeds maximum allowed (${MAX_ORDER_VALUE_USD:,.0f})")

    impact = await service.get_order_impact(
        user_id=user_id,
        user_secret=user_secret,
        account_id=body.account_id,
        symbol=body.symbol,
        action=body.action,
        order_type=body.order_type,
        quantity=body.quantity,
        price=body.price,
    )
    return {"impact": impact}


@router.post("/order/place")
@limiter.limit("5/minute")
async def place_order(
    body: PlaceOrderRequest,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Place a trade order."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    # Verify account belongs to the authenticated user
    accounts = await service.list_accounts(user_id, user_secret)
    account_ids = {str(a.get("id") or a.get("accountId", "")) for a in (accounts or [])}
    if body.account_id not in account_ids:
        raise HTTPException(status_code=403, detail="Account does not belong to authenticated user")

    # Validate order value does not exceed maximum
    if body.price and body.quantity * body.price > MAX_ORDER_VALUE_USD:
        raise HTTPException(status_code=422, detail=f"Order value exceeds maximum allowed (${MAX_ORDER_VALUE_USD:,.0f})")

    result = await service.place_order(
        user_id=user_id,
        user_secret=user_secret,
        account_id=body.account_id,
        symbol=body.symbol,
        action=body.action,
        order_type=body.order_type,
        quantity=body.quantity,
        price=body.price,
        stop_price=body.stop_price,
        time_in_force=body.time_in_force,
    )
    return {"order": result}


# ── Activity / Trade History ───────────────────────────────────────────

@router.get("/activities")
@limiter.limit("20/minute")
async def get_activities(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    account_id: Optional[str] = None,
):
    """Get trade/activity history."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    activities = await service.get_activities(
        user_id=user_id,
        user_secret=user_secret,
        start_date=start_date,
        end_date=end_date,
        account_id=account_id,
    )
    return {"activities": activities or []}


# ── Disconnect / Delete ────────────────────────────────────────────────

@router.post("/disconnect")
@limiter.limit("5/minute")
async def disconnect_snaptrade(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Delete user from SnapTrade and remove stored credentials. Revokes all brokerage connections."""
    service = get_snaptrade_service()
    user_id = user["user_id"]

    try:
        await service.delete_user(user_id)
    except Exception as e:
        logger.warning(f"SnapTrade delete_user call failed (may already be deleted): {e}")

    # Always clean up local record
    try:
        await supabase.table("snaptrade_users").delete().eq("user_id", user_id).execute()
    except Exception as e:
        logger.error(f"Failed to remove snaptrade_users row: {e}")

    return {"status": "disconnected"}


# ── Symbol Search ──────────────────────────────────────────────────────

@router.post("/symbols/search")
@limiter.limit("30/minute")
async def search_symbols(
    body: SymbolSearchRequest,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Search for symbols in SnapTrade's database."""
    service = get_snaptrade_service()
    results = await service.search_symbols(body.query)
    return {"symbols": results or []}


# ── Auto-Import Trade Journey from Brokerage ─────────────────────────

@router.post("/import-trades")
@limiter.limit("5/minute")
async def import_trades_from_brokerage(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """
    Pull closed activity from the linked brokerage and auto-populate the user's
    trade_outcomes table (and optionally sean_trades if the user is admin/Sean).
    Maps SnapTrade activity records to training-ready trade rows so the AI can
    learn from real brokerage history without manual data entry.
    """
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    # Fetch last 90 days of activity
    from datetime import date, timedelta
    start = (date.today() - timedelta(days=90)).isoformat()
    end = date.today().isoformat()

    activities = await service.get_activities(
        user_id=user_id,
        user_secret=user_secret,
        start_date=start,
        end_date=end,
    )

    if not activities:
        return {"imported": 0, "skipped": 0, "message": "No brokerage activity found for the last 90 days"}

    imported = 0
    skipped = 0
    errors = []

    for act in activities:
        try:
            # SnapTrade activity types: BUY, SELL, DIV, INT, FEE, etc.
            act_type = (act.get("type") or act.get("activity_type") or "").upper()
            symbol = (
                act.get("symbol") or
                act.get("universal_symbol", {}).get("symbol") or
                act.get("currency", {}).get("code") or ""
            ).upper()
            price = act.get("price") or act.get("amount") or 0
            qty = abs(act.get("units") or act.get("quantity") or 0)
            act_date = (act.get("trade_date") or act.get("settlement_date") or
                        act.get("date") or end)[:10]

            # Skip non-equity trades, dividends, fees
            if act_type not in ("BUY", "SELL") or not symbol or not price:
                skipped += 1
                continue

            # Check if we already have this activity logged (dedup by symbol + date + price)
            existing = await supabase.table("trade_outcomes").select("id").eq(
                "user_id", user_id
            ).eq("symbol", symbol).eq("entry_price", float(price)).eq(
                "opened_at", act_date
            ).execute()

            if existing and len(existing) > 0:
                skipped += 1
                continue

            if act_type == "BUY":
                # Opening a position
                row = {
                    "user_id": user_id,
                    "symbol": symbol,
                    "direction": "long",
                    "entry_price": float(price),
                    "quantity": float(qty),
                    "outcome": "open",
                    "opened_at": act_date,
                    "source": "brokerage_import",
                }
                await supabase.table("trade_outcomes").insert([row]).execute()
                imported += 1

            elif act_type == "SELL":
                # Try to match with an open position for this symbol
                open_rows = await supabase.table("trade_outcomes").select(
                    "id,entry_price"
                ).eq("user_id", user_id).eq("symbol", symbol).eq(
                    "outcome", "open"
                ).order("opened_at", desc=False).limit(1).execute()

                if open_rows and len(open_rows) > 0:
                    open_row = open_rows[0]
                    entry = float(open_row["entry_price"])
                    exit_p = float(price)
                    gain_pct = ((exit_p - entry) / entry * 100) if entry else None
                    outcome = "win" if (gain_pct or 0) > 0 else ("loss" if (gain_pct or 0) < 0 else "breakeven")
                    await supabase.table("trade_outcomes").update({
                        "exit_price": exit_p,
                        "gain_pct": round(gain_pct, 2) if gain_pct is not None else None,
                        "outcome": outcome,
                        "closed_at": act_date,
                    }).eq("id", open_row["id"]).execute()
                else:
                    # No matching open row — insert as a completed sell
                    row = {
                        "user_id": user_id,
                        "symbol": symbol,
                        "direction": "long",
                        "exit_price": float(price),
                        "quantity": float(qty),
                        "outcome": "open",
                        "closed_at": act_date,
                        "source": "brokerage_import",
                    }
                    await supabase.table("trade_outcomes").insert([row]).execute()
                imported += 1

        except Exception as row_err:
            logger.warning(f"Skipped activity row: {row_err}")
            errors.append(str(row_err))
            skipped += 1
            continue

    return {
        "imported": imported,
        "skipped": skipped,
        "message": f"Imported {imported} trade(s) from brokerage history",
        "errors": errors[:5] if errors else [],
    }


# ── Auto-Import Trade Journey from Brokerage ───────────────────────

@router.post("/import-trades")
@limiter.limit("5/minute")
async def import_trades_from_brokerage(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """
    Pull closed activity from the linked brokerage and auto-populate the user's
    trade_outcomes table so the AI can learn from real brokerage history
    without manual data entry. Matches BUY/SELL pairs into win/loss trade records.
    """
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    from datetime import date, timedelta
    start = (date.today() - timedelta(days=90)).isoformat()
    end = date.today().isoformat()

    activities = await service.get_activities(
        user_id=user_id,
        user_secret=user_secret,
        start_date=start,
        end_date=end,
    )

    if not activities:
        return {"imported": 0, "skipped": 0, "message": "No brokerage activity found for the last 90 days"}

    imported = 0
    skipped = 0
    errors = []

    for act in activities:
        try:
            act_type = (act.get("type") or act.get("activity_type") or "").upper()
            symbol = (
                act.get("symbol") or
                (act.get("universal_symbol") or {}).get("symbol") or ""
            ).upper().strip()
            price = float(act.get("price") or act.get("amount") or 0)
            qty = abs(float(act.get("units") or act.get("quantity") or 0))
            act_date = (
                act.get("trade_date") or act.get("settlement_date") or
                act.get("date") or end
            )[:10]

            # Only process equity BUY/SELL with a valid symbol and price
            if act_type not in ("BUY", "SELL") or not symbol or price <= 0:
                skipped += 1
                continue

            # Dedup: skip if we already have this exact activity
            existing = await supabase.table("trade_outcomes").select("id").eq(
                "user_id", user_id
            ).eq("symbol", symbol).eq("entry_price", price).eq(
                "opened_at", act_date
            ).execute()

            if existing and len(existing) > 0:
                skipped += 1
                continue

            if act_type == "BUY":
                row = {
                    "user_id": user_id,
                    "symbol": symbol,
                    "direction": "long",
                    "entry_price": price,
                    "quantity": qty,
                    "outcome": "open",
                    "opened_at": act_date,
                    "source": "brokerage_import",
                }
                await supabase.table("trade_outcomes").insert([row]).execute()
                imported += 1

            elif act_type == "SELL":
                # Try to match with the oldest open BUY for this symbol
                open_rows = await supabase.table("trade_outcomes").select(
                    "id,entry_price"
                ).eq("user_id", user_id).eq("symbol", symbol).eq(
                    "outcome", "open"
                ).order("opened_at", desc=False).limit(1).execute()

                if open_rows and len(open_rows) > 0:
                    open_row = open_rows[0]
                    entry = float(open_row["entry_price"])
                    gain_pct = ((price - entry) / entry * 100) if entry else None
                    outcome = (
                        "win" if (gain_pct or 0) > 0
                        else "loss" if (gain_pct or 0) < 0
                        else "breakeven"
                    )
                    await supabase.table("trade_outcomes").update({
                        "exit_price": price,
                        "gain_pct": round(gain_pct, 2) if gain_pct is not None else None,
                        "outcome": outcome,
                        "closed_at": act_date,
                    }).eq("id", open_row["id"]).execute()
                else:
                    # No matching open row — log as a completed sell with unknown entry
                    row = {
                        "user_id": user_id,
                        "symbol": symbol,
                        "direction": "long",
                        "exit_price": price,
                        "quantity": qty,
                        "outcome": "open",
                        "closed_at": act_date,
                        "source": "brokerage_import",
                    }
                    await supabase.table("trade_outcomes").insert([row]).execute()
                imported += 1

        except Exception as row_err:
            logger.warning(f"Skipped brokerage activity row: {row_err}")
            errors.append(str(row_err)[:120])
            skipped += 1
            continue

    return {
        "imported": imported,
        "skipped": skipped,
        "message": f"Imported {imported} trade(s) from brokerage history",
        "errors": errors[:5] if errors else [],
    }
