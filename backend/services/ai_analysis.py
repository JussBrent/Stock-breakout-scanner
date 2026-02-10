"""AI-powered stock analysis using OpenAI."""
import os
import json
import logging
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from models.candle import ScanResult
from pydantic import BaseModel
from config import settings

logger = logging.getLogger(__name__)


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
    """Service for AI-powered stock analysis."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key or self.api_key == "your_openai_api_key_here":
            raise ValueError("OpenAI API key not configured. Please set OPENAI_API_KEY in .env")

        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = settings.OPENAI_MODEL

    async def analyze_stocks(
        self,
        scan_results: List[ScanResult],
        top_n: int = 10
    ) -> List[AIStockRating]:
        """
        Analyze scan results and return top N rated opportunities.

        Args:
            scan_results: List of scan results from the scanner
            top_n: Number of top opportunities to return (default 10)

        Returns:
            List of AIStockRating sorted by opportunity_score (highest first)
        """
        if not scan_results:
            return []

        # Analyze each stock
        ratings = []
        # Limit to configured max to avoid excessive API calls
        max_stocks = min(len(scan_results), settings.AI_ANALYSIS_MAX_STOCKS)
        for result in scan_results[:max_stocks]:
            try:
                rating = await self._analyze_single_stock(result)
                if rating:
                    ratings.append(rating)
            except Exception as e:
                logger.error(f"Error analyzing {result.symbol}: {e}")
                continue

        # Sort by opportunity score (highest first)
        ratings.sort(key=lambda x: x.opportunity_score, reverse=True)

        # Return top N
        return ratings[:top_n]

    async def _analyze_single_stock(self, result: ScanResult) -> Optional[AIStockRating]:
        """Analyze a single stock using OpenAI."""

        # Build analysis prompt
        prompt = self._build_analysis_prompt(result)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert technical analyst specializing in breakout trading patterns.
                        Analyze stocks based on their technical setup and provide ratings from 0-100.
                        Focus on: breakout quality, volume confirmation, trend strength, risk/reward ratio.
                        Be concise and actionable."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=500
            )

            # Parse response
            content = response.choices[0].message.content
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
            logger.error(f"OpenAI API error for {result.symbol}: {e}")
            return None

    def _build_analysis_prompt(self, result: ScanResult) -> str:
        """Build analysis prompt from scan result."""

        # Calculate key metrics
        distance_to_breakout = result.distance_pct
        trend_strength = self._assess_trend(result)
        volume_quality = "High" if result.avg_vol_50 > 1_000_000 else "Medium" if result.avg_vol_50 > 500_000 else "Low"

        prompt = f"""Analyze this breakout setup and provide a JSON response:

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

Provide your analysis in this exact JSON format:
{{
  "opportunity_score": <0-100 integer rating>,
  "confidence": <0-100 integer confidence level>,
  "analysis": "<2-3 sentence analysis>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "risk_level": "<Low|Medium|High>",
  "recommendation": "<Strong Buy|Buy|Hold|Avoid>"
}}

Consider:
1. Quality of the setup pattern
2. Distance to breakout (closer is better, but not too extended)
3. Trend alignment (price above EMAs is bullish)
4. Volume confirmation
5. Risk/reward based on ADR
"""
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
