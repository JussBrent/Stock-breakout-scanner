from typing import List, NamedTuple
from models.candle import Candle
from indicators.pivots import pivot_lows


class HigherLowsResult(NamedTuple):
    ok: bool
    points: List[float]


def has_higher_lows(candles: List[Candle], min_count: int = 3) -> HigherLowsResult:
    """Detect ascending lows (wedge structure)."""
    lows = pivot_lows(candles, 3, 3)[-8:] if len(pivot_lows(candles, 3, 3)) > 0 else []

    if len(lows) < min_count:
        return HigherLowsResult(ok=False, points=[])

    # Pick last 3 meaningful lows
    last = [p.price for p in lows[-min_count:]]
    ok = last[0] < last[1] and last[1] < last[2]

    return HigherLowsResult(ok=ok, points=last)
