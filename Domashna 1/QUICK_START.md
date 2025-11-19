# 🚀 Quick Start Guide

Get the Crypto Analyzer pipeline running in 5 minutes!

---

## Step 1: Install Dependencies ⚙️

```bash
cd "Domashna 1"
pip install -r requirements.txt
```

**This installs:**
- requests (API calls)
- supabase (database)
- ccxt (crypto exchange API)
- python-dotenv (config)
- tqdm (progress bars)
- python-dateutil (dates)

---

## Step 2: Setup Database 🗄️

### Option A: Already Done ✅
If you already ran the `schema.sql` in Supabase, skip to Step 3.

### Option B: Setup Now
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project
3. Click **SQL Editor** (left sidebar)
4. Copy entire contents of `schema.sql`
5. Paste and click **RUN**
6. Verify 5 tables created: crypto_data, crypto_metadata, pipeline_logs, user_watchlist, data_quality_checks

---

## Step 3: Verify Everything Works 🧪

```bash
python test_connection.py
```

**This checks:**
- ✅ All dependencies installed
- ✅ .env file configured
- ✅ Supabase connection working
- ✅ CoinGecko API accessible
- ✅ Binance API accessible

**If all tests pass**, proceed to Step 4.

**If tests fail**, check:
- Did you run `pip install -r requirements.txt`?
- Is `.env` file present with Supabase credentials?
- Did you run `schema.sql` in Supabase?

---

## Step 4: Run the Pipeline 🎯

```bash
python pipeline.py
```

**Press ENTER when prompted to start.**

### What Happens:

**Filter 1: Get Symbols (30 seconds)**
- Fetches top 1250 cryptos from CoinGecko
- Filters to 1000 valid ones
- Shows progress and results

**Filter 2: Check Dates (10 seconds)**
- Queries database for each symbol
- Determines what data is missing
- Updates metadata

**Filter 3: Fill Data (15-30 minutes)**
- Downloads historical OHLCV data from Binance
- Progress bar shows: `Processing BTC (3650 days)`
- Inserts data in batches
- Handles errors gracefully

**Final Summary:**
- Total time taken
- Records inserted
- Success/failure stats

---

## Step 5: Verify Data in Supabase 🔍

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select `crypto_data` table
4. You should see thousands of records!

### Quick Queries:

**Count total records:**
```sql
SELECT COUNT(*) FROM crypto_data;
```

**View Bitcoin prices:**
```sql
SELECT date, close, volume
FROM crypto_data
WHERE symbol = 'BTC'
ORDER BY date DESC
LIMIT 30;
```

**Top 10 by market cap:**
```sql
SELECT DISTINCT ON (symbol) symbol, name, market_cap, close
FROM crypto_data
ORDER BY symbol, date DESC, market_cap DESC
LIMIT 10;
```

---

## 📊 Expected Results

### First Run (Empty Database):
- **Duration:** 15-30 minutes
- **Records:** ~3,650,000 (1000 cryptos × 10 years × 365 days)
- **API Calls:** ~10,000-15,000

### Incremental Run (Already Has Data):
- **Duration:** 1-5 minutes
- **Records:** Only new days since last run
- **API Calls:** ~1000 (one per crypto)

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'requests'"
```bash
pip install -r requirements.txt
```

### "ValueError: Missing Supabase credentials"
Check `.env` file exists and has:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1...
```

### Pipeline runs but no data inserted
- Check Supabase project is active (not paused)
- Verify `schema.sql` was run successfully
- Check `pipeline_logs` table for error messages

### "Symbol not found on Binance"
Some cryptos aren't on Binance. This is normal - pipeline will skip them and continue.

### Rate limit errors
- CoinGecko free tier: 50 calls/min
- If you hit limits, increase `API_RATE_LIMIT_DELAY` in `config.py`

---

## 🎯 Testing Individual Filters

### Test Filter 1 Only:
```bash
python filter1_get_symbols.py
```
Creates `filter1_output.json` with symbol list.

### Test Filter 2 Only:
```bash
python filter2_check_last_date.py
```
Requires `filter1_output.json`. Creates `filter2_output.json`.

### Test Filter 3 Only:
```bash
python filter3_fill_data.py
```
Requires `filter2_output.json`. Creates `filter3_stats.json`.

---

## ⚡ Performance Tips

### Speed up data collection:
1. Increase `MAX_CONCURRENT_REQUESTS` in `config.py` (default: 10)
2. Decrease `BINANCE_RATE_LIMIT_DELAY` (default: 0.1s)
3. Increase `BATCH_SIZE` (default: 100)

**Warning:** Too aggressive = API rate limit errors!

### Reduce data to fetch:
1. Decrease `TOP_CRYPTOS_COUNT` (e.g., 100 instead of 1000)
2. Decrease `YEARS_OF_HISTORY` (e.g., 1 year instead of 10)

Edit these in `config.py`.

---

## 📁 Output Files

After running, you'll have:

- `filter1_output.json` - List of 1000 valid symbols
- `filter2_output.json` - Symbols with date ranges
- `filter3_stats.json` - Insertion statistics
- `pipeline_results.json` - Complete pipeline results

These are for inspection/debugging. Main data is in Supabase!

---

## ✅ Success Checklist

- [x] Dependencies installed
- [x] Database schema created
- [x] test_connection.py passes
- [x] pipeline.py runs successfully
- [x] Data visible in Supabase
- [x] pipeline_logs table has execution record

**Congratulations! Your Pipe & Filter pipeline is working! 🎉**

---

## 🔄 Running Again (Incremental Updates)

Just run:
```bash
python pipeline.py
```

Filter 2 will check database and only fetch missing days.

**Example:**
- First run: Fetches 10 years for all cryptos (long)
- Second run (next day): Fetches only yesterday's data (fast!)

---

## 📚 Next Steps

1. **Explore the data** in Supabase Table Editor
2. **Run custom queries** to analyze trends
3. **Check pipeline_logs** to see performance metrics
4. **Prepare presentation** for homework submission

For detailed documentation, see [README.md](README.md)

---

**Questions?** Check README.md or ask your team! 🚀
