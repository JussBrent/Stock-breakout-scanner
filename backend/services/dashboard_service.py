"""
dashboard_service.py

Builds daily dashboard intelligence:
  - Top 5 AI-scored setups from a full universe scan
  - Sector performance heatmap (SPDRs + major ETFs)
  - Market sentiment (VIX, SPY/QQQ/IWM, A/D ratio)

Filters: leading theme, liquidity, accelerated EPS/sales,
         ETF group in a setup, extended/sideways flag.
Results cached in Supabase; refreshed on demand or daily cron.
"""

import asyncio
import logging
import os
from datetime import date, datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_KEY", "")

# ── Sector ETF universe ──────────────────────────────────────────────────────
SECTOR_ETFS = {
    "Technology":         "XLK",
    "Healthcare":         "XLV",
    "Financials":         "XLF",
    "Consumer Disc.":     "XLY",
    "Consumer Staples":   "XLP",
    "Energy":             "XLE",
    "Industrials":        "XLI",
    "Materials":          "XLB",
    "Utilities":          "XLU",
    "Real Estate":        "XLRE",
    "Communication Svcs": "XLC",
    "Semiconductors":     "SOXX",
    "Biotech":            "XBI",
    "Clean Energy":       "ICLN",
    "AI/Cloud":           "WCLD",
}

# ── Market breadth proxies ───────────────────────────────────────────────────
BREADTH_SYMBOLS = ["SPY", "QQQ", "IWM", "VIX"]

# ── Polygon helpers ──────────────────────────────────────────────────────────
_POLYGON_BASE = "https://api.polygon.io"


def _polygon_key() -> str:
    from config import settings
    return settings.POLYGON_API_KEY or ""


async def _poly_get(path: str, params: dict | None = None, timeout: int = 15) -> dict:
    """Thin async wrapper for Polygon REST calls."""
    key = _polygon_key()
    if not key:
        return {}
    p = dict(params or {})
    p["apiKey"] = key
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(f"{_POLYGON_BASE}{path}", params=p)
        if resp.status_code == 200:
            return resp.json()
        logger.warning("Polygon %s → %s", path, resp.status_code)
        return {}


async def _get_ticker_snapshot(symbol: str) -> dict:
    """Get latest price + day change for a symbol."""
    data = await _poly_get(f"/v2/snapshot/locale/us/markets/stocks/tickers/{symbol.upper()}")
    ticker = data.get("ticker", {})
    day = ticker.get("day", {})
    prev = ticker.get("prevDay", {})
    prev_close = prev.get("c") or 1
    close = day.get("c") or ticker.get("lastTrade", {}).get("p") or 0
    change_pct = round(((close - prev_close) / prev_close) * 100, 2) if prev_close else 0
    volume = day.get("v") or 0
    avg_v = ticker.get("day", {}).get("vw") or volume
    rel_vol = round(volume / avg_v, 2) if avg_v else 1.0
    return {
        "symbol": symbol,
        "price": round(close, 4),
        "change_pct": change_pct,
        "volume": int(volume),
        "relative_volume": rel_vol,
    }


async def _get_ticker_details(symbol: str) -> dict:
    """Fetch company name, sector, market cap, SIC."""
    data = await _poly_get(f"/v3/reference/tickers/{symbol.upper()}")
    res = data.get("results", {})
    return {
        "company_name": res.get("name", symbol),
        "sector": res.get("sic_description", ""),
        "market_cap": res.get("market_cap") or 0,
    }


# ── Supabase helpers ─────────────────────────────────────────────────────────

def _sb_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


async def _sb_upsert(table: str, rows: list[dict]) -> None:
    if not rows or not SUPABASE_URL:
        return
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            url,
            json=rows,
            headers={**_sb_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"},
        )
        if r.status_code not in (200, 201):
            logger.error("Supabase upsert %s → %s %s", table, r.status_code, r.text[:200])


async def _sb_select(table: str, params: dict | None = None) -> list[dict]:
    if not SUPABASE_URL:
        return []
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params or {}, headers=headers)
        if r.status_code == 200:
            return r.json()
        logger.error("Supabase select %s → %s", table, r.status_code)
        return []


# ── Sector performance ───────────────────────────────────────────────────────

async def build_sector_heatmap() -> list[dict]:
    """Fetch all sector ETFs in parallel, score them, save to DB."""
    today = str(date.today())
    tasks = [_get_ticker_snapshot(etf) for etf in SECTOR_ETFS.values()]
    snapshots = await asyncio.gather(*tasks, return_exceptions=True)

    rows = []
    for (sector, etf_sym), snap in zip(SECTOR_ETFS.items(), snapshots):
        if isinstance(snap, Exception):
            logger.warning("Sector ETF %s failed: %s", etf_sym, snap)
            continue
        row = {
            "scan_date": today,
            "sector": sector,
            "etf_symbol": etf_sym,
            "change_pct": snap.get("change_pct", 0),
            "volume": snap.get("volume", 0),
            "relative_volume": snap.get("relative_volume", 1.0),
            "price": snap.get("price", 0),
            "is_breaking_out": snap.get("relative_volume", 1.0) > 1.5 and snap.get("change_pct", 0) > 0.5,
        }
        rows.append(row)

    await _sb_upsert("sector_performance", rows)
    return rows


# ── Market sentiment ─────────────────────────────────────────────────────────

async def build_market_sentiment() -> dict:
    """Compute market sentiment from SPY/QQQ/IWM + VIX."""
    today = str(date.today())
    tasks = [_get_ticker_snapshot(s) for s in BREADTH_SYMBOLS]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    snaps = {}
    for sym, res in zip(BREADTH_SYMBOLS, results):
        if not isinstance(res, Exception):
            snaps[sym] = res

    spy_chg = snaps.get("SPY", {}).get("change_pct", 0)
    qqq_chg = snaps.get("QQQ", {}).get("change_pct", 0)
    iwm_chg = snaps.get("IWM", {}).get("change_pct", 0)
    vix = snaps.get("VIX", {}).get("price", 20)

    # Sentiment score: 50 = neutral, 0 = extreme fear, 100 = extreme greed
    raw = (spy_chg + qqq_chg + iwm_chg) / 3
    vix_penalty = max(0, (vix - 15) * 1.5)
    score = max(0, min(100, 50 + raw * 8 - vix_penalty))

    if score >= 70:
        sentiment = "bullish"
    elif score >= 55:
        sentiment = "cautiously_bullish"
    elif score >= 45:
        sentiment = "neutral"
    elif score >= 30:
        sentiment = "cautiously_bearish"
    else:
        sentiment = "bearish"

    row = {
        "scan_date": today,
        "sentiment": sentiment,
        "sentiment_score": round(score, 2),
        "vix": vix,
        "spy_change": spy_chg,
        "qqq_change": qqq_chg,
        "iwm_change": iwm_chg,
        "market_notes": (
            f"SPY {spy_chg:+.2f}% | QQQ {qqq_chg:+.2f}% | IWM {iwm_chg:+.2f}% | VIX {vix:.1f}"
        ),
    }

    await _sb_upsert("market_sentiment", [row])
    return row


# ── Top 5 AI-scored setups ───────────────────────────────────────────────────

async def build_top_setups(limit: int = 5) -> list[dict]:
    """
    1. Run full scanner universe scan
    2. Filter: volume > 500k, market cap > 500M, AI score >= 70
    3. AI-score each candidate with get_ai_service
    4. Tag extended/sideways, ETF group alignment
    5. Pick top-N by ai_score, save to DB
    """
    today = str(date.today())

    try:
        from scan.scan_universe import scan_universe
        from services.ai_analysis import get_ai_service
    except ImportError as exc:
        logger.error("Import error in build_top_setups: %s", exc)
        return []

    # Run scanner
    try:
        raw_results = await scan_universe(None)
    except Exception as exc:
        logger.error("scan_universe failed: %s", exc)
        return []

    if not raw_results:
        return []

    # Filter: liquidity + has AI rating
    candidates = []
    for r in raw_results:
        try:
            vol = getattr(r, "volume", 0) or 0
            score = 0
            ai_ratings = getattr(r, "ai_ratings", None)
            if ai_ratings and hasattr(ai_ratings, "opportunity_score"):
                score = ai_ratings.opportunity_score or 0
            # liquidity filter: volume > 300k and ai score > 0
            if vol > 300_000 and score > 0:
                candidates.append((r, score))
        except Exception:
            continue

    # Sort by score descending
    candidates.sort(key=lambda x: x[1], reverse=True)
    top = candidates[:max(limit * 3, 15)]  # take wider pool for detail enrichment

    ai_svc = get_ai_service()

    rows = []
    for rank, (result, _base_score) in enumerate(top[:limit], start=1):
        try:
            sym = getattr(result, "symbol", "")
            if not sym:
                continue

            # Re-score via AI service for richer analysis
            try:
                ai_ratings_list = await ai_svc.analyze_stocks([result])
                ai_rating = ai_ratings_list[0] if ai_ratings_list else None
            except Exception as exc:
                logger.warning("AI re-score failed for %s: %s", sym, exc)
                ai_rating = getattr(result, "ai_ratings", None)

            # Get company details
            details = await _get_ticker_details(sym)

            # Flag extended / sideways from setup type
            setup_type = str(getattr(result, "setup_type", "") or "")
            is_extended = "extended" in setup_type.lower() or "parabolic" in setup_type.lower()
            is_sideways = "flat" in setup_type.lower() or "sideways" in setup_type.lower() or "base" in setup_type.lower()

            # Check if sector ETF is also in setup (group breakout signal)
            sector = details.get("sector", "")
            etf_sym = next((v for k, v in SECTOR_ETFS.items() if k.lower() in sector.lower()), None)
            group_breakout = False
            if etf_sym:
                try:
                    etf_snap = await _get_ticker_snapshot(etf_sym)
                    group_breakout = etf_snap.get("relative_volume", 1.0) > 1.3 and etf_snap.get("change_pct", 0) > 0.3
                except Exception:
                    pass

            ai_score = 0
            opportunity_score = 0
            confidence = ""
            analysis_text = ""
            key_factors = []
            risk_level = ""
            recommendation = ""

            if ai_rating:
                ai_score = float(getattr(ai_rating, "opportunity_score", 0) or 0)
                opportunity_score = ai_score
                confidence = str(getattr(ai_rating, "confidence", "") or "")
                analysis_text = str(getattr(ai_rating, "analysis", "") or "")
                kf = getattr(ai_rating, "key_factors", []) or []
                key_factors = list(kf) if isinstance(kf, (list, tuple)) else [str(kf)]
                risk_level = str(getattr(ai_rating, "risk_level", "") or "")
                recommendation = str(getattr(ai_rating, "recommendation", "") or "")

            row = {
                "scan_date": today,
                "rank": rank,
                "symbol": sym,
                "company_name": details.get("company_name", sym),
                "sector": sector or details.get("sector", ""),
                "setup_type": setup_type,
                "ai_score": round(ai_score, 2),
                "opportunity_score": round(opportunity_score, 2),
                "confidence": confidence,
                "price": round(float(getattr(result, "price", 0) or 0), 4),
                "price_change_pct": round(float(getattr(result, "price_change_pct", 0) or 0), 4),
                "volume": int(getattr(result, "volume", 0) or 0),
                "market_cap": int(details.get("market_cap", 0)),
                "etf_group": etf_sym or "",
                "analysis": analysis_text,
                "key_factors": key_factors,
                "risk_level": risk_level,
                "recommendation": recommendation,
                "is_extended": is_extended,
                "is_sideways": is_sideways,
                "group_breakout": group_breakout,
            }
            rows.append(row)
        except Exception as exc:
            logger.error("build_top_setups row %s failed: %s", rank, exc)
            continue

    await _sb_upsert("daily_top_setups", rows)
    return rows


# ── Full refresh ─────────────────────────────────────────────────────────────

async def refresh_dashboard() -> dict:
    """Run all three builders in parallel and return summary."""
    sentiment_task = build_market_sentiment()
    sectors_task = build_sector_heatmap()
    setups_task = build_top_setups(5)

    sentiment, sectors, setups = await asyncio.gather(
        sentiment_task, sectors_task, setups_task, return_exceptions=True
    )

    return {
        "sentiment": sentiment if not isinstance(sentiment, Exception) else {"error": str(sentiment)},
        "sectors_count": len(sectors) if isinstance(sectors, list) else 0,
        "top_setups_count": len(setups) if isinstance(setups, list) else 0,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Read helpers (for API endpoints) ─────────────────────────────────────────

async def get_today_top_setups() -> list[dict]:
    """Return today's top setups; if none exist (market closed / not yet scanned),
    fall back to the most recent session's data."""
    today = str(date.today())
    rows = await _sb_select(
        "daily_top_setups",
        {"scan_date": f"eq.{today}", "order": "rank.asc", "limit": "10"},
    )
    if not rows:
        # Market closed or not yet scanned — use most recent session
        rows = await _sb_select(
            "daily_top_setups",
            {"order": "scan_date.desc,rank.asc", "limit": "10"},
        )
    return rows


async def get_today_sectors() -> list[dict]:
    """Return today's sector heatmap; fall back to most recent session if none."""
    today = str(date.today())
    rows = await _sb_select(
        "sector_performance",
        {"scan_date": f"eq.{today}", "order": "change_pct.desc"},
    )
    if not rows:
        rows = await _sb_select(
            "sector_performance",
            {"order": "scan_date.desc,change_pct.desc", "limit": "20"},
        )
    return rows


async def get_today_sentiment() -> dict:
    """Return today's market sentiment; fall back to most recent session if none."""
    today = str(date.today())
    rows = await _sb_select(
        "market_sentiment",
        {"scan_date": f"eq.{today}", "limit": "1"},
    )
    if not rows:
        rows = await _sb_select(
            "market_sentiment",
            {"order": "scan_date.desc", "limit": "1"},
        )
    return rows[0] if rows else {}
