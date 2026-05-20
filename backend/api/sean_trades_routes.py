"""
Sean's Personal Verified Trades API
Admin-only write. All authenticated users can read (Sean uses this for AI context).

Routes
------
POST   /api/sean-trades/             -- submit a trade (admin)
GET    /api/sean-trades/             -- list all trades (admin, with full detail)
GET    /api/sean-trades/context      -- AI-ready text summary (any authed user)
PATCH  /api/sean-trades/{id}         -- update/close a trade (admin)
DELETE /api/sean-trades/{id}         -- delete a trade (admin)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal, List
from datetime import date, datetime, timezone
import logging

from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from services.supabase_client import supabase
from api.admin_routes import _require_admin

logger = logging.getLogger(__name__)

router = APIRouter()


# -- Pydantic Models ---------------------------------------------------------

class SeanTradeCreate(BaseModel):
    # Core trade info
    symbol: str
    direction: Literal["long", "short"] = "long"
    setup_type: Optional[str] = None
    breakout_score: Optional[int] = None

    # Stock prices
    entry_price: float
    exit_price: Optional[float] = None
    stop_price: Optional[float] = None
    gain_pct: Optional[float] = None

    # Options (all nullable -- omit for stock-only trades)
    contract_type: Optional[Literal["call", "put"]] = None
    strike_price: Optional[float] = None
    expiration_date: Optional[date] = None
    contracts_held: Optional[int] = None
    premium_paid: Optional[float] = None
    premium_exit: Optional[float] = None

    # Outcome
    outcome: Literal["win", "loss", "breakeven", "open"] = "open"

    # Teaching labels -- the real gold for AI training
    why_took_trade: Optional[str] = None       # "clear flat top, 3-week tight base, vol dry-up"
    looked_wrong_but: Optional[str] = None    # "base felt loose but sector was ripping hard"
    looked_right_but: Optional[str] = None    # "perfect flag but market reversed that day"
    key_lesson: Optional[str] = None           # distilled lesson for Sean to remember

    # Optional chart image URL (upload to Supabase storage separately)
    chart_image_url: Optional[str] = None

    # Timestamps
    traded_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    @field_validator("symbol")
    @classmethod
    def normalise_symbol(cls, v: str) -> str:
        v = v.strip().upper()
        if not 1 <= len(v) <= 10:
            raise ValueError("Symbol must be 1-10 characters")
        return v

    @field_validator("entry_price")
    @classmethod
    def positive_entry(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("entry_price must be positive")
        return v

    @field_validator("breakout_score")
    @classmethod
    def valid_score(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 100:
            raise ValueError("breakout_score must be 0-100")
        return v

    @model_validator(mode="after")
    def options_fields_consistent(self) -> "SeanTradeCreate":
        """If any options field is supplied, contract_type must be set."""
        options_fields = [self.strike_price, self.expiration_date,
                          self.contracts_held, self.premium_paid]
        if any(f is not None for f in options_fields) and self.contract_type is None:
            raise ValueError(
                "contract_type (call or put) is required when options fields are provided"
            )
        return self


class SeanTradeUpdate(BaseModel):
    """Partial update -- only supply the fields you want to change."""
    exit_price: Optional[float] = None
    stop_price: Optional[float] = None
    gain_pct: Optional[float] = None
    outcome: Optional[Literal["win", "loss", "breakeven"]] = None
    premium_exit: Optional[float] = None
    contracts_held: Optional[int] = None
    why_took_trade: Optional[str] = None
    looked_wrong_but: Optional[str] = None
    looked_right_but: Optional[str] = None
    key_lesson: Optional[str] = None
    chart_image_url: Optional[str] = None
    closed_at: Optional[datetime] = None


# -- Helper ------------------------------------------------------------------

def _format_trade_for_context(t: dict) -> str:
    """Convert one trade row into a readable line for Sean's system prompt."""
    icons = {"win": "WIN", "loss": "LOSS", "breakeven": "BE", "open": "OPEN"}
    outcome_icon = icons.get(t.get("outcome", ""), "?")

    sym       = t.get("symbol", "?")
    setup     = t.get("setup_type") or "N/A"
    score     = t.get("breakout_score")
    score_str = f"score {score}" if score is not None else "no score"
    direction = t.get("direction", "long").upper()
    entry     = t.get("entry_price", "?")
    exit_p    = t.get("exit_price")
    gain      = t.get("gain_pct")

    # Options contract line
    opt_str = ""
    if t.get("contract_type"):
        ct      = t.get("contract_type", "?").upper()
        strike  = t.get("strike_price", "?")
        exp     = t.get("expiration_date", "?")
        premium = t.get("premium_paid", "?")
        p_exit  = t.get("premium_exit")
        opt_str = (f" | {ct} ${strike} exp {exp} | premium in ${premium}"
                   + (f" -> out ${p_exit}" if p_exit else ""))

    gain_str = f" ({gain:+.1f}%)" if gain is not None else ""
    exit_str = f" -> ${exit_p}" if exit_p else ""

    line = (
        f"- {sym} [{direction}] {setup} ({score_str})"
        f" entry ${entry}{exit_str}{gain_str}{opt_str}"
        f" [{outcome_icon}]"
    )

    # Teaching labels
    lessons = []
    if t.get("why_took_trade"):
        lessons.append(f"  Took it because: {t['why_took_trade']}")
    if t.get("looked_wrong_but"):
        lessons.append(f"  Looked wrong but worked because: {t['looked_wrong_but']}")
    if t.get("looked_right_but"):
        lessons.append(f"  Looked right but failed because: {t['looked_right_but']}")
    if t.get("key_lesson"):
        lessons.append(f"  Key lesson: {t['key_lesson']}")

    return line + ("\n" + "\n".join(lessons) if lessons else "")


# -- Routes ------------------------------------------------------------------

@router.post("/", status_code=201)
@limiter.limit("30/minute")
async def submit_sean_trade(
    request: Request,
    body: SeanTradeCreate,
    admin: dict = Depends(_require_admin),
):
    """Admin: submit a verified personal trade to train Sean."""
    try:
        data = {
            **body.model_dump(exclude_none=True),
            "created_by": admin["user_id"],
            "traded_at": (body.traded_at or datetime.now(timezone.utc)).isoformat(),
        }
        if body.expiration_date:
            data["expiration_date"] = body.expiration_date.isoformat()
        if body.closed_at:
            data["closed_at"] = body.closed_at.isoformat()

        rows = await supabase.table("sean_trades").insert([data]).execute()
        logger.info(f"Sean trade submitted: {body.symbol} {body.outcome} by {admin.get('email')}")
        return rows[0] if rows else data
    except Exception as e:
        logger.error(f"Submit sean trade failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit trade")


@router.get("/")
@limiter.limit("20/minute")
async def list_sean_trades(
    request: Request,
    outcome: Optional[str] = Query(None, description="win|loss|breakeven|open"),
    setup_type: Optional[str] = Query(None, description="Filter by setup type"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    limit: int = Query(100, le=500),
    admin: dict = Depends(_require_admin),
):
    """Admin: list all of Sean's verified trades with full detail."""
    try:
        q = supabase.table("sean_trades").select("*").order("traded_at", desc=True)
        if outcome:
            q = q.eq("outcome", outcome)
        if setup_type:
            q = q.eq("setup_type", setup_type)
        if symbol:
            q = q.eq("symbol", symbol.upper())
        rows = await q.limit(limit).execute()
        return {"trades": rows or [], "count": len(rows or [])}
    except Exception as e:
        logger.error(f"List sean trades failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch trades")


@router.get("/context")
@limiter.limit("60/minute")
async def get_sean_trades_context(
    request: Request,
    user: dict = Depends(get_current_user),
    limit: int = Query(50, le=200),
):
    """
    Return Sean's trades as an AI-ready text block.
    Called by ai_analysis.py to inject into Sean's system prompt.
    Any authenticated user can hit this; Sean reads it on every chat.
    """
    try:
        rows = await (
            supabase.table("sean_trades")
            .select(
                "symbol,direction,setup_type,breakout_score,"
                "entry_price,exit_price,stop_price,gain_pct,outcome,"
                "contract_type,strike_price,expiration_date,"
                "contracts_held,premium_paid,premium_exit,"
                "why_took_trade,looked_wrong_but,looked_right_but,key_lesson,traded_at"
            )
            .order("traded_at", desc=True)
            .limit(limit)
            .execute()
        )
        if not rows:
            return {"context": "", "count": 0}

        wins   = [t for t in rows if t.get("outcome") == "win"]
        losses = [t for t in rows if t.get("outcome") == "loss"]
        open_t = [t for t in rows if t.get("outcome") == "open"]
        other  = [t for t in rows if t.get("outcome") not in ("win", "loss", "open")]

        sections = []
        if wins:
            sections.append("### Verified Winning Trades (study these setups)\n"
                            + "\n".join(_format_trade_for_context(t) for t in wins))
        if losses:
            sections.append("### Verified Losing Trades (understand what to avoid)\n"
                            + "\n".join(_format_trade_for_context(t) for t in losses))
        if other:
            sections.append("### Breakeven / Scratch Trades\n"
                            + "\n".join(_format_trade_for_context(t) for t in other))
        if open_t:
            sections.append("### Currently Open Positions\n"
                            + "\n".join(_format_trade_for_context(t) for t in open_t))

        context = "\n\n".join(sections)
        return {"context": context, "count": len(rows)}
    except Exception as e:
        logger.error(f"Get sean trades context failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to build context")


@router.patch("/{trade_id}")
@limiter.limit("30/minute")
async def update_sean_trade(
    request: Request,
    trade_id: str,
    body: SeanTradeUpdate,
    admin: dict = Depends(_require_admin),
):
    """Admin: update or close a Sean trade."""
    try:
        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        if "closed_at" in update_data and isinstance(update_data["closed_at"], datetime):
            update_data["closed_at"] = update_data["closed_at"].isoformat()

        rows = await (
            supabase.table("sean_trades")
            .update(update_data)
            .eq("id", trade_id)
            .execute()
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Trade not found")
        logger.info(f"Sean trade {trade_id} updated by {admin.get('email')}")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update sean trade failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update trade")


@router.delete("/{trade_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_sean_trade(
    request: Request,
    trade_id: str,
    admin: dict = Depends(_require_admin),
):
    """Admin: permanently delete a Sean trade record."""
    try:
        await supabase.table("sean_trades").delete().eq("id", trade_id).execute()
        logger.info(f"Sean trade {trade_id} deleted by {admin.get('email')}")
        return None
    except Exception as e:
        logger.error(f"Delete sean trade failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete trade")
