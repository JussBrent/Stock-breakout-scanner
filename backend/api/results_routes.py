from fastapi import APIRouter, HTTPException, Query, Security
from typing import Optional
from datetime import datetime, timedelta, timezone
import logging

from schemas.api_models import ResultsResponse, validate_symbol_path
from services.supabase_client import supabase
from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=ResultsResponse)
async def get_recent_results(
    limit: int = Query(25, ge=1, le=100),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    setup_type: Optional[str] = None,
    days_back: int = Query(7, ge=1, le=30),
    user: dict = Security(get_current_user, scopes=[])
):
    """
    Fetch recent scan results from Supabase.

    - **limit**: Maximum results to return (1-100)
    - **min_score**: Minimum breakout score filter
    - **setup_type**: Filter by setup type (FLAT_TOP, WEDGE, BASE, etc.)
    - **days_back**: How many days back to search (1-30)
    """
    try:
        # Calculate cutoff date
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)

        # Build query
        query = supabase.table("breakout_scans").select()
        query = query.gte("scanned_at", cutoff_date.isoformat())

        if min_score is not None:
            query = query.gte("breakout_score", min_score)

        if setup_type:
            query = query.eq("setup_type", setup_type)

        query = query.order("breakout_score", desc=True)
        query = query.order("scanned_at", desc=True)
        query = query.limit(limit)

        results = await query.execute()

        return ResultsResponse(
            success=True,
            count=len(results),
            results=results,
            filters={
                "min_score": min_score,
                "setup_type": setup_type,
                "days_back": days_back
            }
        )

    except Exception as e:
        logger.error(f"Get recent results failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch results")


@router.get("/{symbol}", response_model=ResultsResponse)
async def get_symbol_results(
    symbol: str,
    limit: int = Query(10, ge=1, le=50),
    user: dict = Security(get_current_user, scopes=[])
):
    """
    Get scan results for a specific symbol.

    - **symbol**: Ticker symbol
    - **limit**: Maximum results to return
    """
    symbol = validate_symbol_path(symbol)
    try:
        query = supabase.table("breakout_scans").select()
        query = query.eq("symbol", symbol)
        query = query.order("scanned_at", desc=True)
        query = query.limit(limit)

        results = await query.execute()

        return ResultsResponse(
            success=True,
            count=len(results),
            results=results,
            filters={"symbol": symbol}
        )

    except Exception as e:
        logger.error(f"Get symbol results failed for {symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch results")


@router.get("/top/today")
async def get_top_today(
    limit: int = Query(10, ge=1, le=50),
    user: dict = Security(get_current_user, scopes=[])
):
    """Get top-scoring setups from today's scans."""
    try:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        query = supabase.table("breakout_scans").select()
        query = query.gte("scanned_at", today.isoformat())
        query = query.order("breakout_score", desc=True)
        query = query.limit(limit)

        results = await query.execute()

        return {
            "success": True,
            "count": len(results),
            "results": results,
            "date": today.isoformat()
        }

    except Exception as e:
        logger.error(f"Get top today failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch top results")


@router.delete("/{symbol}")
async def delete_symbol_results(
    symbol: str,
    user: dict = Security(get_current_user, scopes=[])
):
    """Delete all results for a symbol (admin function)."""
    symbol = validate_symbol_path(symbol)
    try:
        # Note: DELETE operations in PostgREST need special handling
        # For now, this is a placeholder. Full implementation would need
        # to use httpx directly with DELETE method
        raise HTTPException(
            status_code=501,
            detail="Delete operation not yet implemented. Please use Supabase dashboard."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete symbol results failed for {symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Delete failed")
