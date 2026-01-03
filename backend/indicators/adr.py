from typing import List
from models.candle import Candle


def adr_pct(candles: List[Candle], period: int) -> float:
    """Calculate Average Daily Range (%)."""
    if len(candles) < period:
        return 0.0

    recent = candles[-period:]
    ranges_pct = [((c.h - c.l) / c.c) * 100 for c in recent]
    avg = sum(ranges_pct) / len(ranges_pct)
    return avg
