"""
dashboard_routes.py

Endpoints:
  GET  /api/dashboard/top-setups      — today's top 5 AI-scored setups
  GET  /api/dashboard/sectors         — sector heatmap
  GET  /api/dashboard/sentiment       — market sentiment
  POST /api/dashboard/refresh         — any authenticated user: trigger full refresh
  GET  /api/dashboard/all             — all three in one call (auto-refreshes if no data)
"""

import logging
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException

from middleware.auth import get_current_user
from services.dashboard_service import (
    get_today_top_setups,
    get_today_sectors,
    get_today_sentiment,
    refresh_dashboard,
)

logger = logging.getLogger(__name__)
router = APIRouter()


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
async def refresh_endpoint(
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    """Any authenticated user can trigger a full dashboard refresh in background."""
    background_tasks.add_task(refresh_dashboard)
    return {
        "success": True,
        "message": "Dashboard refresh started in background. Check back in 30-60s.",
    }


@router.get("/all")
async def all_dashboard_data(
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    """Return all three data sources in one call.
    If no data exists for today, auto-trigger a background refresh
    so the next load will have real data.
    """
    try:
        import asyncio
        top_setups, sectors, sentiment = await asyncio.gather(
            get_today_top_setups(),
            get_today_sectors(),
            get_today_sentiment(),
        )

        # Auto-trigger a background scan if we have no sector or sentiment data yet
        has_data = bool(sectors) or bool(sentiment)
        if not has_data:
            logger.info("No dashboard data for today — scheduling auto-refresh")
            background_tasks.add_task(refresh_dashboard)

        return {
            "success": True,
            "top_setups": top_setups,
            "sectors": sectors,
            "sentiment": sentiment if sentiment else None,
            "auto_refresh_triggered": not has_data,
        }
    except Exception as exc:
        logger.error("all_dashboard_data error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
