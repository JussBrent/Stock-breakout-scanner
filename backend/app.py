from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from config import settings
from api import scan_routes, symbol_routes, results_routes

# Configure logging
logging.basicConfig(level=logging.INFO)
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(scan_routes.router, prefix="/api/scan", tags=["Scan"])
app.include_router(symbol_routes.router, prefix="/api/symbols", tags=["Symbols"])
app.include_router(results_routes.router, prefix="/api/results", tags=["Results"])


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
