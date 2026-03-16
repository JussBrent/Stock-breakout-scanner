"""
Momentum API endpoints - real-time stock momentum data from Polygon.
Requires authentication.
"""
from fastapi import APIRouter, HTTPException, Security, status
from typing import List
import logging

from providers.polygon import polygon_get, POLYGON_BASE
from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from fastapi import Request

logger = logging.getLogger(__name__)

router = APIRouter()


def _format_volume(vol: float) -> str:
    """Format volume as human-readable string."""
    if vol >= 1_000_000_000:
        return f"{vol / 1_000_000_000:.1f}B"
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.0f}K"
    return str(int(vol))


def _calc_momentum(change_pct: float, rel_volume: float) -> int:
    """Calculate momentum score (0-100) from price change and relative volume."""
    # Price change contributes 60%, relative volume 40%
    price_score = min(abs(change_pct) * 10, 60)
    vol_score = min(rel_volume * 10, 40)
    return min(int(price_score + vol_score), 100)


def _calc_breakout_strength(change_pct: float, rel_volume: float, from_high_pct: float) -> int:
    """Calculate breakout strength (0-100)."""
    # Closer to 52w high = stronger breakout, high volume = confirmation
    high_score = max(0, 40 - abs(from_high_pct) * 4)  # 0-40 points
    vol_score = min(rel_volume * 15, 30)  # 0-30 points
    change_score = min(abs(change_pct) * 6, 30)  # 0-30 points
    return min(int(high_score + vol_score + change_score), 100)


def _calc_efficiency(change_pct: float, high: float, low: float, open_price: float) -> int:
    """Calculate efficiency (0-100) - how cleanly price moved in one direction."""
    if high == low or open_price == 0:
        return 50
    total_range = high - low
    close_move = abs(change_pct)
    # Efficiency = directional move / total range
    efficiency = min(close_move / max(total_range / open_price * 100, 0.01), 1.0)
    return min(int(efficiency * 100), 100)


def _classify_trend(change_pct: float) -> str:
    """Classify trend based on daily change."""
    if change_pct > 0.5:
        return "bullish"
    elif change_pct < -0.5:
        return "bearish"
    return "neutral"


@router.get("/stocks")
@limiter.limit("10/minute")
async def get_momentum_stocks(
    request: Request,
    direction: str = "gainers",
    user: dict = Security(get_current_user, scopes=[])
):
    """
    Get top momentum stocks from Polygon snapshot.
    direction: 'gainers' or 'losers'
    """
    try:
        if direction not in ("gainers", "losers"):
            direction = "gainers"

        # Polygon snapshot endpoint for top gainers/losers
        try:
            data = await polygon_get(
                f"{POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/{direction}"
            )
        except Exception as e:
            logger.warning(f"Polygon snapshot unavailable: {e}")
            return {"stocks": [], "message": "Momentum data temporarily unavailable"}

        if not data or "tickers" not in data:
            return {"stocks": [], "message": "No momentum data available"}

        stocks = []
        for ticker in data["tickers"][:20]:  # Top 20
            try:
                symbol = ticker.get("ticker", "")
                day = ticker.get("day", {})
                prev_day = ticker.get("prevDay", {})
                today_change_pct = ticker.get("todaysChangePerc", 0)
                today_change = ticker.get("todaysChange", 0)

                price = day.get("c", 0) or prev_day.get("c", 0)
                volume = day.get("v", 0)
                high = day.get("h", price)
                low = day.get("l", price)
                open_price = day.get("o", price)
                prev_volume = prev_day.get("v", 1)

                # Skip penny stocks and low volume
                if price < 5 or volume < 100_000:
                    continue

                rel_volume = volume / max(prev_volume, 1)

                # Calculate from 52-week high (use min data as approximation)
                min_data = ticker.get("min", {})
                from_high_pct = 0

                momentum = _calc_momentum(today_change_pct, rel_volume)
                breakout = _calc_breakout_strength(today_change_pct, rel_volume, from_high_pct)
                efficiency = _calc_efficiency(today_change_pct, high, low, open_price)
                trend = _classify_trend(today_change_pct)

                stocks.append({
                    "symbol": symbol,
                    "company": symbol,  # Polygon snapshot doesn't include name
                    "price": round(price, 2),
                    "momentum": momentum,
                    "trend": trend,
                    "volume": _format_volume(volume),
                    "changePercent": round(today_change_pct, 2),
                    "breakoutStrength": breakout,
                    "efficiency": efficiency,
                })
            except Exception as e:
                logger.warning(f"Skipping ticker in momentum: {e}")
                continue

        # Sort by momentum score descending
        stocks.sort(key=lambda s: s["momentum"], reverse=True)

        return {"stocks": stocks}

    except Exception as e:
        logger.error(f"Momentum fetch failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch momentum data: {str(e)}"
        )
