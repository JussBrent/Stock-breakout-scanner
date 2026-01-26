from fastapi import APIRouter, BackgroundTasks, HTTPException
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

router = APIRouter()


@router.post("/universe", response_model=ScanResponse)
async def scan_universe_endpoint(
    request: UniverseScanRequest,
    background_tasks: BackgroundTasks
):
    """
    Scan multiple symbols for breakout patterns.

    - **symbols**: List of ticker symbols (optional, uses default universe if empty)
    - **save_to_db**: Save results to Supabase (default: true)
    - **use_mock**: Use mock data for testing (default: false)
    """
    try:
        if request.use_mock:
            results = await get_mock_results()
        else:
            symbols = request.symbols if request.symbols else None
            results = await scan_universe(symbols)

        # Save in background if requested
        if request.save_to_db and results:
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
async def scan_symbol_endpoint(request: SymbolScanRequest):
    """
    Scan a single symbol for breakout patterns.

    - **symbol**: Ticker symbol (e.g., "AAPL", "NVDA")
    """
    try:
        result = await scan_one_symbol(request.symbol.upper())

        if result is None:
            return ScanResponse(
                success=True,
                count=0,
                results=[],
                message=f"{request.symbol} did not pass filters"
            )

        return ScanResponse(
            success=True,
            count=1,
            results=[result],
            message=f"Scan complete for {request.symbol}"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/universe/background")
async def scan_universe_background(request: UniverseScanRequest):
    """
    Start universe scan as background task.
    Returns task_id to check status later.
    """
    task_id = f"scan_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{id(request)}"

    async def background_scan():
        try:
            task_manager.start_task(task_id)

            if request.use_mock:
                results = await get_mock_results()
            else:
                symbols = request.symbols if request.symbols else None
                results = await scan_universe(symbols)

            if request.save_to_db and results:
                await save_scan_results(results)

            task_manager.complete_task(task_id, {
                "results": results,
                "count": len(results)
            })
        except Exception as e:
            task_manager.fail_task(task_id, str(e))

    # Create task entry
    task_manager.create_task(task_id, {"type": "universe_scan"})

    # Start background task
    asyncio.create_task(background_scan())

    return {
        "task_id": task_id,
        "status": "started",
        "message": "Scan started in background"
    }


@router.get("/status/{task_id}", response_model=ScanStatusResponse)
async def get_scan_status(task_id: str):
    """Check status of background scan task."""
    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Extract results from task result
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
