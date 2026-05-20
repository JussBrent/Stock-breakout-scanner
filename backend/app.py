# Railway redeploy trigger — v2025-05-19
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from contextlib import asynccontextmanager
import logging
import os

from config import settings
from api import scan_routes, symbol_routes, results_routes, watchlist_routes, preferences_routes, subscription_routes, momentum_routes, ai_routes, snaptrade_routes, training_routes, trade_routes, push_routes, admin_routes, options_routes, paper_trading_routes, chart_routes, sean_trades_routes, dashboard_routes
from middleware.error_handler import register_error_handlers
from middleware.rate_limit import setup_rate_limiting

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Stock Scanner API...")
    logger.info(f"Polygon API: {'Configured' if settings.POLYGON_API_KEY else 'Missing'}")
    logger.info(f"Supabase: {'Configured' if os.getenv('SUPABASE_URL') else 'Missing'}")
    logger.info(f"SnapTrade: {'Configured' if settings.SNAPTRADE_CLIENT_ID else 'Missing'}")
    yield
    logger.info("Shutting down Stock Scanner API...")

app = FastAPI(title="Stock Scanner API", description="Breakout pattern scanner with options chain and paper trading", version="2.0.0", lifespan=lifespan)

# CORS — production origins are hardcoded so the app works without env vars on Railway.
_PRODUCTION_ORIGINS = [
    "https://www.orbistrading.io",
    "https://orbistrading.io",
    # Vercel preview deployments
    "https://stock-breakout-scanner-sage.vercel.app",
    "https://stock-breakout-scanner-git-main-bryant-maxs-projects.vercel.app",
]

allowed_origins = list(_PRODUCTION_ORIGINS)

# Settings-based extra origins (comma-separated env var)
for origin in settings.CORS_ORIGINS.split(","):
    o = origin.strip()
    if o and o not in allowed_origins:
        allowed_origins.append(o)

# FRONTEND_URL env var adds extra origins (e.g. preview deployments).
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

if "*" in allowed_origins:
    raise RuntimeError("CORS misconfiguration: wildcard origin '*' is not allowed with allow_credentials=True.")

logger.info("CORS allowed origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "User-Agent"],
    max_age=3600,
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject security headers into every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

register_error_handlers(app)
setup_rate_limiting(app)

app.include_router(scan_routes.router, prefix="/api/scan", tags=["Scan"])
app.include_router(symbol_routes.router, prefix="/api/symbols", tags=["Symbols"])
app.include_router(results_routes.router, prefix="/api/results", tags=["Results"])
app.include_router(watchlist_routes.router, prefix="/api/watchlist", tags=["Watchlist"])
app.include_router(preferences_routes.router, prefix="/api/preferences", tags=["Preferences"])
app.include_router(subscription_routes.router, prefix="/api/subscription", tags=["Subscription"])
app.include_router(momentum_routes.router, prefix="/api/momentum", tags=["Momentum"])
app.include_router(training_routes.router, prefix="/api/ai/training", tags=["AI Training"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI"])
app.include_router(snaptrade_routes.router, prefix="/api/snaptrade", tags=["SnapTrade"])
app.include_router(trade_routes.router, prefix="/api/trades", tags=["Trades"])
app.include_router(sean_trades_routes.router, prefix="/api/sean-trades", tags=["Sean Trades"])
app.include_router(dashboard_routes.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(push_routes.router, prefix="/api/push", tags=["Push"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(options_routes.router, prefix="/api/options", tags=["Options"])
app.include_router(paper_trading_routes.router, prefix="/api/paper", tags=["Paper Trading"])
app.include_router(chart_routes.router, prefix="/api/chart", tags=["Chart"])

@app.get("/", tags=["Root"])
async def root():
    return {"name": "Stock Scanner API", "version": "2.0.0", "status": "operational", "docs": "/docs"}

@app.get("/health", tags=["Health"])
async def health_alias():
    """Alias for /api/health — convenient shortcut."""
    return await health_check()

@app.get("/api/health", tags=["Health"])
async def health_check():
    polygon_configured = bool(settings.POLYGON_API_KEY)
    supabase_configured = bool(os.getenv("SUPABASE_URL"))
    snaptrade_configured = bool(settings.SNAPTRADE_CLIENT_ID)
    status = "healthy" if polygon_configured and supabase_configured else "degraded" if polygon_configured or supabase_configured else "unhealthy"
    return {"status": status, "polygon_api": polygon_configured, "supabase": supabase_configured, "snaptrade": snaptrade_configured}
