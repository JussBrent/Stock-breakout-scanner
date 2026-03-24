"""
AI Training Content API — CRUD for training material (transcripts, notes, etc.)
that gets injected into Sean's system prompt as knowledge context.
Requires authentication.
"""
from fastapi import APIRouter, HTTPException, Security, status, Request
from pydantic import BaseModel
from typing import List, Optional
import logging
import re

from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────

class TrainingContentCreate(BaseModel):
    title: str
    content: str
    source_type: str = "transcript"
    tags: List[str] = []


class YouTubeImportRequest(BaseModel):
    url: str
    tags: List[str] = []


class TrainingContentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class TrainingContentResponse(BaseModel):
    id: str
    title: str
    content: str
    source_type: str
    tags: List[str]
    is_active: bool
    created_at: str
    updated_at: str


# ── Routes ────────────────────────────────────────────────────────────

@router.get("/")
@limiter.limit("30/minute")
async def list_training_content(
    request: Request,
    user: dict = Security(get_current_user, scopes=[]),
):
    """List all training content."""
    try:
        rows = await (
            supabase.table("ai_training_content")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return rows
    except Exception as e:
        logger.error(f"List training content failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", status_code=201)
@limiter.limit("10/minute")
async def create_training_content(
    request: Request,
    body: TrainingContentCreate,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Add new training content (transcript, notes, etc.)."""
    try:
        rows = await (
            supabase.table("ai_training_content")
            .insert([{
                "title": body.title,
                "content": body.content,
                "source_type": body.source_type,
                "tags": body.tags,
                "created_by": user["user_id"],
            }])
            .execute()
        )
        return rows[0]
    except Exception as e:
        logger.error(f"Create training content failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{content_id}")
@limiter.limit("10/minute")
async def update_training_content(
    request: Request,
    content_id: str,
    body: TrainingContentUpdate,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Update training content."""
    try:
        update_data = {k: v for k, v in body.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        rows = await (
            supabase.table("ai_training_content")
            .update(update_data)
            .eq("id", content_id)
            .execute()
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Training content not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update training content failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{content_id}", status_code=204)
@limiter.limit("10/minute")
async def delete_training_content(
    request: Request,
    content_id: str,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Delete training content."""
    try:
        await (
            supabase.table("ai_training_content")
            .delete()
            .eq("id", content_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"Delete training content failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{content_id}/toggle")
@limiter.limit("10/minute")
async def toggle_training_content(
    request: Request,
    content_id: str,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Toggle training content active/inactive."""
    try:
        rows = await (
            supabase.table("ai_training_content")
            .select("is_active")
            .eq("id", content_id)
            .execute()
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Training content not found")

        new_state = not rows[0]["is_active"]
        updated = await (
            supabase.table("ai_training_content")
            .update({"is_active": new_state})
            .eq("id", content_id)
            .execute()
        )
        return updated[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Toggle training content failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── YouTube Import ───────────────────────────────────────────────────

def _extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/v/)([a-zA-Z0-9_-]{11})",
        r"^([a-zA-Z0-9_-]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url.strip())
        if match:
            return match.group(1)
    return None


@router.post("/youtube", status_code=201)
@limiter.limit("5/minute")
async def import_youtube_transcript(
    request: Request,
    body: YouTubeImportRequest,
    user: dict = Security(get_current_user, scopes=[]),
):
    """Fetch a YouTube video's transcript and save it as training content."""
    video_id = _extract_video_id(body.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="youtube-transcript-api is not installed",
        )

    # Fetch transcript (v1.x API: instance method, returns FetchedTranscript with .text snippets)
    try:
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id)
        transcript_text = " ".join(seg.text for seg in transcript)
    except Exception as e:
        err_name = type(e).__name__
        logger.error(f"YouTube transcript fetch failed ({err_name}): {e}")
        if "disabled" in str(e).lower():
            raise HTTPException(status_code=400, detail="Transcripts are disabled for this video")
        if "no transcript" in str(e).lower():
            raise HTTPException(status_code=400, detail="No transcript found for this video. It may not have captions.")
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcript: {str(e)}")

    # Use video ID as fallback title — frontend can set a real title
    title = f"YouTube: {video_id}"

    # Fetch video title via a simple HTTP call to YouTube's oembed
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            )
            if resp.status_code == 200:
                title = resp.json().get("title", title)
    except Exception:
        pass  # Keep fallback title

    # Save to database
    try:
        rows = await (
            supabase.table("ai_training_content")
            .insert([{
                "title": title,
                "content": transcript_text,
                "source_type": "youtube",
                "tags": body.tags,
                "created_by": user["user_id"],
            }])
            .execute()
        )
        return rows[0]
    except Exception as e:
        logger.error(f"Save YouTube training content failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
