# Testing the Stock Scanner API

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your POLYGON_API_KEY
   ```

## Starting the API Server

```bash
cd backend
python main.py serve
```

The server will start at `http://localhost:8000`

You should see:
```
Starting Stock Scanner API server...
Server will run at http://0.0.0.0:8000
API docs available at http://0.0.0.0:8000/docs
```

## Testing Methods

### 1. Interactive API Documentation (Easiest)

Open your browser and go to:
```
http://localhost:8000/docs
```

This provides a Swagger UI where you can:
- See all available endpoints
- Test endpoints directly in the browser
- View request/response schemas

### 2. Using curl (Command Line)

**Health Check:**
```bash
curl http://localhost:8000/api/health
```

**Get Symbol Universe:**
```bash
curl http://localhost:8000/api/symbols/universe
```

**Scan Universe with Mock Data:**
```bash
curl -X POST http://localhost:8000/api/scan/universe \
  -H "Content-Type: application/json" \
  -d '{"use_mock": true, "save_to_db": false}'
```

**Scan Specific Symbols:**
```bash
curl -X POST http://localhost:8000/api/scan/universe \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "MSFT", "NVDA"], "save_to_db": false, "use_mock": false}'
```

**Get Recent Results:**
```bash
curl "http://localhost:8000/api/results/?limit=10&min_score=70"
```

**Get Top Results Today:**
```bash
curl http://localhost:8000/api/results/top/today
```

### 3. Using Python requests

```python
import requests

# Health check
response = requests.get("http://localhost:8000/api/health")
print(response.json())

# Scan with mock data
response = requests.post(
    "http://localhost:8000/api/scan/universe",
    json={"use_mock": True, "save_to_db": False}
)
results = response.json()
print(f"Found {results['count']} results")

# Get recent results
response = requests.get("http://localhost:8000/api/results/", params={"limit": 10})
print(response.json())
```

### 4. Using httpie (if installed)

```bash
# Health check
http GET http://localhost:8000/api/health

# Scan universe
http POST http://localhost:8000/api/scan/universe use_mock=true save_to_db=false

# Get results
http GET "http://localhost:8000/api/results/?limit=10"
```

## Running Tests with pytest

```bash
cd backend
pytest tests/ -v
```

Run specific test file:
```bash
pytest tests/test_api.py -v
```

Run with coverage:
```bash
pytest tests/ --cov=. --cov-report=html
```

## Common Issues

### Port Already in Use
If port 8000 is taken, change it in `.env`:
```
API_PORT=8001
```

### Polygon API Rate Limits
Use mock data for testing:
```json
{"use_mock": true, "save_to_db": false}
```

### Import Errors
Make sure you're in the backend directory and all dependencies are installed:
```bash
cd backend
pip install -r requirements.txt
```

## Testing the Full Scan Pipeline

1. **Test with mock data first:**
   ```bash
   curl -X POST http://localhost:8000/api/scan/universe \
     -H "Content-Type: application/json" \
     -d '{"use_mock": true, "save_to_db": false}'
   ```

2. **Test with real Polygon API (requires API key):**
   ```bash
   curl -X POST http://localhost:8000/api/scan/universe \
     -H "Content-Type: application/json" \
     -d '{"symbols": ["AAPL"], "save_to_db": false, "use_mock": false}'
   ```

3. **Test background scan:**
   ```bash
   # Start background scan
   curl -X POST http://localhost:8000/api/scan/universe/background \
     -H "Content-Type: application/json" \
     -d '{"use_mock": true}'

   # Response will include task_id
   # Check status with:
   curl http://localhost:8000/api/scan/status/{task_id}
   ```

## Expected Response Formats

### Successful Scan Response
```json
{
  "success": true,
  "count": 5,
  "results": [
    {
      "symbol": "AAPL",
      "price": 185.50,
      "trigger_price": 190.00,
      "distance_pct": 2.43,
      "adr_pct_14": 3.5,
      "setup_type": "FLAT_TOP",
      "breakout_score": 85,
      "notes": ["tight range", "above ema21"]
    }
  ],
  "filters_applied": {
    "min_price": 5.0,
    "max_price": 1000.0,
    "min_volume": 500000
  }
}
```

### Health Check Response
```json
{
  "status": "healthy",
  "polygon_api": true,
  "supabase": true,
  "version": "1.0.0"
}
```

## Next Steps

Once API testing is successful:
1. Update frontend to use real API endpoints
2. Replace mock data in frontend with API calls
3. Test frontend-backend integration
4. Add authentication if needed
5. Deploy to production
