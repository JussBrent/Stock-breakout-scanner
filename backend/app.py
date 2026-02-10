from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from config import settings
from api import scan_routes, symbol_routes, results_routes, watchlist_routes, preferences_routes, subscription_routes
from middleware.error_handler import register_error_handlers
from middleware.rate_limit import setup_rate_limiting

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Stock Scanner API...")
    logger.info(f"Polygon API: {'Configured' if settings.POLYGON_API_KEY else 'Missing'}")
    logger.info(f"Supabase: {'Configured' if os.getenv('SUPABASE_URL') else 'Missing'}")

    yield

    # Shutdown
    logger.info("Shutting down Stock Scanner API...")


app = FastAPI(
    title="Stock Scanner API",
    description="Breakout pattern scanner for technical analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Split CORS_ORIGINS by comma for multiple origins
allowed_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "User-Agent"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Register error handlers
register_error_handlers(app)

# Setup rate limiting
setup_rate_limiting(app)

# Include Routers
app.include_router(scan_routes.router, prefix="/api/scan", tags=["Scan"])
app.include_router(symbol_routes.router, prefix="/api/symbols", tags=["Symbols"])
app.include_router(results_routes.router, prefix="/api/results", tags=["Results"])
app.include_router(watchlist_routes.router, prefix="/api/watchlist", tags=["Watchlist"])
app.include_router(preferences_routes.router, prefix="/api/preferences", tags=["Preferences"])
app.include_router(subscription_routes.router, prefix="/api/subscription", tags=["Subscription"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "name": "Stock Scanner API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    polygon_configured = bool(settings.POLYGON_API_KEY)
    supabase_configured = bool(os.getenv('SUPABASE_URL'))

    # Determine overall status
    if polygon_configured and supabase_configured:
        status = "healthy"
    elif polygon_configured or supabase_configured:
        status = "degraded"
    else:
        status = "unhealthy"

    return {
        "status": status,
        "polygon_api": polygon_configured,
        "supabase": supabase_configured
    }
