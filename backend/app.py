"""
FastAPI application for Stock Breakout Scanner
"""
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

from services.supabase_client import get_supabase_client

app = FastAPI(title="Stock Breakout Scanner API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
from api.preset_routes import router as preset_router

app.include_router(preset_router, prefix="/api/presets", tags=["presets"])


@app.get("/")
async def root():
    return {"message": "Stock Breakout Scanner API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
