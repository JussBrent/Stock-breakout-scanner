from typing import List, NamedTuple, Optional
from models.candle import Candle
from indicators.pivots import pivot_highs, pivot_lows


class BreakoutLevel(NamedTuple):
    """A single breakout level."""
    price: float
    level_type: str  # "resistance", "support", "round_number"
    strength: int  # 1-10, higher is stronger
    touches: int  # Number of times tested
    last_test_index: int  # Index of most recent test


class BreakoutLevelsResult(NamedTuple):
    """Collection of breakout levels."""
    resistance_levels: List[BreakoutLevel]
    support_levels: List[BreakoutLevel]
    strongest_resistance: Optional[BreakoutLevel]
    strongest_support: Optional[BreakoutLevel]


def find_round_numbers(price: float, range_pct: float = 10) -> List[float]:
    """
    Find significant round numbers near the current price.

    Args:
        price: Current price
        range_pct: Percentage range to search (default 10%)

    Returns:
        List of significant round numbers
    """
    round_numbers = []

    # Determine magnitude
    if price < 10:
        increments = [1, 5]  # $1, $5 levels
    elif price < 50:
        increments = [5, 10]  # $5, $10 levels
    elif price < 100:
        increments = [10, 25]  # $10, $25 levels
    else:
        increments = [25, 50, 100]  # $25, $50, $100 levels

    lower_bound = price * (1 - range_pct / 100)
    upper_bound = price * (1 + range_pct / 100)

    for inc in increments:
        # Find nearest round numbers
        start = int(lower_bound / inc) * inc
        current = start
        while current <= upper_bound:
            if lower_bound <= current <= upper_bound:
                round_numbers.append(float(current))
            current += inc

    return sorted(set(round_numbers))


def calculate_level_strength(
    level: float,
    touches: int,
    last_test_bars_ago: int,
    is_round_number: bool
) -> int:
    """
    Calculate strength score for a breakout level.

    Args:
        level: Price level
        touches: Number of times tested
        last_test_bars_ago: How many bars since last test
        is_round_number: Whether level is a round number

    Returns:
        Strength score 1-10
    """
    strength = 0

    # More touches = stronger level
    if touches >= 5:
        strength += 4
    elif touches >= 3:
        strength += 3
    elif touches >= 2:
        strength += 2
    else:
        strength += 1

    # Recent tests are more relevant
    if last_test_bars_ago <= 10:
        strength += 3
    elif last_test_bars_ago <= 30:
        strength += 2
    else:
        strength += 1

    # Round numbers add psychological significance
    if is_round_number:
        strength += 2

    return min(strength, 10)


def detect_breakout_levels(
    candles: List[Candle],
    lookback: int = 120,
    tolerance_pct: float = 0.5
) -> BreakoutLevelsResult:
    """
    Detect key breakout levels (resistance and support).

    Args:
        candles: List of candle data
        lookback: Days to look back for levels
        tolerance_pct: Clustering tolerance (%)

    Returns:
        BreakoutLevelsResult with resistance and support levels
    """
    if len(candles) < lookback:
        lookback = len(candles)

    recent_candles = candles[-lookback:]
    current_price = candles[-1].c

    # Find pivot highs (resistance) and lows (support)
    pivot_highs_list = pivot_highs(recent_candles, 3, 3)
    pivot_lows_list = pivot_lows(recent_candles, 3, 3)

    # Find round numbers
    round_numbers = find_round_numbers(current_price, range_pct=15)

    # Build resistance levels
    resistance_levels = []
    for pivot in pivot_highs_list:
        # Check if near round number
        is_round = any(
            abs(pivot.price - rn) / pivot.price * 100 < tolerance_pct
            for rn in round_numbers
        )

        # Count touches (how many times price tested this level)
        touches = sum(
            1 for c in recent_candles
            if abs(c.h - pivot.price) / pivot.price * 100 < tolerance_pct
        )

        bars_ago = len(recent_candles) - pivot.i - 1
        strength = calculate_level_strength(pivot.price, touches, bars_ago, is_round)

        resistance_levels.append(BreakoutLevel(
            price=pivot.price,
            level_type="resistance",
            strength=strength,
            touches=touches,
            last_test_index=pivot.i
        ))

    # Build support levels
    support_levels = []
    for pivot in pivot_lows_list:
        is_round = any(
            abs(pivot.price - rn) / pivot.price * 100 < tolerance_pct
            for rn in round_numbers
        )

        touches = sum(
            1 for c in recent_candles
            if abs(c.l - pivot.price) / pivot.price * 100 < tolerance_pct
        )

        bars_ago = len(recent_candles) - pivot.i - 1
        strength = calculate_level_strength(pivot.price, touches, bars_ago, is_round)

        support_levels.append(BreakoutLevel(
            price=pivot.price,
            level_type="support",
            strength=strength,
            touches=touches,
            last_test_index=pivot.i
        ))

    # Sort by strength
    resistance_levels.sort(key=lambda x: x.strength, reverse=True)
    support_levels.sort(key=lambda x: x.strength, reverse=True)

    # Find strongest levels above/below current price
    strongest_resistance = None
    for level in resistance_levels:
        if level.price > current_price:
            strongest_resistance = level
            break

    strongest_support = None
    for level in support_levels:
        if level.price < current_price:
            strongest_support = level
            break

    return BreakoutLevelsResult(
        resistance_levels=resistance_levels[:10],  # Top 10
        support_levels=support_levels[:10],  # Top 10
        strongest_resistance=strongest_resistance,
        strongest_support=strongest_support
    )
