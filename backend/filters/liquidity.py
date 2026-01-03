# filters/liquidity.py

from config import settings
import logging

logger = logging.getLogger(__name__)

class LiquidityFilter:
    """
    Filters stocks based on liquidity criteria
    - Minimum volume
    - Minimum market cap
    - Price range
    """
    
    @staticmethod
    def passes_liquidity_requirements(stock_data: dict) -> bool:
        """
        Check if stock meets liquidity requirements
        
        Args:
            stock_data: Dictionary with stock data
            
        Returns:
            True if passes all liquidity filters
        """
        try:
            current_price = stock_data.get('current_price', 0)
            avg_volume = stock_data.get('avg_volume', 0)
            
            # Price filter
            if current_price < settings.MIN_PRICE:
                logger.debug(f"{stock_data['ticker']}: Price too low ({current_price})")
                return False
            
            if current_price > settings.MAX_PRICE:
                logger.debug(f"{stock_data['ticker']}: Price too high ({current_price})")
                return False
            
            # Volume filter
            if avg_volume < settings.MIN_AVG_VOLUME:
                logger.debug(f"{stock_data['ticker']}: Volume too low ({avg_volume})")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error in liquidity filter: {e}")
            return False
    
    @staticmethod
    def get_liquidity_score(stock_data: dict) -> int:
        """
        Calculate liquidity score (0-100)
        
        Args:
            stock_data: Dictionary with stock data
            
        Returns:
            Liquidity score
        """
        try:
            avg_volume = stock_data.get('avg_volume', 0)
            
            # Score based on volume
            if avg_volume > 5_000_000:
                return 100
            elif avg_volume > 2_000_000:
                return 80
            elif avg_volume > 1_000_000:
                return 60
            elif avg_volume > 500_000:
                return 40
            else:
                return 20
                
        except Exception as e:
            logger.error(f"Error calculating liquidity score: {e}")
            return 0