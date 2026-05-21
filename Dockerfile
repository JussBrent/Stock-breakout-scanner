# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python backend + bundled frontend ──────────────────────────────
FROM python:3.13-slim
WORKDIR /app/backend

# Install Python deps (use only binary wheels to avoid compilation OOM)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt || pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy the built React app
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

CMD uvicorn app:app --host 0.0.0.0 --port $PORT
