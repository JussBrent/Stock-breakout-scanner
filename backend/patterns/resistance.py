from typing import List, NamedTuple
from models.candle import Candle
from indicators.pivots import pivot_highs


class Cluster(NamedTuple):
    level: float
    touches: int
    members: List[float]


def cluster_resistance_levels(
    highs: List[float], tolerance_pct: float = 0.3
) -> List[Cluster]:
    """Cluster resistance levels by proximity."""
    sorted_highs = sorted(highs)
    clusters = []

    for p in sorted_highs:
        placed = False
        for i, c in enumerate(clusters):
            tol = (c.level * tolerance_pct) / 100
            if abs(p - c.level) <= tol:
                # Update cluster mean
                new_level = (c.level * c.touches + p) / (c.touches + 1)
                clusters[i] = Cluster(
                    level=new_level,
                    touches=c.touches + 1,
                    members=c.members + [p],
                )
                placed = True
                break

        if not placed:
            clusters.append(Cluster(level=p, touches=1, members=[p]))

    # Sort by quality (most touches first)
    clusters.sort(key=lambda x: x.touches, reverse=True)
    return clusters


def find_inside_day_high(candles: List[Candle]) -> float | None:
    """Find inside day high (price contained within previous candle)."""
    if len(candles) < 3:
        return None

    a = candles[-2]
    b = candles[-1]

    # Inside day: current high <= prev high AND current low >= prev low
    if b.h <= a.h and b.l >= a.l:
        return b.h

    return None


def pick_trigger_price(candles: List[Candle]) -> dict:
    """Select breakout trigger level with priority."""
    pivots = pivot_highs(candles, 3, 3)
    recent_pivots = pivots[-20:] if len(pivots) > 20 else pivots
    pivot_prices = [p.price for p in recent_pivots]

    clusters = cluster_resistance_levels(pivot_prices, 0.3)
    best_cluster = clusters[0] if clusters else None
    last_swing_high = pivot_prices[-1] if pivot_prices else None
    inside_high = find_inside_day_high(candles)

    # Priority:
    # 1) flat top (cluster touches >= 3)
    # 2) inside day high
    # 3) last swing high
    trigger = None
    reason = "UNKNOWN"
    cluster_touches = 0

    if best_cluster and best_cluster.touches >= 3:
        trigger = best_cluster.level
        reason = "FLAT_TOP_CLUSTER"
        cluster_touches = best_cluster.touches
    elif inside_high:
        trigger = inside_high
        reason = "INSIDE_DAY_HIGH"
    elif last_swing_high:
        trigger = last_swing_high
        reason = "SWING_HIGH"

    return {
        "trigger": trigger,
        "reason": reason,
        "cluster_touches": cluster_touches,
    }
