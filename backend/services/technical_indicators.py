import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class TechnicalIndicators:
    """
    Technical indicator calculations used throughout the scanner
    """
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Simple Moving Average
        
        Args:
            prices: List of prices
            period: SMA period (e.g., 50, 200)
            
        Returns:
            SMA value or None
        """
        try:
            if len(prices) < period:
                return None
            return np.mean(prices[-period:])
        except Exception as e:
            logger.error(f"Error calculating SMA: {e}")
            return None
    
    @staticmethod
    def calculate_atr(
        highs: List[float], 
        lows: List[float], 
        closes: List[float], 
        period: int = 14
    ) -> Optional[float]:
        """
        Calculate Average True Range
        
        Args:
            highs: List of high prices
            lows: List of low prices
            closes: List of closing prices
            period: ATR period (default 14)
            
        Returns:
            ATR value or None
        """
        try:
            if len(highs) < period + 1:
                return None
            
            true_ranges = []
            for i in range(1, len(highs)):
                high_low = highs[i] - lows[i]
                high_close = abs(highs[i] - closes[i-1])
                low_close = abs(lows[i] - closes[i-1])
                true_range = max(high_low, high_close, low_close)
                true_ranges.append(true_range)
            
            return np.mean(true_ranges[-period:])
        except Exception as e:
            logger.error(f"Error calculating ATR: {e}")
            return None
    
    @staticmethod
    def calculate_adr(
        highs: List[float], 
        lows: List[float], 
        period: int = 20
    ) -> Optional[float]:
        """
        Calculate Average Daily Range
        
        Args:
            highs: List of high prices
            lows: List of low prices
            period: Number of days to average
            
        Returns:
            ADR value or None
        """
        try:
            if len(highs) < period:
                return None
            
            daily_ranges = [
                highs[i] - lows[i] 
                for i in range(-period, 0)
            ]
            
            return np.mean(daily_ranges)
        except Exception as e:
            logger.error(f"Error calculating ADR: {e}")
            return None
    
    @staticmethod
    def find_swing_highs(
        highs: List[float], 
        closes: List[float],
        lookback: int = 5
    ) -> List[Dict]:
        """
        Find swing high points
        
        Args:
            highs: List of high prices
            closes: List of closing prices
            lookback: Bars to look back/forward for confirmation
            
        Returns:
            List of swing high dictionaries
        """
        try:
            swing_highs = []
            
            for i in range(lookback, len(highs) - lookback):
                is_swing_high = True
                
                # Check if this high is greater than surrounding highs
                for j in range(i - lookback, i + lookback + 1):
                    if j != i and highs[j] >= highs[i]:
                        is_swing_high = False
                        break
                
                if is_swing_high:
                    swing_highs.append({
                        'index': i,
                        'price': highs[i],
                        'close': closes[i]
                    })
            
            return swing_highs
        except Exception as e:
            logger.error(f"Error finding swing highs: {e}")
            return []
    
    @staticmethod
    def find_swing_lows(
        lows: List[float], 
        closes: List[float],
        lookback: int = 5
    ) -> List[Dict]:
        """
        Find swing low points
        
        Args:
            lows: List of low prices
            closes: List of closing prices
            lookback: Bars to look back/forward for confirmation
            
        Returns:
            List of swing low dictionaries
        """
        try:
            swing_lows = []
            
            for i in range(lookback, len(lows) - lookback):
                is_swing_low = True
                
                # Check if this low is less than surrounding lows
                for j in range(i - lookback, i + lookback + 1):
                    if j != i and lows[j] <= lows[i]:
                        is_swing_low = False
                        break
                
                if is_swing_low:
                    swing_lows.append({
                        'index': i,
                        'price': lows[i],
                        'close': closes[i]
                    })
            
            return swing_lows
        except Exception as e:
            logger.error(f"Error finding swing lows: {e}")
            return []
    
    @staticmethod
    def calculate_volatility(prices: List[float]) -> float:
        """
        Calculate price volatility (standard deviation)
        
        Args:
            prices: List of prices
            
        Returns:
            Volatility value
        """
        try:
            return np.std(prices) if len(prices) > 0 else 0.0
        except Exception as e:
            logger.error(f"Error calculating volatility: {e}")
            return 0.0