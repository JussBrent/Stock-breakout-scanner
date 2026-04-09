import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from models.candle import ScanResult
from providers.polygon import get_daily_candles, get_market_cap_usd
from scan.scan_one import scan_one, avg_volume
from indicators.ema import ema
from indicators.adr import adr_pct
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


async def get_symbol_technicals(symbol: str) -> Dict[str, Any]:
    """
    Fetch Polygon data and compute full technicals for a symbol.
    No hard filters — always returns data. Raises on data fetch failure.
    """
    from_date = days_ago(settings.SCAN_LOOKBACK_DAYS)
    to_date = datetime.utcnow()

    candles, market_cap = await asyncio.gather(
        get_daily_candles(symbol, from_date, to_date, adjusted=True),
        get_market_cap_usd(symbol),
    )

    if len(candles) < 50:
        raise ValueError(f"Not enough price history for {symbol} ({len(candles)} candles)")

    closes = [c.c for c in candles]
    price = closes[-1]

    ema21_val = ema(closes, 21)[-1] if len(closes) >= 21 else None
    ema50_val = ema(closes, 50)[-1] if len(closes) >= 50 else None
    ema200_val = ema(closes, 200)[-1] if len(closes) >= 200 else None
    avg_vol = avg_volume(candles, 50)
    adr14 = adr_pct(candles, 14)

    # Attempt full breakout scan (may return None if filters not met)
    scan_result: Optional[ScanResult] = None
    if len(candles) >= 260:
        scan_result = scan_one(symbol, candles)
        if scan_result:
            scan_result.market_cap = market_cap

    # Trend assessment
    trend = "Mixed / Consolidating"
    if ema21_val and ema50_val and ema200_val:
        if price > ema21_val > ema50_val > ema200_val:
            trend = "Strong Uptrend — all EMAs aligned bullishly"
        elif price > ema50_val > ema200_val:
            trend = "Moderate Uptrend — above 50 & 200 EMA"
        elif price > ema21_val:
            trend = "Short-term Uptrend — above 21 EMA only"
        elif price < ema21_val < ema50_val < ema200_val:
            trend = "Downtrend — below all EMAs"

    return {
        "symbol": symbol,
        "price": price,
        "ema21": ema21_val,
        "ema50": ema50_val,
        "ema200": ema200_val,
        "adr_pct_14": adr14,
        "avg_vol_50": avg_vol,
        "market_cap": market_cap,
        "candle_count": len(candles),
        "trend": trend,
        "scan_result": scan_result,
    }


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
