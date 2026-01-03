import os
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import List, Optional
from models.candle import Candle

POLYGON_BASE = "https://api.polygon.io"
API_KEY = os.getenv("POLYGON_API_KEY")

if not API_KEY:
    raise ValueError("Missing POLYGON_API_KEY in environment variables.")


def to_ymd(d: datetime) -> str:
    """Format date as YYYY-MM-DD."""
    return d.strftime("%Y-%m-%d")


async def polygon_get(url: str, params: dict = None, tries: int = 5) -> dict:
    """Make GET request to Polygon API with retries and backoff."""
    if params is None:
        params = {}

    params["apiKey"] = API_KEY
    last_err = None

    for attempt in range(tries):
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    elif resp.status == 429:
                        # Rate limit - aggressive backoff
                        backoff = 1.0 * (2 ** attempt)
                        print(f"  Rate limited on {url}, retry in {backoff}s...")
                        await asyncio.sleep(backoff)
                        continue
                    elif resp.status in [500, 502, 503, 504]:
                        # Server error, retry
                        backoff = 0.5 * (2 ** attempt)
                        await asyncio.sleep(backoff)
                        continue
                    else:
                        text = await resp.text()
                        raise Exception(f"Polygon API error {resp.status}: {text[:200]}")
        except asyncio.TimeoutError:
            last_err = Exception("Request timeout")
            backoff = 1.0 + attempt
            await asyncio.sleep(backoff)
        except Exception as e:
            last_err = e
            if attempt < tries - 1:
                await asyncio.sleep(0.3)
            continue

    raise last_err or Exception("Failed to fetch from Polygon after retries")


async def get_daily_candles(
    symbol: str,
    from_date: datetime,
    to_date: datetime,
    adjusted: bool = True,
) -> List[Candle]:
    """Fetch daily OHLCV candles from Polygon."""
    url = f"{POLYGON_BASE}/v2/aggs/ticker/{symbol}/range/1/day/{to_ymd(from_date)}/{to_ymd(to_date)}"

    data = await polygon_get(
        url,
        {
            "adjusted": str(adjusted).lower(),
            "sort": "asc",
            "limit": 50000,
        },
    )

    results = data.get("results", [])
    return [
        Candle(
            t=int(r.get("t", 0)),
            o=float(r.get("o", 0)),
            h=float(r.get("h", 0)),
            l=float(r.get("l", 0)),
            c=float(r.get("c", 0)),
            v=float(r.get("v", 0)),
        )
        for r in results
    ]


async def get_market_cap_usd(symbol: str) -> Optional[float]:
    """Fetch market cap from Polygon."""
    url = f"{POLYGON_BASE}/v3/reference/tickers/{symbol}"

    try:
        data = await polygon_get(url)
        cap = data.get("results", {}).get("market_cap")
        return float(cap) if cap else None
    except Exception:
        return None
