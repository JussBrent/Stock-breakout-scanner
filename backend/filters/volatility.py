# filters/volatility.py

from config import settings
import logging

logger = logging.getLogger(__name__)

class VolatilityFilter:
    """
    Filters stocks based on volatility criteria
    - Average Daily Range (ADR)
    - Average True Range (ATR)
    """
    
    @staticmethod
    def passes_volatility_requirements(stock_data: dict) -> bool:
        """
        Check if stock meets volatility requirements
        
        Args:
            stock_data: Dictionary with stock data
            
        Returns:
            True if passes all volatility filters
        """
        try:
            adr_percent = stock_data.get('adr_percent', 0)
            
            # Minimum ADR for movement potential
            if adr_percent < settings.MIN_ADR_PERCENT:
                logger.debug(f"{stock_data['ticker']}: ADR too low ({adr_percent:.2f}%)")
                return False
            
            # Maximum ADR (avoid extremely volatile stocks)
            if adr_percent > settings.MAX_ATR_PERCENT:
                logger.debug(f"{stock_data['ticker']}: ADR too high ({adr_percent:.2f}%)")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error in volatility filter: {e}")
            return False
    
    @staticmethod
    def get_volatility_score(stock_data: dict) -> int:
        """
        Calculate volatility score (0-100)
        Higher score for ideal volatility range
        
        Args:
            stock_data: Dictionary with stock data
            
        Returns:
            Volatility score
        """
        try:
            adr_percent = stock_data.get('adr_percent', 0)
            
            # Optimal range: 2-5%
            if 2.0 <= adr_percent <= 5.0:
                return 100
            elif 1.5 <= adr_percent < 2.0 or 5.0 < adr_percent <= 7.0:
                return 75
            elif 1.0 <= adr_percent < 1.5 or 7.0 < adr_percent <= 10.0:
                return 50
            else:
                return 25
                
        except Exception as e:
            logger.error(f"Error calculating volatility score: {e}")
            return 0