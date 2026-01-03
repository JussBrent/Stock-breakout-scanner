# data/cache_service.py

from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

class CacheService:
    """
    Dummy cache service (no caching)
    Use this for development without Redis
    """
    
    def __init__(self):
        logger.info("Cache disabled - running without Redis")
        self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        """Always returns None (no cache)"""
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Does nothing (no cache)"""
        return False
    
    def delete(self, key: str) -> bool:
        """Does nothing (no cache)"""
        return False
    
    def get_stock_data(self, ticker: str) -> Optional[dict]:
        """Always returns None (no cache)"""
        return None
    
    def set_stock_data(self, ticker: str, data: dict, ttl: Optional[int] = None) -> bool:
        """Does nothing (no cache)"""
        return False