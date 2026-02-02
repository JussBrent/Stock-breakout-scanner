"""
Watchlist API endpoints - user-specific stock tracking.
Requires authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timezone

from models.user import Watchlist, WatchlistCreate, WatchlistUpdate
from services.supabase_client import supabase
from middleware.auth import get_current_user, security

router = APIRouter()


@router.get("/", response_model=List[Watchlist])
async def get_watchlist(user: dict = Depends(get_current_user)):
    """
    Get user's watchlist.
    Returns all symbols the user is watching.
    """
    try:
        user_id = user["user_id"]

        query = supabase.table("watchlists").select()
        query = query.eq("user_id", user_id)
        query = query.order("added_at", desc=True)

        results = await query.execute()

        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch watchlist: {str(e)}"
        )


@router.post("/", response_model=Watchlist, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item: WatchlistCreate,
    user: dict = Depends(get_current_user)
):
    """
    Add a symbol to user's watchlist.
    """
    try:
        user_id = user["user_id"]

        # Check if symbol already in watchlist
        existing = await supabase.table("watchlists").select()
        existing = existing.eq("user_id", user_id)
        existing = existing.eq("symbol", item.symbol.upper())
        existing_results = await existing.execute()

        if existing_results:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{item.symbol} is already in your watchlist"
            )

        # Add to watchlist
        watchlist_data = {
            "user_id": user_id,
            "symbol": item.symbol.upper(),
            "notes": item.notes,
            "alert_enabled": item.alert_enabled,
            "alert_price": item.alert_price,
            "added_at": datetime.now(timezone.utc).isoformat()
        }

        result = await supabase.table("watchlists").insert([watchlist_data]).execute()

        if result:
            return result[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add to watchlist"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add to watchlist: {str(e)}"
        )


@router.patch("/{symbol}")
async def update_watchlist_item(
    symbol: str,
    update: WatchlistUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Update a watchlist item (notes, alerts, etc.).
    """
    try:
        user_id = user["user_id"]
        symbol = symbol.upper()

        # Build update data
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

        # Update in database
        query = supabase.table("watchlists").update(update_data)
        query = query.eq("user_id", user_id)
        query = query.eq("symbol", symbol)
        result = await query.execute()

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update watchlist item: {str(e)}"
        )


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    symbol: str,
    user: dict = Depends(get_current_user)
):
    """
    Remove a symbol from user's watchlist.
    """
    try:
        user_id = user["user_id"]
        symbol = symbol.upper()

        # Delete from database
        query = supabase.table("watchlists").delete()
        query = query.eq("user_id", user_id)
        query = query.eq("symbol", symbol)
        await query.execute()

        return None  # 204 No Content

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove from watchlist: {str(e)}"
        )


@router.get("/{symbol}/check")
async def check_in_watchlist(
    symbol: str,
    user: dict = Depends(get_current_user)
):
    """
    Check if a symbol is in user's watchlist.
    """
    try:
        user_id = user["user_id"]
        symbol = symbol.upper()

        query = supabase.table("watchlists").select()
        query = query.eq("user_id", user_id)
        query = query.eq("symbol", symbol)

        results = await query.execute()

        return {
            "symbol": symbol,
            "in_watchlist": len(results) > 0,
            "data": results[0] if results else None
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check watchlist: {str(e)}"
        )