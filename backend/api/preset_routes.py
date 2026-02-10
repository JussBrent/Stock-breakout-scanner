"""
API routes for filter preset management
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.supabase_client import get_supabase_client

router = APIRouter()


class FilterPreset(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    filters: Dict[str, Any]
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CreatePresetRequest(BaseModel):
    name: str
    description: Optional[str] = None
    filters: Dict[str, Any]


class UpdatePresetRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


async def get_current_user(authorization: str = Header(None)):
    """Get current user from authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase_client()
    
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def verify_admin(authorization: str = Header(None)):
    """Verify user is admin"""
    user = await get_current_user(authorization)
    
    supabase = get_supabase_client()
    result = supabase.table("users").select("is_admin").eq("id", user.id).execute()
    
    if not result.data or not result.data[0].get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


@router.get("/", response_model=List[FilterPreset])
async def list_presets(user = Depends(verify_admin)):
    """List all filter presets (admin only)"""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("filter_presets")\
            .select("*")\
            .order("created_at", desc=True)\
            .execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch presets: {str(e)}")


@router.get("/{preset_id}", response_model=FilterPreset)
async def get_preset(preset_id: str, user = Depends(verify_admin)):
    """Get a specific filter preset (admin only)"""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("filter_presets")\
            .select("*")\
            .eq("id", preset_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch preset: {str(e)}")


@router.post("/", response_model=FilterPreset)
async def create_preset(preset: CreatePresetRequest, user = Depends(verify_admin)):
    """Create a new filter preset (admin only)"""
    supabase = get_supabase_client()
    
    try:
        # Convert Set objects to lists for JSON serialization
        filters_serializable = _serialize_filters(preset.filters)
        
        result = supabase.table("filter_presets").insert({
            "name": preset.name,
            "description": preset.description,
            "filters": filters_serializable,
            "created_by": user.id
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create preset")
        
        return result.data[0]
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=409, detail="Preset with this name already exists")
        raise HTTPException(status_code=500, detail=f"Failed to create preset: {str(e)}")


@router.put("/{preset_id}", response_model=FilterPreset)
async def update_preset(
    preset_id: str,
    preset: UpdatePresetRequest,
    user = Depends(verify_admin)
):
    """Update a filter preset (admin only)"""
    supabase = get_supabase_client()
    
    try:
        # Check if preset exists and belongs to user
        existing = supabase.table("filter_presets")\
            .select("*")\
            .eq("id", preset_id)\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        if existing.data[0]["created_by"] != user.id:
            raise HTTPException(status_code=403, detail="Can only update your own presets")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if preset.name is not None:
            update_data["name"] = preset.name
        if preset.description is not None:
            update_data["description"] = preset.description
        if preset.filters is not None:
            update_data["filters"] = _serialize_filters(preset.filters)
        
        result = supabase.table("filter_presets")\
            .update(update_data)\
            .eq("id", preset_id)\
            .execute()
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preset: {str(e)}")


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str, user = Depends(verify_admin)):
    """Delete a filter preset (admin only)"""
    supabase = get_supabase_client()
    
    try:
        # Check if preset exists and belongs to user
        existing = supabase.table("filter_presets")\
            .select("*")\
            .eq("id", preset_id)\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        if existing.data[0]["created_by"] != user.id:
            raise HTTPException(status_code=403, detail="Can only delete your own presets")
        
        supabase.table("filter_presets").delete().eq("id", preset_id).execute()
        
        return {"message": "Preset deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete preset: {str(e)}")


def _serialize_filters(filters: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Set objects to lists for JSON serialization"""
    serialized = {}
    for key, value in filters.items():
        if isinstance(value, set):
            serialized[key] = list(value)
        else:
            serialized[key] = value
    return serialized
