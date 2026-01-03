from typing import List
from datetime import datetime
from models.candle import ScanResult
from services.supabase_client import supabase


async def save_scan_results(results: List[ScanResult]) -> None:
    """Save scan results to Supabase breakout_scans table."""
    if not results:
        return

    rows = [
        {
            "symbol": r.symbol,
            "price": float(r.price),
            "trigger_price": float(r.trigger_price),
            "distance_pct": float(r.distance_pct),
            "adr_pct_14": float(r.adr_pct_14),
            "avg_vol_50": float(r.avg_vol_50),
            "ema21": float(r.ema21),
            "ema50": float(r.ema50),
            "ema200": float(r.ema200),
            "setup_type": r.setup_type,
            "breakout_score": int(r.breakout_score),
            "notes": r.notes,
            "market_cap": float(r.market_cap) if r.market_cap else None,
            "scanned_at": datetime.utcnow().isoformat(),
        }
        for r in results
    ]

    response = await supabase.table("breakout_scans").insert(rows).execute()

    print(f"Saved {len(results)} scan results to Supabase")
