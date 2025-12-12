# Crypto Technical Analysis API

FastAPI-based backend service for calculating technical indicators and generating trading signals for cryptocurrencies.

## Features

- **10 Technical Indicators**:
  - **Oscillators**: RSI, MACD, Stochastic, ADX, CCI
  - **Moving Averages**: SMA, EMA, WMA, Bollinger Bands, Volume MA
- **3 Timeframes**: 1 day (1d), 1 week (1w), 1 month (1m)
- **Signal Generation**: Buy/Sell/Hold recommendations
- **Overall Signal**: Combined signal from all indicators

## Installation

### 1. Activate Virtual Environment

Windows:
```bash
venv\Scripts\activate
```

Mac/Linux:
```bash
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### POST /api/technical-analysis

Calculate technical indicators and generate signals.

**Request Body:**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "open": 42000,
      "high": 43000,
      "low": 41000,
      "close": 42500,
      "volume": 1000000
    }
    // ... more data points (minimum 50)
  ],
  "timeframe": "1w"
}
```

**Response:**
```json
{
  "overall": {
    "signal": "BUY",
    "score": 4,
    "buyCount": 6,
    "sellCount": 2,
    "holdCount": 2,
    "totalIndicators": 10
  },
  "oscillators": [
    {
      "name": "RSI (14)",
      "value": 32.5,
      "signal": "BUY",
      "reason": "Oversold (RSI < 30)",
      "strength": 1
    }
    // ... 4 more oscillators
  ],
  "movingAverages": [
    {
      "name": "SMA (20/50)",
      "value": 41800,
      "signal": "BUY",
      "reason": "Golden Cross (SMA20>SMA50, Price>SMA20)",
      "strength": 1
    }
    // ... 4 more moving averages
  ],
  "timeframe": "1w",
  "dataPoints": 90
}
```

## Project Structure

```
technical-analysis-api/
├── app/
│   ├── __init__.py
│   ├── models.py           # Pydantic models
│   ├── indicators.py       # Technical indicator calculations
│   ├── signals.py          # Signal generation logic
│   └── routes/
│       ├── __init__.py
│       └── technical_analysis.py  # API endpoints
├── tests/                  # Unit tests
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Signal Logic

### Oscillators

| Indicator | Buy Signal | Sell Signal | Hold Signal |
|-----------|------------|-------------|-------------|
| RSI (14) | < 30 | > 70 | 30-70 |
| MACD | Bullish crossover | Bearish crossover | No crossover |
| Stochastic | < 20 | > 80 | 20-80 |
| ADX (14) | >25 & +DI>-DI | >25 & -DI>+DI | <25 |
| CCI (20) | < -100 | > 100 | -100 to 100 |

### Moving Averages

| Indicator | Buy Signal | Sell Signal | Hold Signal |
|-----------|------------|-------------|-------------|
| SMA (20/50) | Golden cross | Death cross | Mixed |
| EMA (12/26) | EMA12 > EMA26 | EMA12 < EMA26 | Otherwise |
| WMA (20) | Price > WMA | Price < WMA | Otherwise |
| Bollinger | Price < lower | Price > upper | Within bands |
| Volume MA | Vol>1.5×VMA & ↑ | Vol>1.5×VMA & ↓ | Normal vol |

### Overall Signal

Score = Sum of all indicator strengths (Buy: +1, Sell: -1, Hold: 0)

- **STRONG_BUY**: Score > 3
- **BUY**: Score 1-3
- **HOLD**: Score -1 to 1
- **SELL**: Score -3 to -1
- **STRONG_SELL**: Score < -3

## Integration with Next.js Frontend

The API is configured with CORS to allow requests from:
- `http://localhost:3000` (Next.js development)
- `https://*.vercel.app` (Vercel deployments)

Example fetch from Next.js:
```javascript
const response = await fetch('http://localhost:8000/api/technical-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: ohlcvData,
    timeframe: '1w'
  })
});
const analysis = await response.json();
```

## Testing

Run tests:
```bash
pytest tests/
```

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **pandas**: Data manipulation and analysis
- **ta**: Technical analysis library
- **uvicorn**: ASGI server for running FastAPI
- **pydantic**: Data validation using Python type hints

## License

MIT
