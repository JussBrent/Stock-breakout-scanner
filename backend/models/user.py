"""
User-related data models.
Note: User authentication is handled by Supabase Auth.
These models are for user-related data stored in our database.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class UserProfile(BaseModel):
    """User profile information."""
    user_id: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class UserPreferences(BaseModel):
    """User preferences for scanner settings."""
    user_id: str
    # Scan preferences
    min_score: int = 70
    max_distance_pct: float = 5.0
    min_adr_pct: float = 2.0
    setup_types: List[str] = ["FLAT_TOP", "ASCENDING_WEDGE", "HIGH_TIGHT_FLAG"]

    # Display preferences
    default_timeframe: str = "1D"
    results_per_page: int = 25
    dark_mode: bool = True

    # Notification preferences
    email_alerts: bool = False
    alert_threshold: int = 80

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "min_score": 75,
                "max_distance_pct": 3.0,
                "setup_types": ["FLAT_TOP", "ASCENDING_WEDGE"],
                "email_alerts": True
            }
        }


class Watchlist(BaseModel):
    """User watchlist for tracking specific symbols."""
    id: Optional[int] = None
    user_id: str
    symbol: str
    added_at: datetime
    notes: Optional[str] = None
    alert_enabled: bool = False
    alert_price: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "symbol": "AAPL",
                "notes": "Strong setup, watching for breakout",
                "alert_enabled": True,
                "alert_price": 185.50
            }
        }


class WatchlistCreate(BaseModel):
    """Request model for creating a watchlist item."""
    symbol: str
    notes: Optional[str] = None
    alert_enabled: bool = False
    alert_price: Optional[float] = None


class WatchlistUpdate(BaseModel):
    """Request model for updating a watchlist item."""
    notes: Optional[str] = None
    alert_enabled: Optional[bool] = None
    alert_price: Optional[float] = None


class Subscription(BaseModel):
    """User subscription information."""
    user_id: str
    plan: str = "free"  # free, premium, pro
    status: str = "active"  # active, canceled, past_due
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "plan": "premium",
                "status": "active",
                "stripe_customer_id": "cus_123456",
                "stripe_subscription_id": "sub_123456"
            }
        }