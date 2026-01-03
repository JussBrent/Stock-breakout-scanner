from typing import List


def clamp(n: float, min_val: float, max_val: float) -> float:
    """Clamp value between min and max."""
    return max(min_val, min(max_val, n))


def score_breakout(params: dict) -> dict:
    """Calculate 0-100 breakout quality score."""
    score = 0
    notes = []

    # Base + contraction (40 points max)
    if params.get("tight_base"):
        score += 20
        notes.append("tight base")
    else:
        range_pct = params.get("range_pct", 0)
        score += clamp(20 - range_pct, 0, 15)

    if params.get("atr_down"):
        score += 20
        notes.append("vol contraction")

    # Structure (15 points)
    if params.get("higher_lows"):
        score += 15
        notes.append("higher lows")

    # Resistance quality (20 points)
    cluster_touches = params.get("flat_top_touches", 0)
    if cluster_touches >= 3:
        score += 20
        notes.append("flat top resistance")
    elif cluster_touches == 2:
        score += 12
    else:
        score += 6

    # Volume (15 points)
    if params.get("volume_ok"):
        score += 15
        notes.append("volume confirms")

    # Distance to breakout (10 points, closer is better)
    distance_pct = params.get("distance_pct", 0)
    dist_score = clamp(10 - (distance_pct / 3) * 10, 0, 10)
    score += dist_score

    if distance_pct <= 1.5:
        notes.append("near trigger")

    return {
        "score": int(clamp(score, 0, 100)),
        "notes": notes,
    }


def is_actionable(distance_pct: float) -> bool:
    """Check if setup is close enough to breakout level to be actionable."""
    return distance_pct <= 3.0
