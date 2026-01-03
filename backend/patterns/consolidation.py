from typing import List, NamedTuple
from models.candle import Candle
from indicators.atr import atr


class TightBaseResult(NamedTuple):
    ok: bool
    range_pct: float
    atr_down: bool


def is_tight_base(candles: List[Candle], lookback_days: int = 120) -> TightBaseResult:
    """Detect tight consolidation base over ~4-6 months."""
    if len(candles) < lookback_days + 10:
        return TightBaseResult(ok=False, range_pct=0.0, atr_down=False)

    slice_candles = candles[-lookback_days:]
    highest_high = max(c.h for c in slice_candles)
    lowest_low = min(c.l for c in slice_candles)
    range_pct = ((highest_high - lowest_low) / lowest_low) * 100

    # ATR contraction over last ~60 days
    atr14 = atr(candles, 14)
    recent = atr14[-60:]

    if len(recent) < 30:
        return TightBaseResult(ok=False, range_pct=range_pct, atr_down=False)

    first_half = sum(recent[:30]) / 30
    second_half = sum(recent[30:]) / 30
    atr_down = second_half < first_half

    # "tight" threshold
    ok = range_pct < 25 and atr_down

    return TightBaseResult(ok=ok, range_pct=range_pct, atr_down=atr_down)
