from typing import List, NamedTuple
from models.candle import Candle


class VolumeQualityResult(NamedTuple):
    ok: bool
    avg_green: float
    avg_red: float


def volume_quality(candles: List[Candle], lookback: int = 30) -> VolumeQualityResult:
    """Check if volume is higher on green days than red days."""
    slice_candles = candles[-lookback:]

    green = [c.v for c in slice_candles if c.c >= c.o]
    red = [c.v for c in slice_candles if c.c < c.o]

    avg_green = sum(green) / len(green) if green else 0.0
    avg_red = sum(red) / len(red) if red else 0.0

    ok = avg_green > avg_red if avg_green or avg_red else False

    return VolumeQualityResult(ok=ok, avg_green=avg_green, avg_red=avg_red)
