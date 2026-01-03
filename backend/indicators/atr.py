from typing import List
from models.candle import Candle


def atr(candles: List[Candle], period: int) -> List[float]:
    """Calculate Average True Range (Wilder's smoothing)."""
    if len(candles) < 2:
        return []

    tr = []
    for i in range(1, len(candles)):
        prev_close = candles[i - 1].c
        high = candles[i].h
        low = candles[i].l
        true_range = max(
            high - low,
            abs(high - prev_close),
            abs(low - prev_close),
        )
        tr.append(true_range)

    # Wilder's smoothing
    out = []
    first = sum(tr[:period]) / period
    out.append(first)

    for i in range(period, len(tr)):
        cur = (out[-1] * (period - 1) + tr[i]) / period
        out.append(cur)

    # Align length with candles (pad front)
    pad_len = len(candles) - len(out)
    return [out[0]] * pad_len + out if out else [0] * len(candles)
