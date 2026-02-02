"""
Subscription and payment API endpoints.
Handles Stripe integration for premium features.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
import stripe
import os
from datetime import datetime, timezone

from models.user import Subscription
from services.supabase_client import supabase
from middleware.auth import get_current_user
from config import settings

router = APIRouter()

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.get("/", response_model=Subscription)
async def get_subscription(user: dict = Depends(get_current_user)):
    """
    Get user's subscription information.
    Returns free tier if no subscription exists.
    """
    try:
        user_id = user["user_id"]

        query = supabase.table("subscriptions").select()
        query = query.eq("user_id", user_id)

        results = await query.execute()

        if results:
            return results[0]
        else:
            # Return default free subscription
            return Subscription(
                user_id=user_id,
                plan="free",
                status="active",
                created_at=datetime.now(timezone.utc)
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subscription: {str(e)}"
        )


@router.post("/checkout")
async def create_checkout_session(user: dict = Depends(get_current_user)):
    """
    Create a Stripe checkout session for subscription.
    Returns checkout URL for frontend to redirect to.
    """
    try:
        if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PRICE_ID:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Stripe not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID."
            )

        user_id = user["user_id"]
        email = user["email"]

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            customer_email=email,
            line_items=[
                {
                    "price": settings.STRIPE_PRICE_ID,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/subscription/cancel",
            metadata={
                "user_id": user_id
            }
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.post("/portal")
async def create_portal_session(user: dict = Depends(get_current_user)):
    """
    Create Stripe customer portal session.
    Allows users to manage their subscription.
    """
    try:
        if not settings.STRIPE_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Stripe not configured."
            )

        user_id = user["user_id"]

        # Get subscription from database
        query = supabase.table("subscriptions").select()
        query = query.eq("user_id", user_id)
        results = await query.execute()

        if not results or not results[0].get("stripe_customer_id"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )

        customer_id = results[0]["stripe_customer_id"]

        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/settings"
        )

        return {
            "portal_url": portal_session.url
        }

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create portal session: {str(e)}"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    Updates subscription status based on Stripe events.
    """
    try:
        if not settings.STRIPE_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Stripe webhook secret not configured"
            )

        # Get webhook signature
        signature = request.headers.get("stripe-signature")
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )

        # Get raw body
        payload = await request.body()

        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.STRIPE_WEBHOOK_SECRET
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )

        # Handle different event types
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            await handle_checkout_completed(session)

        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            await handle_subscription_updated(subscription)

        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            await handle_subscription_deleted(subscription)

        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook error: {str(e)}"
        )


async def handle_checkout_completed(session: dict):
    """Handle successful checkout."""
    user_id = session["metadata"].get("user_id")
    if not user_id:
        return

    # Create subscription record
    subscription_data = {
        "user_id": user_id,
        "plan": "premium",
        "status": "active",
        "stripe_customer_id": session["customer"],
        "stripe_subscription_id": session["subscription"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Insert or update subscription
    await supabase.table("subscriptions").insert([subscription_data]).execute()


async def handle_subscription_updated(subscription: dict):
    """Handle subscription update."""
    # Update subscription status in database
    # Note: Requires UPDATE implementation
    pass


async def handle_subscription_deleted(subscription: dict):
    """Handle subscription cancellation."""
    # Update subscription status to canceled
    # Note: Requires UPDATE implementation
    pass