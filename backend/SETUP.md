# Backend Setup Guide

This guide walks you through setting up the complete backend with authentication, payments, and user features.

## Prerequisites

- Python 3.9+
- Supabase account
- Stripe account (optional, for payments)

## 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 2. Configure Supabase

### A. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_create_user_tables.sql`
4. Click "Run" to execute the migration

This will create the following tables:
- `watchlists` - User watchlist for tracking stocks
- `user_preferences` - User scanner preferences
- `subscriptions` - User subscription and payment info

### B. Get JWT Secret

1. Go to Supabase Dashboard
2. Navigate to **Settings > API**
3. Copy the **JWT Secret** (NOT the anon key)
4. Add it to your `.env` file:

```bash
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

## 3. Configure Environment Variables

Update your `.env` file with all required values:

```bash
# Polygon API
POLYGON_API_KEY=your_polygon_api_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Stripe (Optional - for payment processing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_price_id

# Environment
ENVIRONMENT=development

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 4. Configure Stripe (Optional)

If you want to enable premium subscriptions:

### A. Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your **Secret Key** from API Keys section
3. Create a **Product** and **Price** in Products section
4. Copy the **Price ID** (starts with `price_`)

### B. Setup Webhook

1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/subscription/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook signing secret**
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## 5. Test the Setup

### Start the server

```bash
python main.py serve
```

### Check health endpoint

```bash
curl http://localhost:8000/api/health
```

### View API documentation

Open your browser to: http://localhost:8000/docs

## 6. API Endpoints

### Public Endpoints (No Authentication)
- `GET /api/scan/universe` - Run universe scan
- `GET /api/results` - Get recent scan results
- `GET /api/health` - Health check

### Protected Endpoints (Requires Authentication)
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/{symbol}` - Remove from watchlist
- `GET /api/preferences` - Get user preferences
- `POST /api/preferences` - Create/update preferences
- `GET /api/subscription` - Get subscription info
- `POST /api/subscription/checkout` - Create checkout session

## 7. Testing Authentication

### Get a token from frontend

1. Login via the frontend app
2. Open browser DevTools > Network
3. Find a request with `Authorization` header
4. Copy the Bearer token

### Use the token in API requests

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8000/api/watchlist
```

## 8. Features Implemented

✅ **JWT Authentication**
- Supabase token verification
- Protected routes middleware
- User context in requests

✅ **Error Handling**
- Global exception handlers
- Consistent error responses
- Validation error formatting

✅ **Rate Limiting**
- IP-based rate limiting
- User-based rate limiting
- Configurable limits per endpoint

✅ **User Watchlists**
- CRUD operations for watchlists
- Per-user isolation via RLS
- Alert configuration

✅ **User Preferences**
- Scanner preferences storage
- Display preferences
- Email notification settings

✅ **Subscription Management**
- Stripe checkout integration
- Webhook handling
- Customer portal access

✅ **Logging**
- Structured logging
- Request/response logging
- Error tracking

## 9. Next Steps

### Frontend Integration

Update your frontend API client to include the auth token:

```typescript
// In your API client
const token = await supabase.auth.getSession()
const response = await fetch('http://localhost:8000/api/watchlist', {
  headers: {
    'Authorization': `Bearer ${token.session.access_token}`
  }
})
```

### Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Update CORS origins in `app.py`
3. Use environment variables for all secrets
4. Enable HTTPS
5. Configure Stripe production keys

## 10. Troubleshooting

### "Invalid token" errors
- Make sure `SUPABASE_JWT_SECRET` is set correctly
- Verify you're using the JWT Secret, not the anon key

### Rate limiting errors
- Check your IP isn't being blocked
- Adjust rate limits in `middleware/rate_limit.py`

### Stripe webhook failures
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Review Stripe webhook logs for details

## 11. Database Schema

### watchlists
- `id` - Primary key
- `user_id` - Foreign key to auth.users
- `symbol` - Stock symbol
- `notes` - User notes
- `alert_enabled` - Alert on/off
- `alert_price` - Alert price level

### user_preferences
- `user_id` - Primary key, foreign key to auth.users
- `min_score` - Minimum breakout score filter
- `max_distance_pct` - Maximum distance to breakout
- `setup_types` - Preferred setup types
- Display and notification preferences

### subscriptions
- `user_id` - Primary key, foreign key to auth.users
- `plan` - Plan tier (free, premium, pro)
- `status` - Subscription status
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- Billing period information