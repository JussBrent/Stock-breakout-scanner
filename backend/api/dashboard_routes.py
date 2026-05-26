"""
dashboard_routes.py

Endpoints:
GET  /api/dashboard/top-setups  -- today's top 5 AI-scored setups
GET  /api/dashboard/sectors     -- sector heatmap
GET  /api/dashboard/sentiment   -- market sentiment
POST /api/dashboard/refresh     -- trigger background refresh (returns immediately)
GET  /api/dashboard/all         -- all three in one call (auto-refreshes if empty)
GET  /api/dashboard/debug       -- PUBLIC: test Polygon key + return raw data (no auth)
GET  /api/dashboard/force-refresh -- PUBLIC: trigger background refresh (no auth)
"""

import asyncio
import logging
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

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

# Track if a refresh is already running (prevent duplicate background tasks)
_refresh_running = False


async def _run_refresh_background():
    """Run dashboard refresh as background task with guard against duplicates."""
    global _refresh_running
    if _refresh_running:
        logger.info("Refresh already in progress, skipping duplicate")
        return
    _refresh_running = True
    try:
        result = await refresh_dashboard()
        logger.info("Background refresh complete: %s", result)
    except Exception as exc:
        logger.error("Background refresh failed: %s", exc)
    finally:
        _refresh_running = False


@router.get("/debug")
async def debug_polygon():
    """PUBLIC endpoint -- no auth required.
    Directly calls Polygon agg for XLK, SPY, QQQ and returns raw + parsed data.
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
            }
            if td:
                parsed[sym] = _parse_snapshot(sym, td)
    except Exception as exc:
        error_msg = str(exc)

    return {
        "polygon_key_preview": key_preview,
        "symbols_requested": test_symbols,
        "raw_snapshot_fields": raw,
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
async def refresh_endpoint(background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Trigger a full dashboard refresh as a background task.
    Returns immediately with status. Data will be ready in ~4 minutes (Polygon rate limit).
    """
    background_tasks.add_task(_run_refresh_background)
    return {
        "success": True,
        "message": "Refresh started in background. Data will update in ~4 minutes.",
        "refresh_running": _refresh_running,
    }


@router.get("/all")
async def all_dashboard_data(background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Return all three data sources in one call.
    If no data exists, triggers background refresh and returns empty/cached data.
    """
    try:
        top_setups, sectors, sentiment = await asyncio.gather(
            get_today_top_setups(),
            get_today_sectors(),
            get_today_sentiment(),
        )

        from datetime import date as _date
        today = str(_date.today())
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

        # If no data at all, start background refresh
        has_any_data = bool(top_setups) or bool(sectors) or bool(sentiment)
        auto_refresh_triggered = False
        if not has_any_data:
            logger.info("No dashboard data found -- triggering background refresh")
            background_tasks.add_task(_run_refresh_background)
            auto_refresh_triggered = True

        return {
            "success": True,
            "top_setups": top_setups,
            "sectors": sectors,
            "sentiment": sentiment if sentiment else None,
            "auto_refresh_triggered": auto_refresh_triggered,
            "market_closed": market_closed,
            "data_date": data_date,
        }
    except Exception as exc:
        logger.error("all_dashboard_data error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/force-refresh")
async def force_refresh_public(background_tasks: BackgroundTasks):
    """PUBLIC no-auth endpoint to trigger a background dashboard refresh.
    Returns immediately. Data will be ready in ~4 minutes.
    """
    background_tasks.add_task(_run_refresh_background)
    sectors = await get_today_sectors()
    sentiment = await get_today_sentiment()
    return {
        "success": True,
        "message": "Refresh started in background",
        "sectors_in_db": len(sectors),
        "sentiment_score": sentiment.get("sentiment_score") if sentiment else None,
        "sectors_sample": sectors[:3] if sectors else [],
        "refresh_running": _refresh_running,
    }
