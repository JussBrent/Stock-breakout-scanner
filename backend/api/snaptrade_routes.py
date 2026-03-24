"""
SnapTrade API routes for brokerage integration.
Handles account linking, portfolio, trading, and activity history.
"""
from fastapi import APIRouter, Request, Security, HTTPException
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from services.snaptrade_service import SnapTradeService
from services.supabase_client import supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def get_snaptrade_service() -> SnapTradeService:
    return SnapTradeService()


# ── Pydantic Models ────────────────────────────────────────────────────

class PlaceOrderRequest(BaseModel):
    account_id: str
    symbol: str  # universal_symbol_id
    action: str  # BUY or SELL
    order_type: str  # Market, Limit, StopLimit, StopLoss
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: str = "Day"


class OrderImpactRequest(BaseModel):
    account_id: str
    symbol: str
    action: str
    order_type: str
    quantity: float
    price: Optional[float] = None


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
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get SnapTrade Connect redirect URL for brokerage linking."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    result = await service.get_login_redirect_url(user_id, user_secret)
    redirect_url = result.get("redirectURI") or result.get("loginLink")

    if not redirect_url:
        raise HTTPException(status_code=500, detail="Failed to generate connect URL")

    return {"redirect_url": redirect_url}


@router.get("/status")
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


@router.get("/accounts/{account_id}/balances")
async def get_account_balances(
    account_id: str,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get balances for a specific account."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    balances = await service.get_account_balances(user_id, user_secret, account_id)
    return {"balances": balances or []}


# ── Portfolio / Holdings ───────────────────────────────────────────────

@router.get("/holdings/{account_id}")
async def get_holdings(
    account_id: str,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Get positions/holdings for a specific account."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

    holdings = await service.get_holdings(user_id, user_secret, account_id)
    return {"holdings": holdings}


@router.get("/holdings")
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
@limiter.limit("10/minute")
async def place_order(
    body: PlaceOrderRequest,
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Place a trade order."""
    service = get_snaptrade_service()
    user_id = user["user_id"]
    user_secret = await get_user_secret(user_id)

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
