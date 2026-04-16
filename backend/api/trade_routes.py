"""
Trade Outcome API — log and retrieve trade results for AI learning.
Requires authentication.
"""
from fastapi import APIRouter, HTTPException, Security, Request
from pydantic import BaseModel, field_validator
from typing import List, Optional, Literal
from datetime import datetime
import logging

from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────

class TradeOutcomeCreate(BaseModel):
    symbol: str
    setup_type: Optional[str] = None
    entry_price: float
    exit_price: Optional[float] = None
    gain_pct: Optional[float] = None
    outcome: Optional[Literal["win", "loss", "breakeven", "open"]] = "open"
    breakout_score: Optional[int] = None
    notes: Optional[str] = None
    traded_at: Optional[str] = None

    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, v):
        v = v.strip().upper()
        if len(v) < 1 or len(v) > 10:
            raise ValueError("Symbol must be 1-10 characters")
        return v

    @field_validator('entry_price')
    @classmethod
    def validate_entry_price(cls, v):
        if v <= 0:
            raise ValueError("Entry price must be positive")
        return v

    @field_validator('exit_price')
    @classmethod
    def validate_exit_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Exit price must be positive")
        return v

    @field_validator('breakout_score')
    @classmethod
    def validate_score(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Breakout score must be 0-100")
        return v


class TradeOutcomeUpdate(BaseModel):
    exit_price: Optional[float] = None
    gain_pct: Optional[float] = None
    outcome: Optional[Literal["win", "loss", "breakeven"]] = None
    notes: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────

@router.post("/outcome", status_code=201)
@limiter.limit("20/minute")
async def log_trade_outcome(
    request: Request,
    body: TradeOutcomeCreate,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Log a trade outcome for AI learning."""
    try:
        data = {
            "user_id": user["user_id"],
            "symbol": body.symbol,
            "setup_type": body.setup_type,
            "entry_price": body.entry_price,
            "exit_price": body.exit_price,
            "gain_pct": body.gain_pct,
            "outcome": body.outcome,
            "breakout_score": body.breakout_score,
            "notes": body.notes,
            "traded_at": body.traded_at or datetime.utcnow().isoformat(),
        }
        rows = await supabase.table("trade_outcomes").insert([data]).execute()
        return rows[0] if rows else data
    except Exception as e:
        logger.error(f"Log trade outcome failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to log trade outcome")


@router.put("/outcome/{trade_id}")
@limiter.limit("20/minute")
async def update_trade_outcome(
    request: Request,
    trade_id: str,
    body: TradeOutcomeUpdate,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Update a trade outcome (e.g., close a trade)."""
    try:
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        rows = await (
            supabase.table("trade_outcomes")
            .update(update_data)
            .eq("id", trade_id)
            .eq("user_id", user["user_id"])
            .execute()
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Trade not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update trade outcome failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update trade outcome")


@router.get("/outcomes")
@limiter.limit("30/minute")
async def get_trade_outcomes(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
    limit: int = 50,
):
    """Get user's trade outcome history."""
    try:
        rows = await (
            supabase.table("trade_outcomes")
            .select("*")
            .eq("user_id", user["user_id"])
            .order("closed_at", desc=True)
            .limit(min(limit, 100))
            .execute()
        )
        return {"outcomes": rows or []}
    except Exception as e:
        logger.error(f"Get trade outcomes failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch trade outcomes")
