from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Polygon API
    POLYGON_API_KEY: str

    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_JWT_SECRET: Optional[str] = None

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRICE_ID: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600  # 1 hour

    # Environment
    ENVIRONMENT: str = "development"

    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"

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

    # Scanning Configuration
    SCAN_LOOKBACK_DAYS: int = 420  # Days of historical data for scanning (~1.2 years)
    SCAN_API_DELAY: float = 0.5  # Delay between API calls in seconds
    SCAN_CONCURRENCY_LIMIT: int = 3  # Max concurrent API requests
    DEFAULT_SCAN_UNIVERSE: str = "AAPL,MSFT,NVDA,AMZN,TSLA"  # Comma-separated default symbols

    # AI Analysis Configuration
    OPENAI_MODEL: str = "gpt-4o-mini"  # OpenAI model to use
    AI_ANALYSIS_MAX_STOCKS: int = 50  # Max stocks to analyze with AI per request

    class Config:
        env_file = ".env"

settings = Settings()