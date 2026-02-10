# data/cache_service.py

from typing import Optional, Any
import logging
import json
import redis
from config import settings

logger = logging.getLogger(__name__)

class CacheService:
    """
    Redis-based cache service with automatic fallback to no-cache mode.
    Caches stock market data to reduce API calls and improve performance.
    """

    def __init__(self):
        self.redis_client = None
        self.enabled = False

        try:
            # Try to connect to Redis
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # Test connection
            self.redis_client.ping()
            self.enabled = True
            logger.info(f"Redis cache enabled at {settings.REDIS_URL}")
        except (redis.ConnectionError, redis.TimeoutError) as e:
            logger.warning(f"Redis connection failed: {e}. Running without cache.")
            self.redis_client = None
            self.enabled = False
        except Exception as e:
            logger.error(f"Unexpected error initializing Redis: {e}. Running without cache.")
            self.redis_client = None
            self.enabled = False

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache by key."""
        if not self.enabled or not self.redis_client:
            return None

        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL (in seconds)."""
        if not self.enabled or not self.redis_client:
            return False

        try:
            ttl = ttl or settings.CACHE_TTL
            serialized = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.enabled or not self.redis_client:
            return False

        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    def get_stock_data(self, ticker: str) -> Optional[dict]:
        """Get cached stock data for a ticker symbol."""
        return self.get(f"stock:{ticker}")

    def set_stock_data(self, ticker: str, data: dict, ttl: Optional[int] = None) -> bool:
        """Cache stock data for a ticker symbol."""
        return self.set(f"stock:{ticker}", data, ttl)