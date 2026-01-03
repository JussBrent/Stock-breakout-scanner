from typing import List


def ema(values: List[float], period: int) -> List[float]:
    """Calculate Exponential Moving Average."""
    if not values:
        return []

    k = 2 / (period + 1)
    out = []
    prev = values[0]
    out.append(prev)

    for i in range(1, len(values)):
        cur = values[i] * k + prev * (1 - k)
        out.append(cur)
        prev = cur

    return out
