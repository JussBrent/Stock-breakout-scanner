import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from models.candle import ScanResult
from providers.polygon import get_daily_candles, get_market_cap_usd
from scan.scan_one import scan_one
from config import settings

logger = logging.getLogger(__name__)

# Parse default universe from settings
DEFAULT_UNIVERSE = [s.strip() for s in settings.DEFAULT_SCAN_UNIVERSE.split(",")]


def days_ago(n: int) -> datetime:
    """Get date n days ago."""
    d = datetime.utcnow()
    d = d.replace(hour=0, minute=0, second=0, microsecond=0)
    return d - timedelta(days=n)


async def scan_one_symbol(symbol: str) -> Optional[ScanResult]:
    """Scan a single symbol, fetch data, apply logic."""
    try:
        from_date = days_ago(settings.SCAN_LOOKBACK_DAYS)
        to_date = datetime.utcnow()

        # Add delay between API calls to respect rate limits
        await asyncio.sleep(settings.SCAN_API_DELAY)

        candles, market_cap = await asyncio.gather(
            get_daily_candles(symbol, from_date, to_date, adjusted=True),
            get_market_cap_usd(symbol),
        )

        # Hard filter: market cap
        if market_cap is not None and market_cap < 300_000_000:
            return None

        result = scan_one(symbol, candles)
        if result:
            result.market_cap = market_cap

        return result
    except Exception as e:
        logger.error(f"Error scanning {symbol}: {e}")
        return None


async def scan_universe(symbols: List[str] = None) -> List[ScanResult]:
    """Scan entire universe, return actionable setups."""
    if symbols is None:
        symbols = DEFAULT_UNIVERSE

    # Run scans concurrently to respect Polygon rate limits
    semaphore = asyncio.Semaphore(settings.SCAN_CONCURRENCY_LIMIT)

    async def bounded_scan(symbol):
        async with semaphore:
            return await scan_one_symbol(symbol)

    tasks = [bounded_scan(sym) for sym in symbols]
    raw = await asyncio.gather(*tasks)
    results = [r for r in raw if r is not None]

    # Sort best first
    results.sort(key=lambda x: x.breakout_score, reverse=True)

    return results
