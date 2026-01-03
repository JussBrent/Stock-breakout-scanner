import asyncio
from datetime import datetime
from models.candle import ScanResult


# Mock scan results for demo (this is what your real Polygon scan would return)
MOCK_RESULTS = [
    ScanResult(
        symbol="NVDA",
        price=188.85,
        trigger_price=194.50,
        distance_pct=2.98,
        adr_pct_14=2.33,
        ema21=187.0,
        ema50=182.0,
        ema200=175.0,
        avg_vol_50=42_500_000,
        market_cap=2_900_000_000_000,
        setup_type="FLAT_TOP",
        breakout_score=85,
        notes=["tight base", "vol contraction", "flat top resistance", "near trigger"],
    ),
    ScanResult(
        symbol="MSFT",
        price=412.45,
        trigger_price=425.00,
        distance_pct=3.04,
        adr_pct_14=1.98,
        ema21=410.0,
        ema50=405.0,
        ema200=395.0,
        avg_vol_50=18_000_000,
        market_cap=3_100_000_000_000,
        setup_type="WEDGE",
        breakout_score=78,
        notes=["higher lows", "volume confirms"],
    ),
    ScanResult(
        symbol="AAPL",
        price=246.35,
        trigger_price=252.00,
        distance_pct=2.29,
        adr_pct_14=2.15,
        ema21=245.0,
        ema50=240.0,
        ema200=230.0,
        avg_vol_50=52_300_000,
        market_cap=3_600_000_000_000,
        setup_type="BASE",
        breakout_score=72,
        notes=["tight base", "near trigger"],
    ),
]


async def get_mock_results() -> list[ScanResult]:
    """Return mock scan results for testing."""
    await asyncio.sleep(0.5)  # Simulate network delay
    return MOCK_RESULTS
