from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends, Request
import asyncio
from datetime import datetime, timezone

from schemas.api_models import (
    UniverseScanRequest,
    SymbolScanRequest,
    ScanResponse,
    ScanStatusResponse
)
from scan.scan_universe import scan_universe, scan_one_symbol
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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
