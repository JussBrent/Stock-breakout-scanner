"""
Pattern Summary Service — Phase 3 Auto-Learning.

Generates AI-written 'what the data says' summaries for each
trading setup type by combining:
  1. Sean's personal verified trades (ground truth)
  2. Community crowdsource aggregate stats (Phase 2 data)

Summaries are stored in the pattern_summaries table and expire
after 24 hours. They are injected into every Sean AI chat as a
pre-computed 'distilled wisdom' layer — separate from raw data.
"""
import os
import time
import logging
from typing import List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Setup types the scanner knows about
KNOWN_SETUPS = [
    "flat_top_breakout",
    "bull_flag",
    "ascending_wedge",
    "high_tight_flag",
    "cup_and_handle",
    "base_breakout",
    "pullback_to_ema",
    "breakout",
    "FLAT_TOP",
    "FLAG",
    "WEDGE",
    "BASE",
    "BREAKOUT",
    "PULLBACK",
]

SUMMARY_SYSTEM_PROMPT = '''You are a quantitative trading analyst summarizing historical
trade data for an AI trading assistant. Your job is to synthesize raw trade statistics
into a clear, actionable narrative paragraph that helps an AI make better recommendations.

Guidelines:
- Be factual and specific. Use exact numbers from the data.
- Highlight what works and what does not for this setup.
- Note any patterns around score ranges (high-score vs low-score differences).
- Keep it under 120 words — dense and useful, not verbose.
- Write in second person: 'This setup shows...' or 'Traders using this setup...'
- Do NOT invent data. Only reference what is given.
'''


async def _fetch_sean_setup_stats(setup_type: str) -> dict:
    """Pull Sean's trades for one setup type and compute win rate, avg gain."""
    try:
        from services.supabase_client import supabase
        rows = await (
            supabase.table('sean_trades')
            .select('outcome,gain_pct,breakout_score,why_took_trade,key_lesson')
            .eq('setup_type', setup_type)
            .neq('outcome', 'open')
            .execute()
        )
        if not rows:
            return {'count': 0}
        wins = [r for r in rows if r.get('outcome') == 'win']
        losses = [r for r in rows if r.get('outcome') == 'loss']
        gains = [r['gain_pct'] for r in rows if r.get('gain_pct') is not None]
        win_gains = [r['gain_pct'] for r in wins if r.get('gain_pct') is not None]
        loss_gains = [r['gain_pct'] for r in losses if r.get('gain_pct') is not None]
        lessons = [r['key_lesson'] for r in rows if r.get('key_lesson')][:3]
        why = [r['why_took_trade'] for r in wins if r.get('why_took_trade')][:2]
        return {
            'count': len(rows),
            'win_rate': round(len(wins) / len(rows) * 100, 1) if rows else 0,
            'avg_gain': round(sum(gains) / len(gains), 2) if gains else None,
            'avg_winner': round(sum(win_gains) / len(win_gains), 2) if win_gains else None,
            'avg_loser': round(sum(loss_gains) / len(loss_gains), 2) if loss_gains else None,
            'lessons': lessons,
            'why_entries': why,
        }
    except Exception as e:
        logger.error(f'Failed to fetch Sean stats for {setup_type}: {e}')
        return {'count': 0}


async def _fetch_community_setup_stats(setup_type: str) -> List[dict]:
    """Pull community crowdsource stats for one setup type from the view."""
    try:
        from services.supabase_client import supabase
        rows = await (
            supabase.table('crowdsource_stats')
            .select('score_range,trade_count,win_rate_pct,avg_gain_pct')
            .eq('setup_type', setup_type)
            .order('trade_count', desc=True)
            .execute()
        )
        return rows or []
    except Exception as e:
        logger.error(f'Failed to fetch community stats for {setup_type}: {e}')
        return []


def _build_summary_prompt(setup_type: str, sean: dict, community: List[dict]) -> Optional[str]:
    """Build the prompt Claude will use to generate the summary."""
    if sean.get('count', 0) == 0 and not community:
        return None  # No data to summarize

    parts = [f"Setup: {setup_type.replace('_', ' ').title()}", ""]

    if sean.get('count', 0) > 0:
        parts.append("Sean's Personal Trades:")
        parts.append(f"  - {sean['count']} closed trades, {sean['win_rate']}% win rate")
        if sean.get('avg_gain') is not None:
            parts.append(f"  - Avg gain: {sean['avg_gain']:+.1f}%")
        if sean.get('avg_winner') is not None:
            parts.append(f"  - Avg winner: {sean['avg_winner']:+.1f}%, Avg loser: {sean.get('avg_loser', 0):+.1f}%")
        if sean.get('lessons'):
            parts.append(f"  - Key lessons: {'; '.join(sean['lessons'][:2])}")
        if sean.get('why_entries'):
            parts.append(f"  - Why Sean enters: {sean['why_entries'][0]}")

    if community:
        parts.append("")
        parts.append("Community Data (opted-in users, anonymized):")
        total_community = sum(r.get('trade_count', 0) for r in community)
        parts.append(f"  - {total_community} total community trades across {len(community)} score bands")
        for r in community[:3]:  # top 3 score bands by trade count
            wr = r.get('win_rate_pct')
            ag = r.get('avg_gain_pct')
            band = r.get('score_range', '?')
            count = r.get('trade_count', 0)
            wr_str = f"{wr:.0f}% win" if wr is not None else "n/a win"
            ag_str = f", avg {ag:+.1f}%" if ag is not None else ""
            parts.append(f"  - Score {band}: {wr_str}{ag_str} ({count} trades)")

    parts.append("")
    parts.append("Write a 2-3 sentence summary (under 120 words) of what this data tells us
about trading this setup. Be specific with numbers. Note any score-range differences if present.")

    return "\n".join(parts)


async def generate_pattern_summary(setup_type: str) -> Optional[str]:
    '''
    Generate an AI summary for one setup type.
    Writes result to pattern_summaries table (upsert).
    Returns the summary text, or None if insufficient data.
    '''
    sean = await _fetch_sean_setup_stats(setup_type)
    community = await _fetch_community_setup_stats(setup_type)

    prompt = _build_summary_prompt(setup_type, sean, community)
    if not prompt:
        logger.info(f'No data to summarize for setup: {setup_type}')
        return None

    # Use Claude to generate the summary
    try:
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError('ANTHROPIC_API_KEY not set')

        import anthropic
        from config import settings
        client = anthropic.AsyncAnthropic(api_key=api_key)

        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=300,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{'role': 'user', 'content': prompt}],
        )
        summary_text = response.content[0].text.strip()
    except Exception as e:
        logger.error(f'Claude summary generation failed for {setup_type}: {e}')
        return None

    # Upsert to pattern_summaries
    try:
        from services.supabase_client import supabase
        total_community = sum(r.get('trade_count', 0) for r in community)
        community_wr = None
        if community:
            total_c = sum(r.get('trade_count', 0) for r in community)
            if total_c > 0:
                weighted_wr = sum(
                    (r.get('win_rate_pct', 0) or 0) * r.get('trade_count', 0)
                    for r in community
                )
                community_wr = round(weighted_wr / total_c, 1)

        await (
            supabase.table('pattern_summaries')
            .upsert([{
                'setup_type': setup_type,
                'score_range': 'all',
                'summary': summary_text,
                'sean_trade_count': sean.get('count', 0),
                'community_trade_count': total_community,
                'sean_win_rate': sean.get('win_rate'),
                'community_win_rate': community_wr,
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'expires_at': (datetime.now(timezone.utc).replace(
                    hour=23, minute=59, second=59, microsecond=0
                )).isoformat(),
            }],
            on_conflict='setup_type,score_range')
            .execute()
        )
        logger.info(f'Pattern summary saved for {setup_type}: {summary_text[:80]}...')
    except Exception as e:
        logger.error(f'Failed to save pattern summary for {setup_type}: {e}')
        # Still return the summary even if save failed

    return summary_text


async def refresh_all_pattern_summaries() -> dict:
    '''
    Regenerate summaries for all known setup types.
    Called by the admin API endpoint or on app startup.
    Returns a dict of setup_type -> summary text (or None if no data).
    '''
    results = {}
    for setup in KNOWN_SETUPS:
        try:
            summary = await generate_pattern_summary(setup)
            results[setup] = summary
        except Exception as e:
            logger.error(f'refresh_all: failed for {setup}: {e}')
            results[setup] = None
    non_null = sum(1 for v in results.values() if v)
    logger.info(f'Pattern summary refresh complete: {non_null}/{len(KNOWN_SETUPS)} generated')
    return results


async def get_fresh_pattern_summaries() -> str:
    '''
    Fetch non-expired pattern summaries from DB.
    Returns a formatted string ready for injection into Sean AI context.
    Returns empty string if no summaries exist yet.
    '''
    try:
        from services.supabase_client import supabase
        now_iso = datetime.now(timezone.utc).isoformat()
        rows = await (
            supabase.table('pattern_summaries')
            .select('setup_type,summary,sean_trade_count,community_trade_count,generated_at')
            .gt('expires_at', now_iso)
            .order('sean_trade_count', desc=True)
            .execute()
        )
        if not rows:
            return ''
        lines = []
        for r in rows:
            setup = r['setup_type'].replace('_', ' ').title()
            sean_n = r.get('sean_trade_count', 0)
            comm_n = r.get('community_trade_count', 0)
            src = []
            if sean_n:
                src.append(f'{sean_n} Sean trades')
            if comm_n:
                src.append(f'{comm_n} community trades')
            src_str = ' + '.join(src) if src else 'limited data'
            lines.append(f'**{setup}** ({src_str}): {r["summary"]}')
        return '\n\n'.join(lines)
    except Exception as e:
        logger.error(f'Failed to fetch pattern summaries: {e}')
        return ''
