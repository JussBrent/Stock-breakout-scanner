from typing import List, NamedTuple
from models.candle import Candle


class Pivot(NamedTuple):
    i: int
    price: float


def pivot_highs(candles: List[Candle], left: int = 3, right: int = 3) -> List[Pivot]:
    """Find pivot highs (local maxima)."""
    out = []
    for i in range(left, len(candles) - right):
        h = candles[i].h
        ok = True

        for j in range(i - left, i):
            if candles[j].h >= h:
                ok = False
                break

        if ok:
            for j in range(i + 1, i + right + 1):
                if j < len(candles) and candles[j].h > h:
                    ok = False
                    break

        if ok:
            out.append(Pivot(i, h))

    return out


def pivot_lows(candles: List[Candle], left: int = 3, right: int = 3) -> List[Pivot]:
    """Find pivot lows (local minima)."""
    out = []
    for i in range(left, len(candles) - right):
        l = candles[i].l
        ok = True

        for j in range(i - left, i):
            if candles[j].l <= l:
                ok = False
                break

        if ok:
            for j in range(i + 1, i + right + 1):
                if j < len(candles) and candles[j].l < l:
                    ok = False
                    break

        if ok:
            out.append(Pivot(i, l))

    return out
