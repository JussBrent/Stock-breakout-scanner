"""
Push notification subscription endpoints.
Stores and removes browser Web Push subscriptions for the current user.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timezone
import logging

from services.supabase_client import supabase
from middleware.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_push(
    body: PushSubscriptionCreate,
    user: dict = Depends(get_current_user),
):
    """
    Save the browser's Web Push subscription for the current user.
    The subscription_data JSON (endpoint + keys) is what pywebpush needs
    to deliver notifications server-side.
    """
    user_id = user["user_id"]
    try:
        subscription_data = {
            "endpoint": body.endpoint,
            "keys": {
                "p256dh": body.keys.p256dh,
                "auth": body.keys.auth,
            },
        }
        row = {
            "user_id": user_id,
            "subscription_data": subscription_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await supabase.table("push_subscriptions").insert([row]).execute()
        return {"status": "subscribed"}
    except Exception as e:
        logger.error("Failed to save push subscription for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save push subscription",
        )


@router.delete("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe_push(user: dict = Depends(get_current_user)):
    """Remove the current user's browser push subscription."""
    user_id = user["user_id"]
    try:
        await (
            supabase.table("push_subscriptions")
            .delete()
            .eq("user_id", user_id)
            .execute()
        )
        return None
    except Exception as e:
        logger.error("Failed to remove push subscription for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove push subscription",
        )
