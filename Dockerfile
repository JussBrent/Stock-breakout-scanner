# ── Stage 1: Build React frontend ──────────────────────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python backend + bundled frontend ──────────────────────────────
FROM python:3.13-slim
WORKDIR /app/backend

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

# Copy the built React app into the location the backend expects
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Run the FastAPI server
CMD uvicorn app:app --host 0.0.0.0 --port $PORT
