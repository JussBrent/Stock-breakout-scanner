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
            return {"stocks": [], "marketOpen": False, "message": "Momentum data temporarily unavailable"}

        if not data or "tickers" not in data:
            return {"stocks": [], "marketOpen": False, "message": "No momentum data available"}

        stocks = []
        market_open_count = 0  # track how many tickers have live day data

        for ticker in data["tickers"][:20]:  # Top 20
            try:
                symbol = ticker.get("ticker", "")
                day = ticker.get("day", {})
                prev_day = ticker.get("prevDay", {})
                today_change_pct = ticker.get("todaysChangePerc", 0)

                # Determine if live day data exists
                day_close = day.get("c", 0)
                day_volume = day.get("v", 0)
                has_live_data = bool(day_close and day_volume and day_volume >= 100_000)

                if has_live_data:
                    market_open_count += 1
                    price = day_close
                    volume = day_volume
                    high = day.get("h", price)
                    low = day.get("l", price)
                    open_price = day.get("o", price)
                    change_pct = today_change_pct
                else:
                    # Market closed — fall back to previous day data
                    price = prev_day.get("c", 0)
                    volume = prev_day.get("v", 0)
                    high = prev_day.get("h", price)
                    low = prev_day.get("l", price)
                    open_price = prev_day.get("o", price)
                    # Compute prev-day change vs the day before (vw as proxy)
                    prev_open = prev_day.get("o", 0)
                    change_pct = ((price - prev_open) / max(prev_open, 0.01)) * 100 if prev_open else today_change_pct

                # Skip penny stocks or missing data
                if price < 5 or volume < 100_000:
                    continue

                prev_volume = prev_day.get("v", 1)
                rel_volume = volume / max(prev_volume, 1) if has_live_data else 1.0

                from_high_pct = 0
                momentum = _calc_momentum(change_pct, rel_volume)
                breakout = _calc_breakout_strength(change_pct, rel_volume, from_high_pct)
                efficiency = _calc_efficiency(change_pct, high, low, open_price)
                trend = _classify_trend(change_pct)

                stocks.append({
                    "symbol": symbol,
                    "company": symbol,
                    "price": round(price, 2),
                    "momentum": momentum,
                    "trend": trend,
                    "volume": _format_volume(volume),
                    "changePercent": round(change_pct, 2),
                    "breakoutStrength": breakout,
                    "efficiency": efficiency,
                })
            except Exception as e:
                logger.warning(f"Skipping ticker in momentum: {e}")
                continue

        # Sort by momentum score descending
        stocks.sort(key=lambda s: s["momentum"], reverse=True)

        # Fallback: if no stocks passed filters, fetch popular tickers individually
        if not stocks:
            fallback_tickers = ["AAPL", "TSLA", "NVDA", "MSFT", "META", "AMZN", "GOOGL", "AMD", "SPY", "QQQ"]
            for sym in fallback_tickers:
                try:
                    snap = await polygon_get(
                        f"{POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/{sym}"
                    )
                    ticker = snap.get("ticker", {}) if snap else {}
                    if not ticker:
                        continue
                    prev_day = ticker.get("prevDay", {})
                    day = ticker.get("day", {})
                    price = day.get("c") or prev_day.get("c", 0)
                    volume = day.get("v") or prev_day.get("v", 0)
                    change_pct = ticker.get("todaysChangePerc", 0)
                    if price < 1:
                        continue
                    momentum = _calc_momentum(change_pct, 1.0)
                    trend = _classify_trend(change_pct)
                    stocks.append({
                        "symbol": sym,
                        "company": sym,
                        "price": round(price, 2),
                        "momentum": momentum,
                        "trend": trend,
                        "volume": _format_volume(volume),
                        "changePercent": round(change_pct, 2),
                        "breakoutStrength": _calc_breakout_strength(change_pct, 1.0, 0),
                        "efficiency": 50,
                    })
                except Exception:
                    continue
            stocks.sort(key=lambda s: s["momentum"], reverse=True)

        market_open = market_open_count > len(stocks) // 2 if stocks else False
        return {"stocks": stocks, "marketOpen": market_open}

    except Exception as e:
        logger.error(f"Momentum fetch failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch momentum data: {str(e)}"
        )
