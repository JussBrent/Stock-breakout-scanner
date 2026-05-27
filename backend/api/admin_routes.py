"""
Admin-only API endpoints.
All routes require the caller's email to be in the ADMIN_EMAILS allowlist.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime, timezone

from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Admin allowlist (hardcode here and mirror in frontend adminConfig.ts) ──
ADMIN_EMAILS: list[str] = [
    "bryantwardvlogs@gmail.com",
    # TODO: add Sean's email
]


def _require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Dependency: raises 403 if caller is not an admin."""
    if user.get("email") not in ADMIN_EMAILS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


# ── Models ─────────────────────────────────────────────────────────────────

class KnowledgeCreate(BaseModel):
    content: str
    source_label: str = ""


class UserPlanUpdate(BaseModel):
    plan: str  # "free" | "core" | "premium"


# ── Platform stats ──────────────────────────────────────────────────────────

@router.get("/stats")
@limiter.limit("10/minute")
async def get_platform_stats(request: Request, admin: dict = Depends(_require_admin)):
    """Return aggregate platform metrics for the admin overview dashboard."""
    try:
        users = await supabase.table("profiles").select("id,created_at").execute()
        subscriptions = await supabase.table("subscriptions").select("user_id,plan,status").execute()

        total_users = len(users)

        active_subs = [s for s in subscriptions if s.get("status") in ("active", "trialing")]
        plan_counts: dict[str, int] = {}
        for sub in subscriptions:
            plan = sub.get("plan", "free")
            plan_counts[plan] = plan_counts.get(plan, 0) + 1

        # Revenue estimate (not pulling from Stripe — derived from active paid plans)
        from config import settings
        prices = {"core": 39, "premium": 79}
        monthly_revenue = sum(
            prices.get(s.get("plan", "free"), 0)
            for s in active_subs
            if s.get("plan") in prices
        )

        # Recent signups (last 10)
        recent = sorted(users, key=lambda u: u.get("created_at", ""), reverse=True)[:10]

        return {
            "total_users": total_users,
            "active_subscriptions": len(active_subs),
            "monthly_revenue_estimate": monthly_revenue,
            "plan_breakdown": plan_counts,
            "recent_signups": recent,
        }
    except Exception as e:
        logger.error(f"Admin stats error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch stats")


# ── User management ─────────────────────────────────────────────────────────

@router.get("/users")
@limiter.limit("10/minute")
async def list_users(request: Request, admin: dict = Depends(_require_admin)):
    """List all users with their subscription info."""
    try:
        profiles = await supabase.table("profiles").select("id,email,full_name,created_at,is_admin").order("created_at", desc=True).execute()
        subscriptions = await supabase.table("subscriptions").select("user_id,plan,status,stripe_customer_id").execute()

        sub_map = {s["user_id"]: s for s in subscriptions}

        return [
            {
                **p,
                "plan": sub_map.get(p["id"], {}).get("plan", "free"),
                "subscription_status": sub_map.get(p["id"], {}).get("status", "none"),
                "stripe_customer_id": sub_map.get(p["id"], {}).get("stripe_customer_id"),
            }
            for p in profiles
        ]
    except Exception as e:
        logger.error(f"Admin list users error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch users")


@router.patch("/users/{user_id}/plan")
@limiter.limit("10/minute")
async def update_user_plan(request: Request, user_id: str, body: UserPlanUpdate, admin: dict = Depends(_require_admin)):
    """Manually set a user's subscription plan."""
    allowed_plans = {"free", "core", "premium"}
    if body.plan not in allowed_plans:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Plan must be one of {allowed_plans}")

    try:
        existing = await supabase.table("subscriptions").select("user_id").eq("user_id", user_id).execute()
        now = datetime.now(timezone.utc).isoformat()
        if existing:
            await supabase.table("subscriptions").update({"plan": body.plan, "updated_at": now}).eq("user_id", user_id).execute()
        else:
            await supabase.table("subscriptions").insert([{
                "user_id": user_id,
                "plan": body.plan,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }]).execute()
        return {"success": True, "user_id": user_id, "plan": body.plan}
    except Exception as e:
        logger.error(f"Update user plan error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update plan")


# ── AI Knowledge Base ────────────────────────────────────────────────────────

@router.get("/knowledge")
@limiter.limit("10/minute")
async def list_knowledge(request: Request, admin: dict = Depends(_require_admin)):
    """List all AI knowledge base entries."""
    try:
        rows = await supabase.table("ai_knowledge_base").select().order("created_at", desc=True).execute()
        return rows
    except Exception as e:
        logger.error(f"Admin list knowledge error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch knowledge base")


@router.post("/knowledge")
@limiter.limit("10/minute")
async def create_knowledge(request: Request, body: KnowledgeCreate, admin: dict = Depends(_require_admin)):
    """Add a new entry to the AI knowledge base."""
    if not body.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content cannot be empty")

    try:
        row = {
            "content": body.content.strip(),
            "source_label": body.source_label.strip() or "manual",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await supabase.table("ai_knowledge_base").insert([row]).execute()
        return result[0] if result else row
    except Exception as e:
        logger.error(f"Admin create knowledge error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create knowledge entry")


@router.delete("/knowledge/{entry_id}")
@limiter.limit("10/minute")
async def delete_knowledge(request: Request, entry_id: str, admin: dict = Depends(_require_admin)):
    """Delete an AI knowledge base entry."""
    try:
        await supabase.table("ai_knowledge_base").delete().eq("id", entry_id).execute()
        return {"success": True, "id": entry_id}
    except Exception as e:
        logger.error(f"Admin delete knowledge error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete knowledge entry")


# ── Sean's Watch List Models ──────────────────────────────────────────────────
class WatchItemCreate(BaseModel):
    symbol: str
    direction: str = "long"
    setup_type: Optional[str] = None
    priority: str = "high"
    is_active: bool = True
    entry_type: str = "breakout"
    breakout_level: Optional[float] = None
    ema_level: Optional[str] = None
    contract_type: Optional[str] = None
    strike_price: Optional[float] = None
    expiration_date: Optional[str] = None
    target1: Optional[float] = None
    target2: Optional[float] = None
    target3: Optional[float] = None
    stop_price: Optional[float] = None
    session_date: Optional[str] = None
    notes: Optional[str] = None
    entry_trigger: Optional[float] = None
    target_price: Optional[float] = None
    why_watching: Optional[str] = None
    catalyst: Optional[str] = None
    sector_context: Optional[str] = None
    ideal_entry_notes: Optional[str] = None
    risk_notes: Optional[str] = None
    outcome: Optional[str] = None
    outcome_notes: Optional[str] = None
    dte_min: Optional[int] = None
    dte_max: Optional[int] = None
    delta_target: Optional[float] = None
    contracts_qty: Optional[int] = None


class WatchItemUpdate(BaseModel):
    symbol: Optional[str] = None
    direction: Optional[str] = None
    setup_type: Optional[str] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None
    entry_type: Optional[str] = None
    breakout_level: Optional[float] = None
    ema_level: Optional[str] = None
    contract_type: Optional[str] = None
    strike_price: Optional[float] = None
    expiration_date: Optional[str] = None
    target1: Optional[float] = None
    target2: Optional[float] = None
    target3: Optional[float] = None
    stop_price: Optional[float] = None
    session_date: Optional[str] = None
    notes: Optional[str] = None
    entry_trigger: Optional[float] = None
    target_price: Optional[float] = None
    why_watching: Optional[str] = None
    catalyst: Optional[str] = None
    sector_context: Optional[str] = None
    ideal_entry_notes: Optional[str] = None
    risk_notes: Optional[str] = None
    outcome: Optional[str] = None
    outcome_notes: Optional[str] = None
    dte_min: Optional[int] = None
    dte_max: Optional[int] = None
    delta_target: Optional[float] = None
    contracts_qty: Optional[int] = None


# ── Sean's Watch List CRUD ────────────────────────────────────────────────────
@router.get("/watchlist")
@limiter.limit("30/minute")
async def get_watchlist(request: Request, admin: dict = Depends(_require_admin)):
    """Get Sean's watch list (admin only). Used to feed AI training context."""
    try:
        result = await supabase.table("sean_watchlist").select("*").order("added_at", desc=True).execute()
        return result or []
    except Exception as e:
        logger.error(f"Get watchlist error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/watchlist")
@limiter.limit("20/minute")
async def add_watchlist_item(
    request: Request,
    item: WatchItemCreate,
    admin: dict = Depends(_require_admin)
):
    """Add a stock to Sean's watch list."""
    try:
        row = {
            "symbol": item.symbol.upper().strip(),
            "direction": item.direction,
            "setup_type": item.setup_type,
            "priority": item.priority,
            "is_active": item.is_active,
            "entry_type": item.entry_type,
            "breakout_level": item.breakout_level,
            "ema_level": item.ema_level,
            "contract_type": item.contract_type,
            "strike_price": item.strike_price,
            "expiration_date": item.expiration_date,
            "target1": item.target1,
            "target2": item.target2,
            "target3": item.target3,
            "stop_price": item.stop_price,
            "session_date": item.session_date,
            "notes": item.notes,
            "entry_trigger": item.breakout_level,
            "target_price": item.target1,
            "why_watching": item.why_watching,
            "catalyst": item.catalyst,
            "sector_context": item.sector_context,
            "ideal_entry_notes": item.ideal_entry_notes,
            "risk_notes": item.risk_notes,
            "outcome": item.outcome,
            "outcome_notes": item.outcome_notes,
            "dte_min": item.dte_min,
            "dte_max": item.dte_max,
            "delta_target": item.delta_target,
            "contracts_qty": item.contracts_qty,
            "added_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await supabase.table("sean_watchlist").insert(row).execute()
        return result[0]
    except Exception as e:
        logger.error(f"Add watchlist error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/watchlist/{item_id}")
@limiter.limit("20/minute")
async def update_watchlist_item(
    request: Request,
    item_id: str,
    item: WatchItemUpdate,
    admin: dict = Depends(_require_admin)
):
    """Update a watch list entry."""
    try:
        updates = {k: v for k, v in item.model_dump().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = await supabase.table("sean_watchlist").update(updates).eq("id", item_id).execute()
        return result[0]
    except Exception as e:
        logger.error(f"Update watchlist error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/watchlist/{item_id}")
@limiter.limit("20/minute")
async def delete_watchlist_item(
    request: Request,
    item_id: str,
    admin: dict = Depends(_require_admin)
):
    """Delete a watch list entry."""
    try:
        await supabase.table("sean_watchlist").delete().eq("id", item_id).execute()
        return {"ok": True}
    except Exception as e:
        logger.error(f"Delete watchlist error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
