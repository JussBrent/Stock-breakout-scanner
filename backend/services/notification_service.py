"""
Notification dispatch service.
Handles email (Resend), browser push (pywebpush), and SMS (Twilio).
"""
import asyncio
import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_ADDRESS = os.getenv("RESEND_FROM_ADDRESS", "Orbis <alerts@orbis.app>")

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_CLAIMS_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@orbis.app")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")


async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send a transactional email via the Resend API.
    Returns True on success, False on failure.
    Skips silently if RESEND_API_KEY is not configured.
    """
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured — skipping email to %s", to_email)
        return False

    def _send() -> bool:
        import resend
        resend.api_key = RESEND_API_KEY
        resend.Emails.send({
            "from": RESEND_FROM_ADDRESS,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        })
        return True

    try:
        result = await asyncio.to_thread(_send)
        logger.info("Email sent to %s: %s", to_email, subject)
        return result
    except Exception as e:
        logger.error("Email send failed to %s: %s", to_email, e)
        return False


async def send_push(push_subscription: dict, title: str, body: str) -> bool:
    """
    Send a browser web push notification via pywebpush.
    push_subscription must contain 'endpoint' and 'keys' (p256dh, auth).
    Returns True on success, False on failure.
    Skips silently if VAPID keys are not configured.
    """
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured — skipping push notification")
        return False

    def _send() -> bool:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info=push_subscription,
            data=json.dumps({"title": title, "body": body}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIMS_EMAIL},
        )
        return True

    try:
        result = await asyncio.to_thread(_send)
        logger.info("Push notification sent: %s", title)
        return result
    except Exception as e:
        logger.error("Push notification failed: %s", e)
        return False


async def send_sms(phone_number: str, message: str) -> bool:
    """
    Send an SMS via the Twilio API.
    Returns True on success, False on failure.
    Skips silently if Twilio credentials are not configured.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_FROM_NUMBER:
        logger.warning("Twilio not configured — skipping SMS to %s", phone_number)
        return False

    def _send() -> bool:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        client.messages.create(
            to=phone_number,
            from_=TWILIO_FROM_NUMBER,
            body=message,
        )
        return True

    try:
        result = await asyncio.to_thread(_send)
        logger.info("SMS sent to %s", phone_number)
        return result
    except Exception as e:
        logger.error("SMS send failed to %s: %s", phone_number, e)
        return False


async def dispatch_notification(
    *,
    user_id: str,
    email: str,
    subject: str,
    message: str,
    html_body: str,
    preferences: dict,
    plan: str,
    push_subscription: Optional[dict] = None,
) -> None:
    """
    Dispatch notifications to a user across all enabled channels.

    Channels are enabled by user preferences:
      - email_alerts   → send_email()
      - push_alerts    → send_push()  (requires push_subscription to be provided)

    SMS (Twilio) is gated to plan == "pro" and requires a phone_number in preferences.
    """
    if preferences.get("email_alerts"):
        await send_email(email, subject, html_body)

    if preferences.get("push_alerts") and push_subscription:
        await send_push(push_subscription, subject, message)

    if plan == "pro":
        phone = preferences.get("phone_number")
        if phone:
            await send_sms(phone, message)
        else:
            logger.warning(
                "SMS enabled for pro user %s but no phone_number in preferences",
                user_id,
            )
