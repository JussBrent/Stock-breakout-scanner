"""
User preferences API endpoints.
Requires authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone

from models.user import UserPreferences
from services.supabase_client import supabase
from middleware.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=UserPreferences)
async def get_preferences(user: dict = Depends(get_current_user)):
    """
    Get user's preferences.
    Returns default preferences if not set.
    """
    try:
        user_id = user["user_id"]

        query = supabase.table("user_preferences").select()
        query = query.eq("user_id", user_id)

        results = await query.execute()

        if results:
            return results[0]
        else:
            # Return default preferences
            return UserPreferences(
                user_id=user_id,
                created_at=datetime.now(timezone.utc)
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch preferences: {str(e)}"
        )


@router.post("/", response_model=UserPreferences, status_code=status.HTTP_201_CREATED)
async def create_preferences(
    preferences: UserPreferences,
    user: dict = Depends(get_current_user)
):
    """
    Create or update user preferences.
    """
    try:
        user_id = user["user_id"]

        # Override user_id from token
        preferences.user_id = user_id
        preferences.created_at = datetime.now(timezone.utc)

        # Check if preferences already exist
        existing = await supabase.table("user_preferences").select()
        existing = existing.eq("user_id", user_id)
        existing_results = await existing.execute()

        if existing_results:
            # Update existing preferences
            # Note: This requires proper UPDATE implementation
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Preferences already exist. Use PATCH /api/preferences to update."
            )

        # Create new preferences
        prefs_data = preferences.model_dump()
        result = await supabase.table("user_preferences").insert([prefs_data]).execute()

        if result:
            return result[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create preferences"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create preferences: {str(e)}"
        )


@router.patch("/")
async def update_preferences(
    preferences: dict,
    user: dict = Depends(get_current_user)
):
    """
    Update user preferences (partial update).
    Only updates fields that are provided.
    """
    try:
        user_id = user["user_id"]

        # Add updated timestamp
        preferences["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Update in database
        query = supabase.table("user_preferences").update(preferences)
        query = query.eq("user_id", user_id)
        result = await query.execute()

        if result:
            return {
                "success": True,
                "message": "Preferences updated successfully",
                "data": result[0] if result else None
            }
        else:
            # If no preferences exist, create them
            preferences["user_id"] = user_id
            preferences["created_at"] = datetime.now(timezone.utc).isoformat()
            result = await supabase.table("user_preferences").insert([preferences]).execute()
            return {
                "success": True,
                "message": "Preferences created successfully",
                "data": result[0] if result else None
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}"
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def reset_preferences(user: dict = Depends(get_current_user)):
    """
    Reset user preferences to defaults by deleting custom preferences.
    """
    try:
        user_id = user["user_id"]

        # Delete preferences from database
        query = supabase.table("user_preferences").delete()
        query = query.eq("user_id", user_id)
        await query.execute()

        return None  # 204 No Content

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset preferences: {str(e)}"
        )