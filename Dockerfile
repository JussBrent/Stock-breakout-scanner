# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python backend + bundled frontend ──────────────────────────────
FROM python:3.13-slim
WORKDIR /app/backend

# Install build tools
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Install Python deps in smaller groups to avoid OOM
COPY backend/requirements.txt .
RUN pip install --no-cache-dir fastapi uvicorn[standard] pydantic~=2.10.0 email-validator~=2.2.0 pydantic-settings~=2.6.0
RUN pip install --no-cache-dir polygon-api-client==1.12.4 supabase~=2.12.0 anthropic~=0.42.0
RUN pip install --no-cache-dir numpy~=2.0.0 pandas~=2.2.0 httpx~=0.28.0 aiohttp~=3.11.0
RUN pip install --no-cache-dir snaptrade-python-sdk~=11.0.0 pyjwt~=2.8.0 python-multipart==0.0.6 slowapi==0.1.9
RUN pip install --no-cache-dir stripe==7.8.0 resend~=2.0.0 pywebpush~=2.0.0 twilio~=9.0.0
RUN pip install --no-cache-dir redis~=5.2.0 python-dotenv~=1.0.0 youtube-transcript-api~=0.6.0 yfinance>=0.2.0

# Copy backend source
COPY backend/ .

# Copy the built React app into the location the backend expects
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Run the FastAPI server
CMD uvicorn app:app --host 0.0.0.0 --port $PORT
