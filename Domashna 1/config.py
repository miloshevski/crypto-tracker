"""
Configuration file for Crypto Exchange Analyzer
Loads environment variables and defines constants
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# API Configuration
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"
BINANCE_BASE_URL = "https://api.binance.com/api/v3"

# Data Collection Settings
TOP_CRYPTOS_COUNT = 1000  # Fetch top 1000 by market cap, store valid ones (≤ 1000)
FETCH_PAGES = 4  # Fetch exactly 4 pages (250 each = 1000 total)
PER_PAGE = 250  # CoinGecko allows max 250 per page

# Historical Data Settings
YEARS_OF_HISTORY = 10  # Fetch 10 years of historical data
DAYS_OF_HISTORY = YEARS_OF_HISTORY * 365  # ~3650 days

# Performance Settings
MAX_CONCURRENT_REQUESTS = 20  # Number of parallel API requests (increased for threading)
API_RATE_LIMIT_DELAY = 1.2  # Delay between API calls (seconds) - CoinGecko free tier: ~50 calls/min
BINANCE_RATE_LIMIT_DELAY = 0.05  # Binance is more generous (reduced for threading)

# Data Validation Settings
MIN_VOLUME_24H = 1000  # Minimum 24h volume to consider crypto as active (USD)
MIN_MARKET_CAP = 100000  # Minimum market cap (USD)

# Batch Processing
BATCH_SIZE = 100  # Number of records to insert at once
CHECKPOINT_INTERVAL = 100  # Save checkpoint every N symbols

# Exchange Settings
DEFAULT_EXCHANGE = 'binance'
DEFAULT_QUOTE_CURRENCY = 'USD'
BINANCE_QUOTE_CURRENCY = 'USDT'  # Binance uses USDT for most pairs

# Logging
LOG_LEVEL = 'INFO'

# Validate configuration
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env file")

print("✅ Configuration loaded successfully")
print(f"📊 Target: {TOP_CRYPTOS_COUNT} cryptocurrencies")
print(f"📅 Historical data: {YEARS_OF_HISTORY} years")
print(f"🔗 Supabase URL: {SUPABASE_URL}")
