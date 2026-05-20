"""AI-powered stock analysis using Claude (Anthropic)."""
import os
import json
import time
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
- Technical analysis: EMAs (8/21/50), support & resistance, volume analysis
- Breakout patterns: flat-top breakouts, ascending wedges, high-tight flags, cup & handle, base patterns
- Risk management: position sizing, stop-loss placement, risk/reward ratios
- Market context: sector rotation, market conditions, relative strength

## How You Analyze Stocks
When a user asks about a stock or setup:
1. Look at the price relative to key EMAs (8, 21, 50) for trend direction
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

    # Cache training content for 5 minutes to avoid DB hit on every chat
    _training_cache: Optional[str] = None
    _training_cache_time: float = 0
    TRAINING_CACHE_TTL = 300  # seconds

    # Cache Sean's verified personal trades for 10 minutes
    _sean_trades_cache: Optional[str] = None
    _sean_trades_cache_time: float = 0
    SEAN_TRADES_CACHE_TTL = 600  # seconds

    # Cache Phase 2 crowdsource aggregate stats for 15 minutes
    _crowdsource_cache: Optional[str] = None
    _crowdsource_cache_time: float = 0
    CROWDSOURCE_CACHE_TTL = 900  # 15 minutes

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env")

        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        self.model = settings.CLAUDE_MODEL

    async def _get_training_context(self) -> str:
        """Fetch active training content from Supabase, cached for 5 min."""
        now = time.time()
        if self._training_cache is not None and (now - self._training_cache_time) < self.TRAINING_CACHE_TTL:
            return self._training_cache

        try:
            from services.supabase_client import supabase
            rows = await (
                supabase.table("ai_training_content")
                .select("title,content")
                .eq("is_active", "true")
                .order("created_at", desc=False)
                .execute()
            )
            if rows:
                sections = []
                for row in rows:
                    sections.append(f"### {row['title']}\n{row['content']}")
                AIAnalysisService._training_cache = "\n\n".join(sections)
            else:
                AIAnalysisService._training_cache = ""
            AIAnalysisService._training_cache_time = now
        except Exception as e:
            logger.error(f"Failed to fetch training content: {e}")
            AIAnalysisService._training_cache = ""
            AIAnalysisService._training_cache_time = now

        return AIAnalysisService._training_cache

    async def _get_trade_outcomes_context(self, user_id: str) -> str:
        """Fetch recent trade outcomes for AI learning context."""
        try:
            from services.supabase_client import supabase
            rows = await (
                supabase.table("trade_outcomes")
                .select("symbol,setup_type,entry_price,exit_price,gain_pct,outcome,breakout_score")
                .eq("user_id", user_id)
                .order("closed_at", desc=True)
                .limit(20)
                .execute()
            )
            if not rows:
                return ""

            lines = []
            for r in rows:
                outcome_icon = {"win": "WIN", "loss": "LOSS", "breakeven": "BE", "open": "OPEN"}.get(r.get("outcome", ""), "?")
                entry = r.get("entry_price", "?")
                exit_p = r.get("exit_price", "?")
                gain = r.get("gain_pct")
                gain_str = f" ({gain:+.1f}%)" if gain is not None else ""
                score = r.get("breakout_score", "?")
                setup = r.get("setup_type", "?")
                lines.append(f"- {r['symbol']}: {setup} setup, score {score}, entry ${entry} → exit ${exit_p}{gain_str} [{outcome_icon}]")

            return "\n".join(lines)
        except Exception as e:
            logger.error(f"Failed to fetch trade outcomes: {e}")
            return ""

    async def _get_crowdsource_context(self) -> str:
        """Query anonymized crowdsource aggregate stats from the crowdsource_stats view.
        Cached for 15 minutes. Injected into Sean AI after Sean's personal trades.
        Only shows buckets with >= 5 contributing trades (enforced in the DB view).
        Returns empty string if no data yet.
        """
        now = time.time()
        if (
            self._crowdsource_cache is not None
            and (now - self._crowdsource_cache_time) < self.CROWDSOURCE_CACHE_TTL
        ):
            return self._crowdsource_cache

        try:
            from services.supabase_client import supabase
            rows = await (
                supabase.table('crowdsource_stats')
                .select('setup_type,score_range,trade_count,win_rate_pct,avg_gain_pct,avg_winner_pct,avg_loser_pct')
                .order('trade_count', desc=True)
                .limit(50)
                .execute()
            )

            if not rows:
                AIAnalysisService._crowdsource_cache = ''
                AIAnalysisService._crowdsource_cache_time = now
                return ''

            lines = []
            for r in rows:
                setup = r.get('setup_type', '?')
                band = r.get('score_range', '?')
                count = r.get('trade_count', 0)
                win_rate = r.get('win_rate_pct')
                avg_gain = r.get('avg_gain_pct')
                avg_win = r.get('avg_winner_pct')
                avg_loss = r.get('avg_loser_pct')
                win_str = f'{win_rate:.1f}% win rate' if win_rate is not None else 'n/a win rate'
                gain_str = f', avg gain {avg_gain:+.1f}%' if avg_gain is not None else ''
                win_detail = f' (avg winner {avg_win:+.1f}%' if avg_win is not None else ''
                loss_detail = f', avg loser {avg_loss:+.1f}%)' if avg_loss is not None else (')' if win_detail else '')
                lines.append(
                    f'- {setup} score {band}: {win_str}{gain_str}{win_detail}{loss_detail}'
                    f' — {count} user trades'
                )

            result = '
'.join(lines)
            AIAnalysisService._crowdsource_cache = result
            AIAnalysisService._crowdsource_cache_time = now
            return result

        except Exception as e:
            logger.error(f'Failed to fetch crowdsource stats: {e}')
            AIAnalysisService._crowdsource_cache = ''
            AIAnalysisService._crowdsource_cache_time = now
            return ''

    async def _get_sean_trades_context(self) -> str:
        """Fetch Sean's verified personal trades from DB, cached for 10 min.
        Injected as ground-truth examples into every chat."""
        now = time.time()
        if (
            self._sean_trades_cache is not None
            and (now - self._sean_trades_cache_time) < self.SEAN_TRADES_CACHE_TTL
        ):
            return self._sean_trades_cache

        try:
            from services.supabase_client import supabase
            rows = await (
                supabase.table("sean_trades")
                .select(
                    "symbol,direction,setup_type,breakout_score,"
                    "entry_price,exit_price,stop_price,gain_pct,outcome,"
                    "contract_type,strike_price,expiration_date,"
                    "contracts_held,premium_paid,premium_exit,"
                    "why_took_trade,looked_wrong_but,looked_right_but,key_lesson"
                )
                .order("traded_at", desc=True)
                .limit(60)
                .execute()
            )

            if not rows:
                AIAnalysisService._sean_trades_cache = ""
                AIAnalysisService._sean_trades_cache_time = now
                return ""

            wins   = [t for t in rows if t.get("outcome") == "win"]
            losses = [t for t in rows if t.get("outcome") == "loss"]
            open_t = [t for t in rows if t.get("outcome") == "open"]
            other  = [t for t in rows if t.get("outcome") not in ("win", "loss", "open")]

            def _fmt_sean_trade(t: dict) -> str:
                icons     = {"win": "WIN", "loss": "LOSS", "breakeven": "BE", "open": "OPEN"}
                icon      = icons.get(t.get("outcome", ""), "?")
                sym       = t.get("symbol", "?")
                setup     = t.get("setup_type") or "N/A"
                score     = t.get("breakout_score")
                score_str = f"score {score}" if score is not None else "no score"
                direction = t.get("direction", "long").upper()
                entry     = t.get("entry_price", "?")
                exit_p    = t.get("exit_price")
                gain      = t.get("gain_pct")
                opt_parts = []
                if t.get("contract_type"):
                    ct      = t.get("contract_type", "?").upper()
                    strike  = t.get("strike_price", "?")
                    exp     = t.get("expiration_date", "?")
                    premium = t.get("premium_paid", "?")
                    p_exit  = t.get("premium_exit")
                    opt_parts.append(f" | {ct} strike={strike} exp={exp} premium_in={premium}")
                    if p_exit:
                        opt_parts.append(f" premium_out={p_exit}")
                opt_str  = "".join(opt_parts)
                gain_str = f" ({gain:+.1f}%)" if gain is not None else ""
                exit_str = f" -> {exit_p}" if exit_p else ""
                line = (
                    f"- {sym} [{direction}] {setup} ({score_str})"
                    f" entry={entry}{exit_str}{gain_str}{opt_str} [{icon}]"
                )
                lessons = []
                if t.get("why_took_trade"):
                    lessons.append(f"  Took because: {t['why_took_trade']}")
                if t.get("looked_wrong_but"):
                    lessons.append(f"  Looked wrong but worked: {t['looked_wrong_but']}")
                if t.get("looked_right_but"):
                    lessons.append(f"  Looked right but failed: {t['looked_right_but']}")
                if t.get("key_lesson"):
                    lessons.append(f"  Key lesson: {t['key_lesson']}")
                return line + ("\n" + "\n".join(lessons) if lessons else "")

            sections = []
            if wins:
                sections.append("### Sean's Winning Trades (study these setups)\n"
                                 + "\n".join(_fmt_sean_trade(t) for t in wins))
            if losses:
                sections.append("### Sean's Losing Trades (understand what to avoid)\n"
                                 + "\n".join(_fmt_sean_trade(t) for t in losses))
            if other:
                sections.append("### Sean's Breakeven / Scratch Trades\n"
                                 + "\n".join(_fmt_sean_trade(t) for t in other))
            if open_t:
                sections.append("### Sean's Currently Open Positions\n"
                                 + "\n".join(_fmt_sean_trade(t) for t in open_t))

            result = "\n\n".join(sections)
            AIAnalysisService._sean_trades_cache = result
            AIAnalysisService._sean_trades_cache_time = now
            return result

        except Exception as e:
            logger.error(f"Failed to fetch Sean's trades: {e}")
            AIAnalysisService._sean_trades_cache = ""
            AIAnalysisService._sean_trades_cache_time = now
            return ""

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
        scan_context: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> str:
        """Handle conversational AI chat about stocks."""
        system = SEAN_SYSTEM_PROMPT

        # Inject training content (trader's knowledge base)
        training_context = await self._get_training_context()
        if training_context:
            system += f"\n\n## Trader's Knowledge Base\nThe following is knowledge from the trader's own teachings, video transcripts, and strategies. Use this as your primary reference when answering questions about setups, strategies, and trading approaches.\n\n{training_context}"

        # Inject Sean's verified personal trades as highest-weight training signal
        sean_trades_context = await self._get_sean_trades_context()
        if sean_trades_context:
            system += (
                "\n\n## Sean's Personal Verified Trades (ground-truth training data)\n"
                "These are real trades Sean personally took. Use wins to recognise high-quality "
                "setups and losses to understand what to avoid. Options strike/premium data shows "
                "exactly how he sized each play — factor this into your contract recommendations.\n\n"
                + sean_trades_context
            )

        # Inject Phase 2 crowdsource aggregate stats (anonymized, >= 5 trades per bucket)
        crowdsource_context = await self._get_crowdsource_context()
        if crowdsource_context:
            system += (
                "\n\n## Community Crowdsource Data (anonymized aggregate stats)\n"
                "These statistics come from opted-in user trades. Use them to calibrate "
                "confidence: if the community win rate for a setup is high, be more "
                "confident; if it's low, add appropriate caution. Do NOT attribute stats "
                "to specific users — these are fully anonymized.\n\n"
                + crowdsource_context
            )

        # Inject this user's own trade outcome history for personalised calibration
        if user_id:
            trade_context = await self._get_trade_outcomes_context(user_id)
            if trade_context:
                system += (
                    "\n\n## This User's Recent Trade History\n"
                    "Use this to personalise your confidence. Setups winning for this user "
                    "deserve more confidence; setups that have been losing should get more "
                    "cautious language.\n\n"
                    + trade_context
                )

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

    async def analyze_content(self, text_content: str = None, image_base64: str = None, media_type: str = "image/png") -> str:
        """
        Analyze chart image or news text using Sean.
        Returns markdown analysis string.
        """
        training_context = await self._get_training_context()
        system = SEAN_SYSTEM_PROMPT
        if training_context:
            system += f"\n\n## Trader's Knowledge Base\n{training_context}"

        user_content = []

        if image_base64:
            user_content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": image_base64,
                },
            })
            user_content.append({
                "type": "text",
                "text": (
                    "First, determine if this is a valid stock/crypto price chart. "
                    "If it is NOT a valid price chart (e.g. it's a photo, document, meme, random image), "
                    "respond ONLY with: 'ERROR: Not a valid stock chart. Please upload a screenshot of a price chart.'\n\n"
                    "If it IS a valid chart, analyze it and provide:\n"
                    "**Ticker**: [symbol if visible, else 'Unknown']\n"
                    "**Trend**: [uptrend/downtrend/sideways]\n"
                    "**Setup**: [flat top/wedge/flag/base/breakout/none identified]\n"
                    "**Key Levels**:\n"
                    "- Resistance: $[level]\n"
                    "- Support: $[level]\n"
                    "**Trade Setup**:\n"
                    "- Entry: $[price or 'above $X on breakout']\n"
                    "- Stop Loss: $[today's low of day — the lowest price visible today on the chart]\n"
                    "- Target: $[level]\n"
                    "**Volume**: [confirming/weak/not visible]\n"
                    "**Bull Case**: [1-2 sentences on why this could be a winner]\n"
                    "**Assessment**: [1-2 sentences overall read]\n"
                    "Be specific with exact prices where visible on the chart."
                ),
            })
        elif text_content:
            user_content.append({
                "type": "text",
                "text": (
                    "Analyze the following news or market content for trading opportunities.\n\n"
                    "For each stock or ticker you identify, provide a structured breakdown:\n"
                    "**[TICKER]** — [Company Name]\n"
                    "- Sentiment: Bullish / Bearish / Neutral\n"
                    "- Catalyst: [what the news says is driving the move]\n"
                    "- Trade Idea: [entry area, stop = low of day, target]\n"
                    "- Bull Case: [why this could be a winner based on the news]\n"
                    "- Risk: [key risk factors]\n\n"
                    "If no clear stocks are identified, say so.\n\n"
                    f"CONTENT:\n{text_content[:4000]}"
                ),
            })
        else:
            raise ValueError("Provide either text_content or image_base64")

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        return response.content[0].text

    async def analyze_symbol_technicals(self, technicals: dict) -> dict:
        """
        AI analysis for any symbol given raw technical data.
        Works whether or not the symbol passes breakout filters.
        """
        sym = technicals["symbol"]
        price = technicals["price"]
        ema21 = technicals.get("ema21")
        ema50 = technicals.get("ema50")
        ema8 = technicals.get("ema8")
        adr = technicals.get("adr_pct_14", 0)
        avg_vol = technicals.get("avg_vol_50", 0)
        market_cap = technicals.get("market_cap")
        trend = technicals.get("trend", "Unknown")
        scan_result = technicals.get("scan_result")

        ema_lines = []
        if ema21:
            rel = "above" if price > ema21 else "below"
            ema_lines.append(f"- EMA21: ${ema21:.2f} (price is {rel})")
        if ema50:
            rel = "above" if price > ema50 else "below"
            ema_lines.append(f"- EMA50: ${ema50:.2f} (price is {rel})")
        if ema8:
            rel = "above" if price > ema8 else "below"
            ema_lines.append(f"- EMA8: ${ema8:.2f} (price is {rel})")

        breakout_section = ""
        if scan_result:
            breakout_section = f"""
**Breakout Setup Detected**:
- Setup Type: {scan_result.setup_type}
- Breakout Level: ${scan_result.trigger_price:.2f}
- Distance to Breakout: {scan_result.distance_pct:.2f}%
- Breakout Score: {scan_result.breakout_score}/100
- Pattern Notes: {'; '.join(scan_result.notes)}
"""
        else:
            breakout_section = "\n**Breakout Filter**: Did not meet strict breakout criteria (may be in downtrend, low volume, or no clear setup). Provide honest technical assessment.\n"

        vol_quality = "High" if avg_vol > 1_000_000 else "Medium" if avg_vol > 300_000 else "Low"
        cap_str = f"${market_cap/1e9:.2f}B" if market_cap else "Unknown"

        prompt = f"""Analyze {sym} and provide a technical analysis. Respond with JSON only.

**Symbol**: {sym}
**Current Price**: ${price:.2f}
**Trend**: {trend}

**EMA Analysis**:
{chr(10).join(ema_lines) if ema_lines else "- Insufficient history for EMAs"}

**Volatility & Volume**:
- ADR (14-day): {adr:.2f}%
- 50-day Avg Volume: {avg_vol:,.0f} ({vol_quality})
- Market Cap: {cap_str}
{breakout_section}
Respond with this exact JSON:
{{
  "opportunity_score": <0-100 integer — 0 if downtrend/avoid, 80-100 if strong setup>,
  "confidence": <0-100 integer>,
  "analysis": "<3-4 sentence technical analysis>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "risk_level": "<Low|Medium|High>",
  "recommendation": "<Strong Buy|Buy|Watch|Hold|Avoid>",
  "direction": "<Long|Short>",
  "suggested_entry": <exact price number for entry>,
  "suggested_stop": <exact price number for stop loss>,
  "suggested_target": <exact price number for take profit>,
  "suggested_dte": <integer days-to-expiry for the options play — e.g. 7 for very short-term, 14-21 for momentum, 30-45 for medium setups, 60+ for longer-term. Vary this based on the specific setup timeframe. Use null for stock-only plays>,
  "entry_notes": "<1 sentence on entry — where to buy or what to wait for>",
  "stop_notes": "<1 sentence on stop loss — MUST be today's low of day price>",
"bull_case": "<2-3 sentence fundamental bull case: why this could be a winner. Include business strengths, growth catalysts, sector tailwinds>",
"fundamental_snapshot": ["<key fundamental point 1>", "<key fundamental point 2>", "<key fundamental point 3>"]
}}"""

        try:
            training_context = await self._get_training_context()
            system = SEAN_SYSTEM_PROMPT
            if training_context:
                system += f"\n\n## Trader's Knowledge Base\n{training_context}"

            response = await self.client.messages.create(
                model=self.model,
                max_tokens=800,
                system=system + "\n\nRespond with valid JSON only. Do not use markdown code fences.",
                messages=[{"role": "user", "content": prompt}],
            )
            content = response.content[0].text.strip()
            # Strip markdown code fences if Claude wraps the JSON
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            logger.debug(f"Claude raw response for {sym}: {content[:200]}")
            data = json.loads(content)
            return {
                "symbol": sym,
                "price": price,
                "ema21": ema21,
                "ema50": ema50,
                "ema8": ema8,
                "adr_pct_14": adr,
                "avg_vol_50": avg_vol,
                "market_cap": market_cap,
                "trend": trend,
                "passes_breakout_filter": scan_result is not None,
                "setup_type": scan_result.setup_type if scan_result else None,
                "trigger_price": scan_result.trigger_price if scan_result else None,
                "distance_pct": scan_result.distance_pct if scan_result else None,
                "breakout_score": scan_result.breakout_score if scan_result else None,
                "opportunity_score": data.get("opportunity_score", 50),
                "confidence": data.get("confidence", 60),
                "analysis": data.get("analysis", ""),
                "key_factors": data.get("key_factors", []),
                "risk_level": data.get("risk_level", "Medium"),
                "recommendation": data.get("recommendation", "Hold"),
                "direction": data.get("direction"),
                "suggested_entry": data.get("suggested_entry"),
                "suggested_stop": data.get("suggested_stop"),
                "suggested_target": data.get("suggested_target"),
                "suggested_dte": data.get("suggested_dte"),
                "suggested_expiry": None,  # resolved from live options chain in scan_routes
                "entry_notes": data.get("entry_notes", ""),
                "stop_notes": data.get("stop_notes", ""),
                "bull_case": data.get("bull_case", ""),
                "fundamental_snapshot": data.get("fundamental_snapshot", []),
            }
        except Exception as e:
            logger.error(f"AI analysis failed for {sym}: {e}")
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
- EMA8: ${result.ema8:.2f if result.ema8 else "N/A"}
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

        if ema200 and price > ema21 > ema50 > ema200:
            return "Strong Uptrend (All EMAs Aligned)"
        elif price > ema21 > ema50:
            return "Moderate Uptrend"
        elif price > ema21:
            return "Short-term Uptrend"
        elif price < ema21 < ema50 < ema200:
            return "Downtrend"
        else:
            return "Consolidation/Mixed"


# Global instance — singleton (re-deploy trigger)
_ai_service: Optional[AIAnalysisService] = None


def get_ai_service() -> AIAnalysisService:
    """Get or create AI analysis service singleton."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIAnalysisService()
    return _ai_service
