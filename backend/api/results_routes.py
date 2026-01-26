from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, timezone

from schemas.api_models import ResultsResponse
from services.supabase_client import supabase

router = APIRouter()


@router.get("/", response_model=ResultsResponse)
async def get_recent_results(
    limit: int = Query(25, ge=1, le=100),
    min_score: Optional[int] = Query(None, ge=0, le=100),
    setup_type: Optional[str] = None,
    days_back: int = Query(7, ge=1, le=30)
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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}", response_model=ResultsResponse)
async def get_symbol_results(
    symbol: str,
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get scan results for a specific symbol.

    - **symbol**: Ticker symbol
    - **limit**: Maximum results to return
    """
    try:
        symbol = symbol.upper()

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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top/today")
async def get_top_today(limit: int = Query(10, ge=1, le=50)):
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
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{symbol}")
async def delete_symbol_results(symbol: str):
    """Delete all results for a symbol (admin function)."""
    try:
        symbol = symbol.upper()

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
        raise HTTPException(status_code=500, detail=str(e))
