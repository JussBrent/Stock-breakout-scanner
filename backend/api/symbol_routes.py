from fastapi import APIRouter, HTTPException, Security
from typing import List
from datetime import datetime, timedelta, timezone
import logging

from schemas.api_models import SymbolInfo, validate_symbol_path
from providers.polygon import get_market_cap_usd, get_daily_candles
from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Default universe (can be moved to database later)
DEFAULT_UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "AMZN", "TSLA", "GOOGL", "META", "NFLX",
    "AMD", "INTC", "CRM", "ORCL", "ADBE", "PYPL", "SQ", "SHOP"
]


@router.get("/universe", response_model=List[str])
async def get_universe(user: dict = Security(get_current_user, scopes=[])):
    """Get list of symbols in default scanning universe."""
    return DEFAULT_UNIVERSE


@router.get("/{symbol}/info", response_model=SymbolInfo)
async def get_symbol_info(
    symbol: str,
    user: dict = Security(get_current_user, scopes=[])
):
    """
    Get basic information about a symbol.

    - **symbol**: Ticker symbol
    """
    symbol = validate_symbol_path(symbol)
    try:
        # Fetch market cap
        market_cap = await get_market_cap_usd(symbol)

        # Fetch recent price data
        from_date = datetime.now(timezone.utc) - timedelta(days=5)
        to_date = datetime.now(timezone.utc)
        candles = await get_daily_candles(symbol, from_date, to_date)

        current_price = candles[-1].c if candles else None

        return SymbolInfo(
            symbol=symbol,
            market_cap=market_cap,
            current_price=current_price,
            data_available=len(candles) > 0
        )

    except Exception as e:
        logger.error(f"Get symbol info failed for {symbol}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch symbol info")


@router.post("/validate")
async def validate_symbols(
    symbols: List[str],
    user: dict = Security(get_current_user, scopes=[])
):
    """
    Validate that symbols are valid and have data.

    Returns list of valid and invalid symbols.
    """
    valid = []
    invalid = []

    for symbol in symbols:
        try:
            from_date = datetime.now(timezone.utc) - timedelta(days=5)
            to_date = datetime.now(timezone.utc)
            candles = await get_daily_candles(symbol.upper(), from_date, to_date)
            if candles and len(candles) > 0:
                valid.append(symbol)
            else:
                invalid.append(symbol)
        except Exception:
            invalid.append(symbol)

    return {
        "valid": valid,
        "invalid": invalid,
        "total_requested": len(symbols),
        "valid_count": len(valid)
    }
