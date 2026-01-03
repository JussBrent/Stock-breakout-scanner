# test_foundation.py
import asyncio
from data.historical_loader import HistoricalLoader

async def test():
    loader = HistoricalLoader()
    
    # Test loading data for AAPL
    print("Loading AAPL data...")
    data = await loader.load_stock_data("AAPL", days=200)
    
    if data:
        print(f"\n✅ Success!")
        print(f"Ticker: {data['ticker']}")
        print(f"Current Price: ${data['current_price']:.2f}")
        print(f"50 SMA: ${data['sma_50']:.2f}" if data['sma_50'] else "50 SMA: Not enough data")
        print(f"200 SMA: ${data['sma_200']:.2f}" if data['sma_200'] else "200 SMA: Not enough data")
        print(f"ADR: ${data['adr']:.2f} ({data['adr_percent']:.2f}%)")
        print(f"Avg Volume: {data['avg_volume']:,.0f}")
        print(f"Data points: {len(data['closes'])}")
    else:
        print("❌ Failed to load data")

if __name__ == "__main__":
    asyncio.run(test())