"""
dashboard_routes.py

Endpoints:
GET  /api/dashboard/top-setups  -- today's top 5 AI-scored setups
GET  /api/dashboard/sectors     -- sector heatmap
GET  /api/dashboard/sentiment   -- market sentiment
POST /api/dashboard/refresh     -- trigger full refresh (runs synchronously, returns result)
GET  /api/dashboard/all         -- all three in one call
GET  /api/dashboard/debug       -- PUBLIC: test Polygon key + return raw snapshot (no auth)
"""

import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException

from middleware.auth import get_current_user
from services.dashboard_service import (
    get_today_top_setups,
    get_today_sectors,
    get_today_sentiment,
    refresh_dashboard,
    _get_all_snapshots,
    _parse_snapshot,
    _polygon_key,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/debug")
async def debug_polygon():
    """PUBLIC endpoint -- no auth required.
    Directly calls Polygon bulk snapshot for XLK, SPY, QQQ and returns raw + parsed data.
    Use this to verify the API key works and Polygon is returning correct prices.
    """
    key = _polygon_key()
    key_preview = key[:6] + "..." + key[-4:] if len(key) > 10 else ("SET" if key else "MISSING")

    test_symbols = ["XLK", "XLV", "SPY", "QQQ", "IWM"]
    raw: dict = {}
    parsed: dict = {}
    error_msg = None

    try:
        snapshots = await _get_all_snapshots(test_symbols)
        for sym in test_symbols:
            td = snapshots.get(sym.upper(), {})
            raw[sym] = {
                "found": bool(td),
                "day_c": td.get("day", {}).get("c") if td else None,
                "prevDay_c": td.get("prevDay", {}).get("c") if td else None,
                "lastTrade_p": td.get("lastTrade", {}).get("p") if td else None,
            }
            if td:
                parsed[sym] = _parse_snapshot(sym, td)
    except Exception as exc:
        error_msg = str(exc)

    return {
        "polygon_key_preview": key_preview,
        "symbols_requested": test_symbols,
        "raw_snapshot_fields": raw,
        "note": "snapshot empty on weekends -- agg fallback should populate parsed_results",
        "parsed_results": parsed,
        "error": error_msg,
    }


@router.get("/top-setups")
async def top_setups_endpoint(user: dict = Depends(get_current_user)):
    """Return today's top AI-scored setups (up to 5)."""
    try:
        data = await get_today_top_setups()
        return {"success": True, "setups": data, "count": len(data)}
    except Exception as exc:
        logger.error("top_setups_endpoint error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sectors")
async def sectors_endpoint(user: dict = Depends(get_current_user)):
    """Return today's sector performance heatmap."""
    try:
        data = await get_today_sectors()
        return {"success": True, "sectors": data, "count": len(data)}
    except Exception as exc:
        logger.error("sectors_endpoint error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/sentiment")
async def sentiment_endpoint(user: dict = Depends(get_current_user)):
    """Return today's market sentiment."""
    try:
        data = await get_today_sentiment()
        return {"success": True, "sentiment": data}
    except Exception as exc:
        logger.error("sentiment_endpoint error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/refresh")
async def refresh_endpoint(user: dict = Depends(get_current_user)):
    """Trigger a full dashboard refresh synchronously and return the result summary.
    This overwrites sector_performance and market_sentiment in Supabase with fresh data.
    """
    try:
        result = await refresh_dashboard()
        return {"success": True, "result": result}
    except Exception as exc:
        logger.error("refresh_endpoint error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/all")
async def all_dashboard_data(user: dict = Depends(get_current_user)):
    """Return all three data sources in one call.
    If no data exists for today, auto-trigger a refresh inline.
    Falls back to most recent session data when market is closed.
    """
    try:
        import asyncio
        from datetime import date as _date
        today = str(_date.today())

        top_setups, sectors, sentiment = await asyncio.gather(
            get_today_top_setups(),
            get_today_sectors(),
            get_today_sentiment(),
        )

        # Determine if data is from today or a previous session
        data_date = today
        market_closed = False
        if top_setups and top_setups[0].get("scan_date"):
            data_date = top_setups[0]["scan_date"]
            market_closed = data_date != today
        elif sectors and sectors[0].get("scan_date"):
            data_date = sectors[0]["scan_date"]
            market_closed = data_date != today
        elif sentiment and sentiment.get("scan_date"):
            data_date = sentiment["scan_date"]
            market_closed = data_date != today

        # If no data at all, run refresh inline so UI gets data on first load
        has_any_data = bool(top_setups) or bool(sectors) or bool(sentiment)
        auto_refreshed = False
        if not has_any_data:
            logger.info("No dashboard data found -- running inline refresh")
            await refresh_dashboard()
            auto_refreshed = True
            top_setups, sectors, sentiment = await asyncio.gather(
                get_today_top_setups(),
                get_today_sectors(),
                get_today_sentiment(),
            )

        return {
            "success": True,
            "top_setups": top_setups,
            "sectors": sectors,
            "sentiment": sentiment if sentiment else None,
            "auto_refresh_triggered": auto_refreshed,
            "market_closed": market_closed,
            "data_date": data_date,
        }
    except Exception as exc:
        logger.error("all_dashboard_data error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/force-refresh")
async def force_refresh_public():
    """PUBLIC no-auth endpoint to force-refresh dashboard data. Runs synchronously."""
    try:
        result = await refresh_dashboard()
        sectors = await get_today_sectors()
        sentiment = await get_today_sentiment()
        return {
            "success": True,
            "result": result,
            "sectors_written": len(sectors),
            "sentiment_score": sentiment.get("sentiment_score") if sentiment else None,
            "sectors_sample": sectors[:3] if sectors else [],
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}
