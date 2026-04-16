from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

from schemas.api_models import (
    UniverseScanRequest,
    SymbolScanRequest,
    ScanResponse,
    ScanStatusResponse
)


class ContentAnalysisRequest(BaseModel):
    text_content: Optional[str] = None
    image_base64: Optional[str] = None
    media_type: str = "image/png"
from scan.scan_universe import scan_universe, scan_one_symbol, get_symbol_technicals
from services.save_results import save_scan_results
from scan.mock_results import get_mock_results
from services.task_manager import task_manager
from services.ai_analysis import get_ai_service
from middleware.rate_limit import limiter
from middleware.auth import get_current_user, security

router = APIRouter()


@router.post("/universe", response_model=ScanResponse)
@limiter.limit("10/minute", key_func=lambda request: request.client.host)
async def scan_universe_endpoint(
    request: Request,
    body: UniverseScanRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """
    Scan multiple symbols for breakout patterns.
    Requires authentication. Limited to 10 scans per minute.
    """
    try:
        if body.use_mock:
            results = await get_mock_results()
        else:
            symbols = body.symbols if body.symbols else None
            results = await scan_universe(symbols)

        if body.save_to_db and results:
            background_tasks.add_task(save_scan_results, results)

        return ScanResponse(
            success=True,
            count=len(results),
            results=results,
            message=f"Found {len(results)} actionable setups"
        )

    except Exception as e:
        logger.error(f"Universe scan failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Scan failed")


@router.post("/symbol", response_model=ScanResponse)
@limiter.limit("30/minute", key_func=lambda request: request.client.host)
async def scan_symbol_endpoint(
    request: Request,
    body: SymbolScanRequest,
    user: dict = Depends(get_current_user)
):
    """
    Scan a single symbol for breakout patterns.
    Requires authentication. Limited to 30 scans per minute.
    """
    try:
        result = await scan_one_symbol(body.symbol.upper())

        if result is None:
            return ScanResponse(
                success=True,
                count=0,
                results=[],
                message=f"{body.symbol} did not pass filters"
            )

        return ScanResponse(
            success=True,
            count=1,
            results=[result],
            message=f"Scan complete for {body.symbol}"
        )

    except Exception as e:
        logger.error(f"Symbol scan failed for {body.symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Scan failed")


@router.post("/universe/background")
@limiter.limit("5/minute", key_func=lambda request: request.client.host)
async def scan_universe_background(
    request: Request,
    body: UniverseScanRequest,
    user: dict = Depends(get_current_user)
):
    """
    Start universe scan as background task.
    Requires authentication. Limited to 5 background scans per minute.
    Returns task_id to check status later.
    """
    task_id = f"scan_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{id(body)}"

    async def background_scan():
        try:
            task_manager.start_task(task_id)

            if body.use_mock:
                results = await get_mock_results()
            else:
                symbols = body.symbols if body.symbols else None
                results = await scan_universe(symbols)

            if body.save_to_db and results:
                await save_scan_results(results)

            task_manager.complete_task(task_id, {
                "results": results,
                "count": len(results)
            })
        except Exception as e:
            task_manager.fail_task(task_id, str(e))

    task_manager.create_task(task_id, {"type": "universe_scan"})
    asyncio.create_task(background_scan())

    return {
        "task_id": task_id,
        "status": "started",
        "message": "Scan started in background"
    }


@router.get("/status/{task_id}", response_model=ScanStatusResponse)
@limiter.limit("60/minute")
async def get_scan_status(
    request: Request,
    task_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Check status of background scan task.
    Requires authentication. Limited to 60 requests per minute.
    """
    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    results = None
    count = 0
    if task.result and isinstance(task.result, dict):
        results = task.result.get("results")
        count = task.result.get("count", 0)

    return ScanStatusResponse(
        task_id=task_id,
        status=task.status,
        results=results,
        count=count,
        error=task.error
    )


@router.post("/symbol/ai")
@limiter.limit("10/minute", key_func=lambda request: request.client.host)
async def ai_scan_symbol(
    request: Request,
    body: SymbolScanRequest,
    user: dict = Depends(get_current_user)
):
    """
    Fetch Polygon data for any symbol and return a full Claude AI analysis.
    Works regardless of whether the symbol passes breakout filters.
    """
    try:
        technicals = await get_symbol_technicals(body.symbol.upper())
        ai_service = get_ai_service()
        result = await ai_service.analyze_symbol_technicals(technicals)
        return {"success": True, "result": result}
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid symbol or insufficient data")
    except Exception as e:
        logger.error(f"AI scan failed for {body.symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI scan failed")


@router.post("/analyze-content")
@limiter.limit("10/minute", key_func=lambda request: request.client.host)
async def analyze_content(
    request: Request,
    body: ContentAnalysisRequest,
    user: dict = Depends(get_current_user)
):
    """
    Analyze chart image or news text using Sean AI.
    Send either text_content or image_base64 (not both).
    """
    if not body.text_content and not body.image_base64:
        raise HTTPException(status_code=422, detail="Provide text_content or image_base64")

    try:
        ai_service = get_ai_service()
        analysis = await ai_service.analyze_content(
            text_content=body.text_content,
            image_base64=body.image_base64,
            media_type=body.media_type,
        )
        return {"success": True, "analysis": analysis}
    except Exception as e:
        logger.error(f"Content analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Content analysis failed")


@router.post("/ai-analyze")
@limiter.limit("3/minute", key_func=lambda request: request.client.host)
async def ai_analyze_scan(
    request: Request,
    body: UniverseScanRequest,
    top_n: int = 10,
    user: dict = Depends(get_current_user)
):
    """
    Scan universe and return AI-rated top opportunities.
    Requires authentication. Limited to 3 requests per minute.
    """
    try:
        if body.use_mock:
            results = await get_mock_results()
        else:
            symbols = body.symbols if body.symbols else None
            results = await scan_universe(symbols)

        if not results:
            return {
                "success": True,
                "count": 0,
                "ratings": [],
                "message": "No setups found to analyze"
            }

        ai_service = get_ai_service()
        ratings = await ai_service.analyze_stocks(results, top_n=top_n)

        return {
            "success": True,
            "count": len(ratings),
            "ratings": [rating.model_dump() for rating in ratings],
            "message": f"Analyzed {len(results)} stocks, returning top {len(ratings)}"
        }

    except ValueError as e:
        logger.error(f"AI service error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI service error")
    except Exception as e:
        logger.error(f"AI analyze scan failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI analyze scan failed")
