from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Polygon API
    POLYGON_API_KEY: str

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour
    
    # Filtering Thresholds
    MIN_PRICE: float = 5.00
    MAX_PRICE: float = 1000.00
    MIN_AVG_VOLUME: int = 500_000
    MIN_MARKET_CAP: int = 500_000_000  # $500M
    MIN_ADR_PERCENT: float = 2.0
    MAX_ATR_PERCENT: float = 15.0
    
    # Consolidation Detection
    CONSOLIDATION_LOOKBACK_DAYS: int = 120
    VOLATILITY_CONTRACTION_RATIO: float = 0.7
    MAX_RANGE_PERCENT: float = 0.25
    MAX_SINGLE_DAY_MOVE: float = 10.0
    
    # Breakout Proximity
    PROXIMITY_THRESHOLD_PERCENT: float = 5.0
    IDEAL_PROXIMITY_PERCENT: float = 2.0
    
    # Volume Analysis
    VOLUME_RATIO_THRESHOLD: float = 1.0
    
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    class Config:
        env_file = ".env"

settings = Settings()