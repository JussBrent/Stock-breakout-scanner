from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from models.candle import ScanResult

# Request Models
class UniverseScanRequest(BaseModel):
    """Request model for universe scan."""
    symbols: Optional[List[str]] = Field(
        None,
        description="List of symbols to scan (empty = default universe)",
        example=["AAPL", "MSFT", "NVDA"]
    )
    save_to_db: bool = Field(
        True,
        description="Save results to database"
    )
    use_mock: bool = Field(
        False,
        description="Use mock data for testing"
    )


class SymbolScanRequest(BaseModel):
    """Request model for single symbol scan."""
    symbol: str = Field(
        ...,
        description="Stock ticker symbol",
        example="AAPL",
        min_length=1,
        max_length=10
    )


class FilterParams(BaseModel):
    """Filter parameters for results queries."""
    min_score: Optional[int] = Field(None, ge=0, le=100)
    setup_type: Optional[Literal["FLAT_TOP", "WEDGE", "FLAG", "BASE", "UNKNOWN"]] = None
    days_back: int = Field(7, ge=1, le=30)


# Response Models
class ScanResponse(BaseModel):
    """Response model for scan operations."""
    success: bool
    count: int
    results: List[ScanResult]
    message: str


class ResultsResponse(BaseModel):
    """Response model for results queries."""
    success: bool
    count: int
    results: List[dict]  # Raw Supabase results
    filters: Optional[dict] = None


class ScanStatusResponse(BaseModel):
    """Response model for background task status."""
    task_id: str
    status: Literal["running", "completed", "failed"]
    results: Optional[List[ScanResult]] = None
    count: int = 0
    error: Optional[str] = None


class SymbolInfo(BaseModel):
    """Symbol information response."""
    symbol: str
    market_cap: Optional[float]
    current_price: Optional[float]
    data_available: bool


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: Literal["healthy", "degraded", "unhealthy"]
    polygon_api: bool
    supabase: bool
