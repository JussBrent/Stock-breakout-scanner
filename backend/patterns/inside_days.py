from typing import List, NamedTuple, Optional
from models.candle import Candle


class InsideDayResult(NamedTuple):
    """Result of inside day detection."""
    is_inside: bool
    inside_high: Optional[float]
    inside_low: Optional[float]
    parent_index: Optional[int]


def detect_inside_day(candles: List[Candle], index: int = -1) -> InsideDayResult:
    """
    Detect inside day pattern at specified index.

    Inside day: Current candle's range is completely contained within previous candle.
    - current_high <= previous_high
    - current_low >= previous_low

    Args:
        candles: List of candle data
        index: Index to check (default: -1 for most recent)

    Returns:
        InsideDayResult with detection status and levels
    """
    if len(candles) < 2:
        return InsideDayResult(False, None, None, None)

    if index < 0:
        index = len(candles) + index

    if index < 1:
        return InsideDayResult(False, None, None, None)

    current = candles[index]
    parent = candles[index - 1]

    is_inside = (current.h <= parent.h) and (current.l >= parent.l)

    if is_inside:
        return InsideDayResult(
            is_inside=True,
            inside_high=current.h,
            inside_low=current.l,
            parent_index=index - 1
        )

    return InsideDayResult(False, None, None, None)


def count_consecutive_inside_days(candles: List[Candle]) -> int:
    """
    Count consecutive inside days from the most recent candle.

    Returns:
        Number of consecutive inside days
    """
    count = 0

    for i in range(len(candles) - 1, 0, -1):
        result = detect_inside_day(candles, i)
        if result.is_inside:
            count += 1
        else:
            break

    return count


def find_inside_day_breakout_level(candles: List[Candle]) -> dict:
    """
    Find the breakout level for an inside day pattern.

    Returns:
        Dictionary with breakout levels and pattern info
    """
    result = detect_inside_day(candles)

    if not result.is_inside:
        return {
            "has_pattern": False,
            "breakout_high": None,
            "breakout_low": None
        }

    parent = candles[result.parent_index]
    consecutive = count_consecutive_inside_days(candles)

    return {
        "has_pattern": True,
        "breakout_high": parent.h,  # Break above parent high
        "breakout_low": parent.l,   # Break below parent low
        "consecutive_inside_days": consecutive,
        "compression_range": parent.h - parent.l,
        "compression_pct": ((parent.h - parent.l) / parent.l) * 100
    }
