import sys
import os
# Add parent directory to path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
from data.historical_loader import HistoricalLoader
from filters.base_filter import BaseFilter

async def test():
    loader = HistoricalLoader()
    filter_system = BaseFilter()
    
    # Test multiple stocks
    test_tickers = ["AAPL", "TSLA", "NVDA", "GME", "AMC"]
    
    for ticker in test_tickers:
        print(f"\n{'='*50}")
        print(f"Testing {ticker}...")
        
        data = await loader.load_stock_data(ticker, days=200)
        
        if data:
            passes = filter_system.passes_all_filters(data)
            score = filter_system.get_overall_score(data)
            
            print(f"Price: ${data['current_price']:.2f}")
            print(f"Avg Volume: {data['avg_volume']:,.0f}")
            print(f"ADR: {data['adr_percent']:.2f}%")
            print(f"Passes Filters: {'✅ YES' if passes else '❌ NO'}")
            print(f"Overall Score: {score}/100")

if __name__ == "__main__":
    asyncio.run(test())
