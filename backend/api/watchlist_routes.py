"""
Watchlist API endpoints - user-specific stock tracking.
Requires authentication.
"""
from fastapi import APIRouter, HTTPException, Security, status
from typing import List
from datetime import datetime, timezone
import logging

from models.user import Watchlist, WatchlistCreate, WatchlistUpdate
from schemas.api_models import validate_symbol_path
from services.supabase_client import supabase
from providers.polygon import polygon_get, POLYGON_BASE
from middleware.auth import get_current_user, security

logger = logging.getLogger(__name__)

router = APIRouter()


async def _get_or_create_default_watchlist(user_id: str) -> str:
    """Get user's default watchlist ID, creating one if it doesn't exist."""
    # Check for existing default watchlist
    results = await (
        supabase.table("watchlists")
        .select("id")
        .eq("user_id", user_id)
        .eq("is_default", True)
        .execute()
    )

    if results and len(results) > 0:
        return results[0]["id"]

    # Create default watchlist
    new_watchlist = {
        "user_id": user_id,
        "name": "My Watchlist",
        "is_default": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await supabase.table("watchlists").insert([new_watchlist]).execute()
    if result and len(result) > 0:
        return result[0]["id"]
    raise Exception("Failed to create default watchlist")


@router.get("/", response_model=List[Watchlist])
async def get_watchlist(user: dict = Security(get_current_user, scopes=[])):
    """Get user's watchlist items."""
    try:
        user_id = user["user_id"]

        results = await (
            supabase.table("watchlist_items")
            .select("*")
            .eq("user_id", user_id)
            .order("added_at", desc=True)
            .execute()
        )

        return results or []

    except Exception as e:
        logger.error(f"Fetch watchlist failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch watchlist"
        )


@router.post("/", response_model=Watchlist, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item: WatchlistCreate,
    user: dict = Security(get_current_user, scopes=[])
):
    """Add a symbol to user's watchlist."""
    try:
        user_id = user["user_id"]
        symbol = item.symbol.upper()

        # Validate symbol exists on Polygon
        ticker_data = await polygon_get(
            f"{POLYGON_BASE}/v3/reference/tickers/{symbol}"
        )
        if not ticker_data or ticker_data.get("status") == "NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{symbol} is not a valid stock symbol"
            )

        # Check if symbol already in watchlist
        existing = await (
            supabase.table("watchlist_items")
            .select("id")
            .eq("user_id", user_id)
            .eq("symbol", symbol)
            .execute()
        )

        if existing and len(existing) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{symbol} is already in your watchlist"
            )

        # Get or create default watchlist
        watchlist_id = await _get_or_create_default_watchlist(user_id)

        # Add to watchlist_items
        watchlist_data = {
            "watchlist_id": watchlist_id,
            "user_id": user_id,
            "symbol": symbol,
            "notes": item.notes,
            "alert_enabled": item.alert_enabled,
            "alert_price": item.alert_price,
            "added_at": datetime.now(timezone.utc).isoformat(),
        }

        result = await supabase.table("watchlist_items").insert([watchlist_data]).execute()

        if result and len(result) > 0:
            return result[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add to watchlist"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add to watchlist failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add to watchlist"
        )


@router.patch("/{symbol}")
async def update_watchlist_item(
    symbol: str,
    update: WatchlistUpdate,
    user: dict = Security(get_current_user, scopes=[])
):
    """Update a watchlist item (notes, alerts, etc.)."""
    symbol = validate_symbol_path(symbol)
    try:
        user_id = user["user_id"]

        update_data = {}
        if update.notes is not None:
            update_data["notes"] = update.notes
        if update.alert_enabled is not None:
            update_data["alert_enabled"] = update.alert_enabled
        if update.alert_price is not None:
            update_data["alert_price"] = update.alert_price

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        result = await (
            supabase.table("watchlist_items")
            .update(update_data)
            .eq("user_id", user_id)
            .eq("symbol", symbol)
            .execute()
        )

        if result:
            return {
                "success": True,
                "message": f"Updated watchlist for {symbol}",
                "data": result[0] if result else None
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{symbol} not found in watchlist"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update watchlist item failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update watchlist item"
        )


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    symbol: str,
    user: dict = Security(get_current_user, scopes=[])
):
    """Remove a symbol from user's watchlist."""
    symbol = validate_symbol_path(symbol)
    try:
        user_id = user["user_id"]

        await (
            supabase.table("watchlist_items")
            .delete()
            .eq("user_id", user_id)
            .eq("symbol", symbol)
            .execute()
        )

        return None

    except Exception as e:
        logger.error(f"Remove from watchlist failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove from watchlist"
        )


@router.get("/{symbol}/check")
async def check_in_watchlist(
    symbol: str,
    user: dict = Security(get_current_user, scopes=[])
):
    """Check if a symbol is in user's watchlist."""
    symbol = validate_symbol_path(symbol)
    try:
        user_id = user["user_id"]

        results = await (
            supabase.table("watchlist_items")
            .select("id")
            .eq("user_id", user_id)
            .eq("symbol", symbol)
            .execute()
        )

        return {
            "symbol": symbol,
            "in_watchlist": bool(results and len(results) > 0),
        }

    except Exception as e:
        logger.error(f"Check watchlist failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check watchlist"
        )
