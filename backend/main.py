import asyncio
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from scan.scan_universe import scan_universe
from scan.mock_results import get_mock_results
from services.save_results import save_scan_results


async def main():
    """Run the breakout scanner and save results to Supabase."""
    print("🚀 Starting breakout scanner...")

    try:
        # TRY: Real Polygon scan (may fail due to rate limits on free tier)
        # For production: upgrade Polygon plan or use alternative provider
        print("Attempting Polygon API scan...")
        results = await scan_universe()

        # FALLBACK: If Polygon fails, use mock data for demo
        if not results:
            print("⚠️  Polygon API rate limited. Using mock data for demo...")
            results = await get_mock_results()

        if results:
            print(f"\n✅ Found {len(results)} actionable setups:")
            print()

            # Show top 25
            for i, r in enumerate(results[:25], 1):
                print(
                    f"{i}. {r.symbol:5} | score {r.breakout_score:3} | "
                    f"${r.price:7.2f} → ${r.trigger_price:7.2f} | "
                    f"dist {r.distance_pct:5.2f}% | ADR {r.adr_pct_14:5.2f}% | {r.setup_type}"
                )

            print()
            print(f"Saving to Supabase...")
            try:
                await save_scan_results(results)
                print("✨ Scan complete.")
            except Exception as save_err:
                print(f"⚠️  Supabase save failed (demo mode): {save_err}")
                print("✨ Scan complete (results not saved).")
        else:
            print("No actionable setups found.")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)


if __name__ == "__main__":
    asyncio.run(main())
