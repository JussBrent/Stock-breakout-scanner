from polygon import RESTClient
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from config import settings
import logging

logger = logging.getLogger(__name__)

class PolygonClient:
    """
    Wrapper for Polygon.io API client
    Handles data fetching with error handling and rate limiting
    """
    
    def __init__(self):
        self.client = RESTClient(api_key=settings.POLYGON_API_KEY)
    
    async def get_daily_bars(
        self, 
        ticker: str, 
        days: int = 200
    ) -> List[Dict]:
        """
        Fetch daily OHLCV data for a ticker
        OHLCV (OPEN, HIGH, LOW, CLOSE, VOLUME)
        
        Args:
            ticker: Stock symbol
            days: Number of days of historical data
            
        Returns:
            List of daily bars with OHLCV data
        """
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            aggs = self.client.get_aggs(
                ticker=ticker,
                multiplier=1,
                timespan='day',
                from_=start_date.strftime('%Y-%m-%d'),
                to=end_date.strftime('%Y-%m-%d'),
                limit=50000
            )
            
            bars = []
            for agg in aggs:
                bars.append({
                    'timestamp': agg.timestamp,
                    'open': agg.open,
                    'high': agg.high,
                    'low': agg.low,
                    'close': agg.close,
                    'volume': agg.volume,
                    'vwap': agg.vwap if hasattr(agg, 'vwap') else None
                })
            
            return bars
            
        except Exception as e:
            logger.error(f"Error fetching daily bars for {ticker}: {e}")
            return []
    
    async def get_weekly_bars(
        self, 
        ticker: str, 
        weeks: int = 52
    ) -> List[Dict]:
        """
        Fetch weekly OHLCV data for a ticker
        
        Args:
            ticker: Stock symbol
            weeks: Number of weeks of historical data
            
        Returns:
            List of weekly bars with OHLCV data
        """
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(weeks=weeks)
            
            aggs = self.client.get_aggs(
                ticker=ticker,
                multiplier=1,
                timespan='week',
                from_=start_date.strftime('%Y-%m-%d'),
                to=end_date.strftime('%Y-%m-%d'),
                limit=5000
            )
            
            bars = []
            for agg in aggs:
                bars.append({
                    'timestamp': agg.timestamp,
                    'open': agg.open,
                    'high': agg.high,
                    'low': agg.low,
                    'close': agg.close,
                    'volume': agg.volume
                })
            
            return bars
            
        except Exception as e:
            logger.error(f"Error fetching weekly bars for {ticker}: {e}")
            return []
    
    async def get_ticker_details(self, ticker: str) -> Optional[Dict]:
        """
        Get ticker details including market cap, description, etc.
        
        Args:
            ticker: Stock symbol
            
        Returns:
            Dictionary with ticker details
        """
        try:
            details = self.client.get_ticker_details(ticker)
            return {
                'name': details.name,
                'market_cap': details.market_cap if hasattr(details, 'market_cap') else None,
                'description': details.description if hasattr(details, 'description') else None,
                'sector': details.sic_description if hasattr(details, 'sic_description') else None
            }
        except Exception as e:
            logger.error(f"Error fetching ticker details for {ticker}: {e}")
            return None
    
    async def get_all_tickers(self, market: str = "stocks") -> List[str]:
        """
        Get list of all available tickers
        
        Args:
            market: Market type (stocks, crypto, forex)
            
        Returns:
            List of ticker symbols
        """
        try:
            tickers = self.client.list_tickers(
                market=market,
                active=True,
                limit=1000
            )
            
            return [ticker.ticker for ticker in tickers]
            
        except Exception as e:
            logger.error(f"Error fetching all tickers: {e}")
            return []