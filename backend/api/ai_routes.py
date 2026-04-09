"""
AI Chat API endpoint — conversational stock advisor powered by Claude.
Requires authentication.
"""
from fastapi import APIRouter, HTTPException, Security, status, Request
from pydantic import BaseModel
from typing import List, Optional
import logging

from middleware.auth import get_current_user
from middleware.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    scan_context: Optional[str] = None  # Optional scan results / filter context


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def ai_chat(
    request: Request,
    body: ChatRequest,
    user: dict = Security(get_current_user, scopes=[])
):
    """Send a message to Sean (AI stock advisor) and get a response."""
    try:
        from services.ai_analysis import get_ai_service
        from services.supabase_client import supabase
        ai_service = get_ai_service()
        user_id = user["user_id"]

        # Convert to dict format for Claude API
        messages = [{"role": m.role, "content": m.content} for m in body.messages]

        reply = await ai_service.chat(
            messages=messages,
            scan_context=body.scan_context,
            user_id=user_id,
        )

        # Log query for analytics (fire and forget)
        try:
            last_user_msg = next((m.content for m in reversed(body.messages) if m.role == "user"), "")
            category = _classify_query(last_user_msg)
            await supabase.table("ai_query_log").insert([{
                "user_id": user_id,
                "query_text": last_user_msg[:500],
                "category": category,
            }]).execute()
        except Exception:
            pass  # Don't fail the chat if logging fails

        return ChatResponse(reply=reply)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI chat failed: {str(e)}"
        )


def _classify_query(text: str) -> str:
    """Simple keyword-based query classification for analytics."""
    text_lower = text.lower()
    if any(w in text_lower for w in ["scan", "breakout", "setup", "score"]):
        return "stock_analysis"
    if any(w in text_lower for w in ["pattern", "flag", "wedge", "base", "cup"]):
        return "pattern"
    if any(w in text_lower for w in ["compare", "vs", "versus", "better"]):
        return "comparison"
    if any(w in text_lower for w in ["risk", "stop", "position size"]):
        return "risk_management"
    return "general"


@router.get("/query-log")
@limiter.limit("30/minute")
async def get_query_log(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
    limit: int = 50,
):
    """Get AI query history for analytics."""
    try:
        from services.supabase_client import supabase
        rows = await (
            supabase.table("ai_query_log")
            .select("*")
            .eq("user_id", user["user_id"])
            .order("queried_at", desc=True)
            .limit(min(limit, 100))
            .execute()
        )
        return {"queries": rows or []}
    except Exception as e:
        logger.error(f"Get query log failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
