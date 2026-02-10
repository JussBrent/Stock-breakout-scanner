from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from models.candle import ScanResult
import re

# Request Models
class UniverseScanRequest(BaseModel):
    """Request model for universe scan."""
    symbols: Optional[List[str]] = Field(
        None,
        description="List of symbols to scan (empty = default universe)",
        example=["AAPL", "MSFT", "NVDA"],
        max_length=100
    )
    save_to_db: bool = Field(
        True,
        description="Save results to database"
    )
    use_mock: bool = Field(
        False,
        description="Use mock data for testing"
    )

    @field_validator('symbols')
    @classmethod
    def validate_symbols(cls, v):
        """Validate and sanitize stock symbols."""
        if v is None:
            return v

        if len(v) > 100:
            raise ValueError("Maximum 100 symbols allowed per scan")

        validated = []
        for symbol in v:
            # Remove whitespace and convert to uppercase
            symbol = symbol.strip().upper()

            # Validate symbol format (letters and optionally dots/hyphens)
            if not re.match(r'^[A-Z]{1,10}([.-][A-Z]{1,5})?$', symbol):
                raise ValueError(f"Invalid symbol format: {symbol}. Must be 1-10 uppercase letters, optionally followed by a dot or hyphen and 1-5 letters.")

            validated.append(symbol)

        return validated


class SymbolScanRequest(BaseModel):
    """Request model for single symbol scan."""
    symbol: str = Field(
        ...,
        description="Stock ticker symbol",
        example="AAPL",
        min_length=1,
        max_length=10
    )

    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, v):
        """Validate and sanitize stock symbol."""
        # Remove whitespace and convert to uppercase
        symbol = v.strip().upper()

        # Validate symbol format (letters and optionally dots/hyphens)
        if not re.match(r'^[A-Z]{1,10}([.-][A-Z]{1,5})?$', symbol):
            raise ValueError(f"Invalid symbol format: {symbol}. Must be 1-10 uppercase letters.")

        return symbol


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
