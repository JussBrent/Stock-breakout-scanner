from typing import List, Optional
from models.candle import Candle
from models.candle import ScanResult
from indicators.ema import ema
from indicators.adr import adr_pct
from patterns.consolidation import is_tight_base
from patterns.resistance import pick_trigger_price
from patterns.wedge import has_higher_lows
from patterns.volume import volume_quality
from scoring.breakout_score import score_breakout, is_actionable


def avg_volume(candles: List[Candle], period: int) -> float:
    """Calculate average volume over period."""
    slice_candles = candles[-period:] if len(candles) >= period else candles
    if not slice_candles:
        return 0.0
    return sum(c.v for c in slice_candles) / len(slice_candles)


def scan_one(symbol: str, candles: List[Candle]) -> Optional[ScanResult]:
    """Scan a single ticker and return result if actionable."""
    # Need enough history for EMA200 + base detection
    if len(candles) < 260:
        return None

    closes = [c.c for c in candles]

    # Calculate EMAs
    ema21_arr = ema(closes, 21)
    ema50_arr = ema(closes, 50)
    ema200_arr = ema(closes, 200)

    price = closes[-1]
    ema21 = ema21_arr[-1]
    ema50 = ema50_arr[-1]
    ema200 = ema200_arr[-1]

    # HARD FILTER 1: Above key EMAs (trend alignment)
    if not (price > ema21 and price > ema50 and price > ema200):
        return None

    # HARD FILTER 2: Volume (liquidity)
    avg_vol_50 = avg_volume(candles, 50)
    if avg_vol_50 < 1_000_000:
        return None

    # HARD FILTER 3: ADR% (movement potential)
    adr14 = adr_pct(candles, 14)
    if adr14 < 2.0:
        return None

    # PATTERNS
    base = is_tight_base(candles, 120)
    wedge = has_higher_lows(candles, 3)
    vol = volume_quality(candles, 30)

    # TRIGGER PRICE
    trigger_info = pick_trigger_price(candles)
    if not trigger_info["trigger"]:
        return None

    trigger_price = trigger_info["trigger"]
    distance_pct = ((trigger_price - price) / price) * 100

    # HARD FILTER 4: Actionable distance
    if not is_actionable(abs(distance_pct)):
        return None

    # SCORING
    score_result = score_breakout(
        {
            "tight_base": base.ok,
            "range_pct": base.range_pct,
            "atr_down": base.atr_down,
            "higher_lows": wedge.ok,
            "flat_top_touches": trigger_info["cluster_touches"],
            "distance_pct": abs(distance_pct),
            "volume_ok": vol.ok,
        }
    )

    # Setup type
    setup_type = "UNKNOWN"
    if trigger_info["cluster_touches"] >= 3:
        setup_type = "FLAT_TOP"
    elif wedge.ok:
        setup_type = "WEDGE"
    elif base.ok:
        setup_type = "BASE"

    return ScanResult(
        symbol=symbol,
        price=price,
        trigger_price=trigger_price,
        distance_pct=abs(distance_pct),
        adr_pct_14=adr14,
        ema21=ema21,
        ema50=ema50,
        ema200=ema200,
        avg_vol_50=avg_vol_50,
        setup_type=setup_type,
        breakout_score=score_result["score"],
        notes=score_result["notes"],
    )
