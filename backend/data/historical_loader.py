# data/historical_loader.py

from typing import Dict, List, Optional
from data.polygon_client import PolygonClient
from data.cache_service import CacheService
from services.technical_indicators import TechnicalIndicators
import logging

logger = logging.getLogger(__name__)

class HistoricalLoader:
    """
    Loads and processes historical stock data
    Combines price data with technical indicators
    """
    
    def __init__(self):
        self.polygon_client = PolygonClient()
        self.cache_service = CacheService()
        self.tech_indicators = TechnicalIndicators()
    
    async def load_stock_data(
        self, 
        ticker: str, 
        days: int = 200,
        use_cache: bool = True
    ) -> Optional[Dict]:
        """
        Load complete stock data with technical indicators
        
        Args:
            ticker: Stock symbol
            days: Days of historical data
            use_cache: Whether to use cached data
            
        Returns:
            Dictionary with price data and indicators
        """
        try:
            # Try cache first
            if use_cache:
                cached_data = self.cache_service.get_stock_data(ticker)
                if cached_data:
                    logger.info(f"Cache hit for {ticker}")
                    return cached_data
            
            # Fetch fresh data from Polygon
            logger.info(f"Fetching fresh data for {ticker}")
            daily_bars = await self.polygon_client.get_daily_bars(ticker, days)
            weekly_bars = await self.polygon_client.get_weekly_bars(ticker, weeks=52)
            
            if not daily_bars:
                logger.warning(f"No data found for {ticker}")
                return None
            
            # Extract price arrays
            closes = [bar['close'] for bar in daily_bars]
            highs = [bar['high'] for bar in daily_bars]
            lows = [bar['low'] for bar in daily_bars]
            opens = [bar['open'] for bar in daily_bars]
            volumes = [bar['volume'] for bar in daily_bars]
            
            # Calculate technical indicators
            sma_50 = self.tech_indicators.calculate_sma(closes, 50)
            sma_200 = self.tech_indicators.calculate_sma(closes, 200)
            atr = self.tech_indicators.calculate_atr(highs, lows, closes, 14)
            adr = self.tech_indicators.calculate_adr(highs, lows, 20)
            
            # Calculate average volume
            avg_volume = sum(volumes[-30:]) / len(volumes[-30:]) if len(volumes) >= 30 else 0
            
            stock_data = {
                'ticker': ticker,
                'daily_bars': daily_bars,
                'weekly_bars': weekly_bars,
                'current_price': closes[-1],
                'sma_50': sma_50,
                'sma_200': sma_200,
                'atr': atr,
                'adr': adr,
                'adr_percent': (adr / closes[-1]) * 100 if closes[-1] > 0 else 0,
                'avg_volume': avg_volume,
                'closes': closes,
                'highs': highs,
                'lows': lows,
                'opens': opens,
                'volumes': volumes
            }
            
            # Cache the result
            if use_cache:
                self.cache_service.set_stock_data(ticker, stock_data)
            
            return stock_data
            
        except Exception as e:
            logger.error(f"Error loading stock data for {ticker}: {e}")
            return None
    
    async def load_multiple_stocks(
        self, 
        tickers: List[str], 
        days: int = 200
    ) -> Dict[str, Dict]:
        """
        Load data for multiple stocks
        
        Args:
            tickers: List of stock symbols
            days: Days of historical data
            
        Returns:
            Dictionary mapping ticker to stock data
        """
        results = {}
        
        for ticker in tickers:
            logger.info(f"Loading {ticker}...")
            data = await self.load_stock_data(ticker, days)
            if data:
                results[ticker] = data
        
        return results