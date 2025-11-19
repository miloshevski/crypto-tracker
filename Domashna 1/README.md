# Crypto Exchange Analyzer - Homework 1

**Software Design and Architecture - FINKI UKIM**
**Architecture Pattern:** Pipe and Filter
**Academic Year:** 2024/2025

---

## 📋 Project Overview

This project implements a **Pipe and Filter architecture** to analyze cryptocurrency data from international exchanges. It automatically downloads and processes historical data for the top 1000 active cryptocurrencies, storing it in a PostgreSQL database (Supabase).

### Key Features
- ✅ Fetches top 1000 cryptocurrencies ranked by market cap
- ✅ Downloads 10 years of historical OHLCV data
- ✅ Filters out invalid/delisted cryptocurrencies automatically
- ✅ Incremental updates (only fetches missing data)
- ✅ Performance optimization with batching and parallel processing
- ✅ Complete logging and error handling
- ✅ Performance timer for bonus challenge

---

## 🏗️ Architecture

### Pipe and Filter Pattern

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌──────────┐
│   FILTER 1      │─────▶│   FILTER 2      │─────▶│   FILTER 3      │─────▶│ DATABASE │
│  Get Symbols    │      │  Check Dates    │      │  Fill Data      │      │ Supabase │
│  (CoinGecko)    │      │  (Supabase)     │      │  (Binance)      │      │          │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └──────────┘
```

### Filter 1: Get Top 1000 Crypto Symbols
- **Input:** None (initiates pipeline)
- **Process:**
  - Fetches 5 pages from CoinGecko API (1250 cryptos)
  - Filters out invalid cryptocurrencies:
    - Delisted coins
    - Low liquidity (< $1,000 24h volume)
    - Low market cap (< $100,000)
    - Missing data
  - Removes duplicates
  - Sorts by market cap rank
- **Output:** List of 1000 valid cryptocurrency symbols with metadata

### Filter 2: Check Last Available Date
- **Input:** List of symbols from Filter 1
- **Process:**
  - Queries Supabase database for each symbol
  - Checks last date with available data
  - Calculates missing date range:
    - **Full history:** No data exists → fetch 10 years
    - **Incremental:** Data exists → fetch only missing days
  - Updates crypto_metadata table
- **Output:** Symbols with date range information

### Filter 3: Fill Missing Data
- **Input:** Symbols with date ranges from Filter 2
- **Process:**
  - Fetches OHLCV data from Binance via CCXT library
  - Transforms data to database schema
  - Batch inserts to Supabase (100 records per batch)
  - Updates sync status in metadata table
  - Handles errors and retries
- **Output:** Fully populated database

---

## 🛠️ Technology Stack

### Backend (Data Pipeline)
- **Language:** Python 3.13
- **Libraries:**
  - `requests` - HTTP requests
  - `supabase` - Database client
  - `ccxt` - Crypto exchange API wrapper
  - `python-dotenv` - Environment variables
  - `tqdm` - Progress bars
  - `python-dateutil` - Date handling

### Database
- **Provider:** Supabase (PostgreSQL)
- **Tables:**
  - `crypto_data` - OHLCV data and market metrics
  - `crypto_metadata` - Symbol information and sync status
  - `pipeline_logs` - Execution logs and performance metrics

### Data Sources
- **CoinGecko API** - Top 1000 symbols by market cap (Free tier)
- **Binance API** - Historical OHLCV data (via CCXT, Free, No auth)

---

## 📁 Project Structure

```
Domashna 1/
├── config.py                    # Configuration and constants
├── filter1_get_symbols.py       # Filter 1: Get top 1000 symbols
├── filter2_check_last_date.py   # Filter 2: Check database for last dates
├── filter3_fill_data.py         # Filter 3: Fetch and insert OHLCV data
├── pipeline.py                  # Main orchestrator (runs all filters)
├── schema.sql                   # Database schema
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (Supabase credentials)
├── README.md                    # This file
└── (output files generated during execution)
    ├── filter1_output.json      # Filter 1 results
    ├── filter2_output.json      # Filter 2 results
    ├── filter3_stats.json       # Filter 3 statistics
    └── pipeline_results.json    # Final pipeline results
```

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.13+ installed
- Supabase account (free tier is fine)
- Git

### 2. Database Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database provisioning

#### Run Schema
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `schema.sql`
3. Paste and click **Run**
4. Verify tables are created (should see 5 tables)

#### Get Credentials
1. Go to Project Settings → API
2. Copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_KEY)
3. Add to `.env` file (already done in this project)

### 3. Install Python Dependencies

```bash
cd "Domashna 1"
pip install -r requirements.txt
```

**Dependencies:**
- requests
- supabase
- ccxt
- python-dotenv
- tqdm
- python-dateutil

### 4. Verify Configuration

Check that `.env` file has your Supabase credentials:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ▶️ Running the Pipeline

### Full Pipeline (All 3 Filters)

```bash
python pipeline.py
```

This will:
1. Fetch top 1000 cryptocurrencies from CoinGecko
2. Check database for existing data
3. Download missing historical data from Binance
4. Log execution time and statistics

**Estimated Time:**
- First run (empty database): 15-30 minutes
- Incremental updates: 1-5 minutes

### Individual Filters (For Testing)

**Filter 1 only:**
```bash
python filter1_get_symbols.py
```
Output: `filter1_output.json`

**Filter 2 only:**
```bash
python filter2_check_last_date.py
```
Requires: `filter1_output.json`
Output: `filter2_output.json`

**Filter 3 only:**
```bash
python filter3_fill_data.py
```
Requires: `filter2_output.json`
Output: `filter3_stats.json`

---

## 📊 Data Schema

### crypto_data Table
Stores daily OHLCV data:
- `symbol` - Crypto symbol (BTC, ETH, etc.)
- `name` - Full name
- `date` - Trading date
- `open`, `high`, `low`, `close` - OHLCV prices
- `volume` - Trading volume
- `market_cap`, `liquidity`, `rank` - Market metrics
- `exchange`, `quote_currency` - Source info

### crypto_metadata Table
Tracks sync status:
- `symbol` - Crypto symbol
- `last_sync_date` - Last date synced
- `first_available_date` - Oldest data date
- `total_records` - Number of records
- `coingecko_id`, `binance_symbol` - API identifiers

### pipeline_logs Table
Execution logs:
- `run_id` - Unique execution ID
- `filter_name` - Which filter ran
- `status` - success/failed
- `duration_seconds` - Execution time
- `records_inserted` - Data inserted

---

## 🎯 Performance Optimization

### Implemented Optimizations:

1. **Parallel Processing**
   - CCXT built-in rate limiting
   - Concurrent API calls where possible

2. **Batch Database Inserts**
   - Insert 100 records at once (not one-by-one)
   - Reduces database round trips

3. **Incremental Updates**
   - Only fetch missing data, not full history every time
   - Filter 2 checks database first

4. **Rate Limit Handling**
   - Respects CoinGecko limit (~50 calls/min)
   - Binance is generous (1200 calls/min)
   - Automatic retries on failures

5. **Data Validation**
   - Filter invalid data before database insertion
   - Prevents wasted database operations

### Bonus Challenge Results:

The pipeline includes a performance timer that measures:
- Time per filter
- Total execution time
- Records inserted per second
- Average time per cryptocurrency

Results are logged to `pipeline_logs` table and `pipeline_results.json`.

---

## 🔧 Configuration Options

Edit `config.py` to customize:

```python
TOP_CRYPTOS_COUNT = 1000           # Number of cryptos to track
YEARS_OF_HISTORY = 10              # Years of historical data
MAX_CONCURRENT_REQUESTS = 10       # Parallel requests
BATCH_SIZE = 100                   # Records per batch insert
MIN_VOLUME_24H = 1000              # Minimum 24h volume filter
```

---

## 🐛 Troubleshooting

### "No module named 'requests'"
```bash
pip install -r requirements.txt
```

### "Missing Supabase credentials"
Check that `.env` file exists and has valid credentials.

### "Symbol not found on Binance"
Some cryptocurrencies aren't on Binance. Filter 3 will skip them and log the error.

### "Rate limit exceeded"
Increase `API_RATE_LIMIT_DELAY` in `config.py`.

### Database connection timeout
Check Supabase project is running and credentials are correct.

---

## 📈 Expected Results

After running the pipeline:

### Database
- **crypto_data:** ~3,650,000 records (1000 cryptos × 10 years × 365 days)
- **crypto_metadata:** 1000 records (one per crypto)
- **pipeline_logs:** Execution logs

### Console Output
- Filter 1: ~1000 valid symbols
- Filter 2: Date ranges for each symbol
- Filter 3: Insertion progress with tqdm bar
- Final summary with timing

### Output Files
- `filter1_output.json` - Symbol list
- `filter2_output.json` - Symbols with dates
- `filter3_stats.json` - Insertion statistics
- `pipeline_results.json` - Complete results

---

## 📝 Homework Requirements Checklist

### ✅ Completed Requirements:

1. **Pipe and Filter Architecture**
   - ✅ 3 independent filters implemented
   - ✅ Each filter has single responsibility
   - ✅ Output of one filter = Input of next filter
   - ✅ Filters can be tested independently

2. **Filter 1: Get Top 1000 Symbols**
   - ✅ Automatically downloads symbol list
   - ✅ Filters out invalid cryptocurrencies:
     - ✅ Delisted coins
     - ✅ Low liquidity
     - ✅ Duplicates
     - ✅ Unstable quote currencies

3. **Filter 2: Check Last Date**
   - ✅ Queries database for each symbol
   - ✅ Determines if data exists
   - ✅ Calculates missing date range
   - ✅ Handles both full and incremental updates

4. **Filter 3: Fill Missing Data**
   - ✅ Downloads OHLCV data for each symbol
   - ✅ Uses last date from Filter 2
   - ✅ Fetches 10 years for new symbols
   - ✅ Fetches only missing days for existing symbols
   - ✅ Properly formatted data
   - ✅ Combines with existing data (upsert)

5. **Bonus: Performance Timer**
   - ✅ Measures total execution time
   - ✅ Logs to database
   - ✅ Detailed breakdown per filter

---

## 👥 Team Information

*(Fill in your team details here)*

- **Team Member 1:** [Name] - [Index]
- **Team Member 2:** [Name] - [Index]
- **Team Member 3:** [Name] - [Index]

---

## 📚 Documentation

### API Documentation
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- [Binance API](https://binance-docs.github.io/apidocs/)
- [CCXT Library](https://docs.ccxt.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)

### Architecture Resources
- Pipe and Filter Pattern
- Software Design and Architecture - Course Materials

---

## 📄 License

This project is for educational purposes as part of the Software Design and Architecture course at FINKI UKIM.

---

## 🙏 Acknowledgments

- **CoinGecko** - Free cryptocurrency API
- **Binance** - Historical market data
- **Supabase** - Database hosting
- **CCXT** - Unified exchange API library
- **FINKI UKIM** - Course instruction

---

**Last Updated:** November 19, 2024
**Course:** Software Design and Architecture
**Assignment:** Homework 1 - Pipe and Filter Architecture
