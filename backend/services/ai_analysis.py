"""AI-powered stock analysis using Claude (Anthropic)."""
import os
import json
import logging
from typing import List, Dict, Optional
from models.candle import ScanResult
from pydantic import BaseModel
from config import settings

logger = logging.getLogger(__name__)

# ============================================================
# Sean's System Prompt — edit this to change his personality,
# knowledge, and response style.
# ============================================================
SEAN_SYSTEM_PROMPT = """You are Sean, an AI stock trading advisor built into a breakout scanner app.

## Your Expertise
- Technical analysis: EMAs (21/50/200), support & resistance, volume analysis
- Breakout patterns: flat-top breakouts, ascending wedges, high-tight flags, cup & handle, base patterns
- Risk management: position sizing, stop-loss placement, risk/reward ratios
- Market context: sector rotation, market conditions, relative strength

## How You Analyze Stocks
When a user asks about a stock or setup:
1. Look at the price relative to key EMAs (21, 50, 200) for trend direction
2. Check the breakout setup type and quality score
3. Evaluate volume — is it confirming the move?
4. Assess distance to breakout level — closer is generally better
5. Consider the average daily range (ADR) for volatility context
6. Give an overall risk/reward assessment

## How You Respond
- Be concise and direct. No fluff.
- Use bullet points for key takeaways
- When referencing numbers, be specific (e.g. "$142.50" not "around $140")
- If the user has scan results, reference specific stocks from their data
- Give actionable insights — what to watch for, where to set stops, what confirms a breakout
- Use plain language. Avoid jargon unless the user clearly knows it.
- Keep responses under 200 words unless the user asks for a deep dive

## Important Rules
- Always end analysis with a brief risk note (e.g. "Always use a stop-loss and size positions appropriately.")
- Never guarantee returns or say a stock will definitely go up/down
- If you don't have enough data to make a call, say so
- You are not a financial advisor. Remind users this is for educational purposes when appropriate."""


class AIStockRating(BaseModel):
    """AI analysis rating for a stock."""
    symbol: str
    opportunity_score: int  # 0-100 rating
    confidence: int  # 0-100 AI confidence
    analysis: str  # Brief analysis
    key_factors: List[str]  # Key positive/negative factors
    risk_level: str  # "Low", "Medium", "High"
    recommendation: str  # "Strong Buy", "Buy", "Hold", "Avoid"


class AIAnalysisService:
    """Service for AI-powered stock analysis using Claude."""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env")

        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        self.model = settings.CLAUDE_MODEL

    async def analyze_stocks(
        self,
        scan_results: List[ScanResult],
        top_n: int = 10
    ) -> List[AIStockRating]:
        """Analyze scan results and return top N rated opportunities."""
        if not scan_results:
            return []

        ratings = []
        max_stocks = min(len(scan_results), settings.AI_ANALYSIS_MAX_STOCKS)
        for result in scan_results[:max_stocks]:
            try:
                rating = await self._analyze_single_stock(result)
                if rating:
                    ratings.append(rating)
            except Exception as e:
                logger.error(f"Error analyzing {result.symbol}: {e}")
                continue

        ratings.sort(key=lambda x: x.opportunity_score, reverse=True)
        return ratings[:top_n]

    async def _analyze_single_stock(self, result: ScanResult) -> Optional[AIStockRating]:
        """Analyze a single stock using Claude."""
        prompt = self._build_analysis_prompt(result)

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=500,
                system=SEAN_SYSTEM_PROMPT + "\n\nRespond with valid JSON only for this analysis request.",
                messages=[
                    {"role": "user", "content": prompt}
                ],
            )

            content = response.content[0].text
            analysis_data = json.loads(content)

            return AIStockRating(
                symbol=result.symbol,
                opportunity_score=analysis_data.get("opportunity_score", 50),
                confidence=analysis_data.get("confidence", 70),
                analysis=analysis_data.get("analysis", ""),
                key_factors=analysis_data.get("key_factors", []),
                risk_level=analysis_data.get("risk_level", "Medium"),
                recommendation=analysis_data.get("recommendation", "Hold")
            )

        except Exception as e:
            logger.error(f"Claude API error for {result.symbol}: {e}")
            return None

    async def chat(
        self,
        messages: List[Dict[str, str]],
        scan_context: Optional[str] = None
    ) -> str:
        """Handle conversational AI chat about stocks."""
        system = SEAN_SYSTEM_PROMPT

        if scan_context:
            system += f"\n\n## User's Current Data\n{scan_context}"

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system,
                messages=messages,
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Claude chat error: {e}")
            raise

    def _build_analysis_prompt(self, result: ScanResult) -> str:
        """Build analysis prompt from scan result."""
        distance_to_breakout = result.distance_pct
        trend_strength = self._assess_trend(result)
        volume_quality = "High" if result.avg_vol_50 > 1_000_000 else "Medium" if result.avg_vol_50 > 500_000 else "Low"

        prompt = f"""Analyze this breakout setup and respond with JSON only:

**Stock**: {result.symbol}
**Current Price**: ${result.price:.2f}
**Breakout Level**: ${result.trigger_price:.2f}
**Distance to Breakout**: {distance_to_breakout:.2f}%

**Technical Setup**:
- Setup Type: {result.setup_type}
- Breakout Score: {result.breakout_score}/100
- Average Daily Range: {result.adr_pct_14:.2f}%

**Trend Analysis**:
- EMA21: ${result.ema21:.2f}
- EMA50: ${result.ema50:.2f}
- EMA200: ${result.ema200:.2f}
- Trend: {trend_strength}

**Volume & Liquidity**:
- 50-day Avg Volume: {result.avg_vol_50:,.0f}
- Volume Quality: {volume_quality}
{f"- Market Cap: ${result.market_cap/1e9:.2f}B" if result.market_cap else ""}

**Pattern Notes**:
{chr(10).join(f"- {note}" for note in result.notes)}

Respond with this exact JSON format:
{{
  "opportunity_score": <0-100 integer>,
  "confidence": <0-100 integer>,
  "analysis": "<2-3 sentence analysis>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "risk_level": "<Low|Medium|High>",
  "recommendation": "<Strong Buy|Buy|Hold|Avoid>"
}}"""
        return prompt

    def _assess_trend(self, result: ScanResult) -> str:
        """Assess trend strength based on EMA alignment."""
        price = result.price
        ema21 = result.ema21
        ema50 = result.ema50
        ema200 = result.ema200

        if price > ema21 > ema50 > ema200:
            return "Strong Uptrend (All EMAs Aligned)"
        elif price > ema21 > ema50:
            return "Moderate Uptrend"
        elif price > ema21:
            return "Short-term Uptrend"
        elif price < ema21 < ema50 < ema200:
            return "Downtrend"
        else:
            return "Consolidation/Mixed"


# Global instance
_ai_service: Optional[AIAnalysisService] = None


def get_ai_service() -> AIAnalysisService:
    """Get or create AI analysis service singleton."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIAnalysisService()
    return _ai_service
