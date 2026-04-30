import logging
from typing import List
from datetime import datetime
from models.candle import ScanResult
from services.supabase_client import supabase

logger = logging.getLogger(__name__)


async def save_scan_results(results: List[ScanResult]) -> None:
    """Save scan results to Supabase breakout_scans table, then dispatch watchlist alerts."""
    if not results:
        return

    rows = [
        {
            "symbol": r.symbol,
            "price": float(r.price),
            "trigger_price": float(r.trigger_price),
            "distance_pct": float(r.distance_pct),
            "adr_pct_14": float(r.adr_pct_14),
            "avg_vol_50": float(r.avg_vol_50),
            "ema21": float(r.ema21),
            "ema50": float(r.ema50),
            "ema200": float(r.ema200),
            "setup_type": r.setup_type,
            "breakout_score": int(r.breakout_score),
            "notes": r.notes,
            "market_cap": float(r.market_cap) if r.market_cap else None,
            "scanned_at": datetime.utcnow().isoformat(),
        }
        for r in results
    ]

    await supabase.table("breakout_scans").insert(rows).execute()
    logger.info("Saved %d scan results to Supabase", len(results))

    await _notify_watchlist_users(results)


async def _notify_watchlist_users(results: List[ScanResult]) -> None:
    """
    For each scan result, find users who have that symbol on their watchlist
    with alert_enabled=True and score >= their alert_threshold, then dispatch
    notifications through their enabled channels.
    """
    from middleware.auth import get_user_plan
    from services.notification_service import dispatch_notification

    scan_symbols = {r.symbol for r in results}
    scan_by_symbol = {r.symbol: r for r in results}

    # Fetch all alert-enabled watchlist items in one query, then filter
    # by scan symbols in Python (SupabaseTable has no `in` filter method).
    try:
        alert_items = await (
            supabase.table("watchlist_items")
            .select("user_id, symbol")
            .eq("alert_enabled", True)
            .execute()
        )
    except Exception as e:
        logger.error("Failed to fetch alert-enabled watchlist items: %s", e)
        return

    matches = [item for item in alert_items if item["symbol"] in scan_symbols]
    if not matches:
        return

    for item in matches:
        user_id = item["user_id"]
        symbol = item["symbol"]
        scan_result = scan_by_symbol[symbol]

        try:
            # Fetch user email from profiles (PK is `id`, not `user_id`)
            profiles = await (
                supabase.table("profiles")
                .select("email")
                .eq("id", user_id)
                .execute()
            )
            if not profiles:
                logger.warning("No profile found for user %s, skipping alert", user_id)
                continue
            email = profiles[0]["email"]

            # Fetch user preferences
            prefs_rows = await (
                supabase.table("user_preferences")
                .select("email_alerts, push_alerts, alert_threshold, phone_number")
                .eq("user_id", user_id)
                .execute()
            )
            preferences = prefs_rows[0] if prefs_rows else {}

            # Respect the user's score threshold (default 80)
            threshold = preferences.get("alert_threshold", 80)
            if scan_result.breakout_score < threshold:
                continue

            # Skip entirely if no channel is enabled
            if not preferences.get("email_alerts") and not preferences.get("push_alerts"):
                continue

            plan = await get_user_plan(user_id)

            # Fetch push subscription endpoint if push is enabled.
            # Requires a `push_subscriptions` table with columns (user_id, subscription_data).
            push_subscription = None
            if preferences.get("push_alerts"):
                try:
                    push_rows = await (
                        supabase.table("push_subscriptions")
                        .select("subscription_data")
                        .eq("user_id", user_id)
                        .execute()
                    )
                    if push_rows:
                        push_subscription = push_rows[0]["subscription_data"]
                except Exception as e:
                    logger.warning(
                        "Could not fetch push subscription for user %s: %s", user_id, e
                    )

            subject = f"Orbis Alert: {symbol} breakout setup detected"
            message = (
                f"{symbol} matched your alert — "
                f"Score: {scan_result.breakout_score}/100, "
                f"Setup: {scan_result.setup_type}, "
                f"Price: ${scan_result.price:.2f}, "
                f"Trigger: ${scan_result.trigger_price:.2f} "
                f"({scan_result.distance_pct:.1f}% away)"
            )
            html_body = (
                f"<h2>{symbol} Breakout Setup Detected</h2>"
                f"<ul>"
                f"<li><strong>Score:</strong> {scan_result.breakout_score}/100</li>"
                f"<li><strong>Setup:</strong> {scan_result.setup_type}</li>"
                f"<li><strong>Price:</strong> ${scan_result.price:.2f}</li>"
                f"<li><strong>Trigger:</strong> ${scan_result.trigger_price:.2f}</li>"
                f"<li><strong>Distance to breakout:</strong> {scan_result.distance_pct:.1f}%</li>"
                f"</ul>"
            )

            await dispatch_notification(
                user_id=user_id,
                email=email,
                subject=subject,
                message=message,
                html_body=html_body,
                preferences=preferences,
                plan=plan,
                push_subscription=push_subscription,
            )

        except Exception as e:
            logger.error(
                "Notification failed for user %s / symbol %s: %s", user_id, symbol, e
            )
