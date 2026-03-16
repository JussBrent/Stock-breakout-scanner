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
        ai_service = get_ai_service()

        # Convert to dict format for Claude API
        messages = [{"role": m.role, "content": m.content} for m in body.messages]

        reply = await ai_service.chat(
            messages=messages,
            scan_context=body.scan_context
        )

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
