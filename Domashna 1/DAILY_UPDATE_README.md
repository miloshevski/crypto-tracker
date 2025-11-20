# Daily Crypto Data Update System

Автоматски систем за дневно ажурирање на податоци за top 1000 криптовалути.

## 🎯 Што прави?

Секој ден во 00:00 (полноќ) автоматски:

1. **Fetch-ува top 1000 coins** од CoinGecko
2. **Проверува ranking промени** - ако има промени, ги ажурира
3. **Проверува `last_sync_date`** за секоја монета во база
4. **Fetch-ува само недостасувачки денови** (не сѐ!)
5. **Пробува Binance прво**, потоа CoinGecko ако фејлира
6. **Зачувува во база** и ажурира `last_sync_date`

## 📊 Database Schema Changes

### Simplified crypto_metadata

```sql
CREATE TABLE crypto_metadata (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rank INTEGER,
  coingecko_id VARCHAR(100),     -- CoinGecko ID (e.g., "bitcoin")
  binance_symbol VARCHAR(20),     -- Binance pair (e.g., "BTCUSDT")
  last_sync_date DATE,            -- 🔥 KEY: Last date we have data for
  total_records INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Column: `last_sync_date`

Ова е **клучната колона** што овозможува инкрементално fetch-ување:

```
Example:
- BTC last_sync_date: 2025-11-17
- Today: 2025-11-20
- Days missing: 3
- Action: Fetch only Nov 18, 19, 20 (NOT entire history!)
```

## 🚀 Setup

### 1. Apply New Schema

```bash
# Connect to your Supabase and run:
psql -h your-host -U your-user -d your-db -f schema_simplified.sql
```

Или copy-paste SQL од `schema_simplified.sql` во Supabase SQL Editor.

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup Automatic Daily Run

#### Option A: Linux/Mac (Cron)

```bash
chmod +x setup_daily_cron.sh
./setup_daily_cron.sh
```

Ова ќе креира cron job што работи секој ден во 00:00.

**Verify:**
```bash
crontab -l
```

**View logs:**
```bash
tail -f logs/daily_update.log
```

#### Option B: Windows (Task Scheduler)

1. Right-click `setup_daily_task.bat`
2. Select "Run as Administrator"
3. Follow prompts

**Verify:**
- Open Task Scheduler (Win + R → `taskschd.msc`)
- Look for "CryptoTrackerDailyUpdate"

**View in Task Scheduler:**
- Task Scheduler Library → CryptoTrackerDailyUpdate

## 🧪 Manual Testing

Пред да го оставиш автоматски, тестирај рачно:

```bash
python daily_update.py
```

Ова ќе:
1. Fetch-ува top 1000 од CoinGecko
2. Провери ranking changes
3. Fetch-ува missing days за сите coins
4. Принта детален summary

**Example output:**
```
🚀 DAILY CRYPTO DATA UPDATE
📅 Date: 2025-11-20 00:00:00

📥 Fetching top 1000 coins from CoinGecko...
   ✅ Retrieved 1000 coins

🔗 Creating CoinGecko → Binance mapping...
   → Found 548 Binance USDT pairs

📊 Updating rankings in database...
   ✅ Updated: 15, New: 0

🔍 Checking which coins need updates...
   → 1000 coins need updates

🔄 Updating 1000 coins...
Fetching data: 100%|████████████| 1000/1000

📊 DAILY UPDATE SUMMARY
✅ Success: 954
❌ Failed: 46
💾 Total records saved: 2,862
📈 From Binance: 548
🦎 From CoinGecko: 406
```

## 📁 Files

- **daily_update.py** - Main script за дневно ажурирање
- **mapping.py** - CoinGecko → Binance mapping utility
- **schema_simplified.sql** - New database schema
- **setup_daily_cron.sh** - Linux/Mac cron setup
- **setup_daily_task.bat** - Windows Task Scheduler setup
- **config.py** - Configuration (reused)

## 🔄 How It Works

### Step-by-Step Process

#### 1. Fetch Top 1000 from CoinGecko

```python
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd
  &order=market_cap_desc
  &per_page=250
  &page=1-4
```

Returns: BTC (#1), ETH (#2), ...

#### 2. Create CoinGecko → Binance Mapping

```python
CoinGecko         Binance
"bitcoin"    →    "BTCUSDT"
"ethereum"   →    "ETHUSDT"
"tether"     →    None (not on Binance)
```

#### 3. Update Rankings

Проверува дали има промени во ranking:

```sql
-- Example: XRP moved from rank 5 to rank 4
UPDATE crypto_metadata
SET rank = 4, updated_at = NOW()
WHERE symbol = 'XRP' AND rank != 4;
```

#### 4. Check last_sync_date for Each Coin

```sql
SELECT symbol, coingecko_id, binance_symbol, last_sync_date
FROM crypto_metadata
WHERE is_active = true;
```

For each coin:
- If `last_sync_date = NULL` → Fetch entire history (e.g., 10 years)
- If `last_sync_date = 2025-11-17` → Fetch only 3 days (Nov 18, 19, 20)

#### 5. Fetch Missing Days

```python
if binance_symbol:
    # Try Binance first
    candles = binance.fetch_ohlcv('BTCUSDT', '1d', since=...)

if not candles:
    # Fallback to CoinGecko
    candles = fetch_from_coingecko('bitcoin', start, end)
```

#### 6. Save to Database

```sql
INSERT INTO crypto_data (symbol, date, open, high, low, close, volume, exchange, ...)
VALUES ('BTC', '2025-11-18', 91234, 92100, 90800, 91850, 28500000000, 'binance', ...)
ON CONFLICT (symbol, date, exchange) DO UPDATE ...;

UPDATE crypto_metadata
SET last_sync_date = '2025-11-20',
    total_records = total_records + 3,
    updated_at = NOW()
WHERE symbol = 'BTC';
```

## 🎛️ Configuration

Edit `config.py` if needed:

```python
# How many years of history to fetch for new coins
YEARS_OF_HISTORY = 10  # Can reduce to 1 or 2 for faster initial run

# Rate limiting
API_RATE_LIMIT_DELAY = 1.2  # CoinGecko free tier
BINANCE_RATE_LIMIT_DELAY = 0.05
```

## 📈 Performance

### Initial Run (No data in database)
- **1000 coins** × **10 years** = **~3.6 million records**
- **Time**: ~2-3 hours
- **Run once**, then daily incremental

### Daily Incremental Run
- **1000 coins** × **1 day** = **1000 records**
- **Time**: ~5-10 minutes
- **Automatic** every night at 00:00

## 🔍 Monitoring

### Check Logs

**Linux/Mac:**
```bash
tail -f logs/daily_update.log
```

**Windows:**
```powershell
Get-Content logs\daily_update.log -Tail 50 -Wait
```

### Check Database

```sql
-- Check recent updates
SELECT symbol, last_sync_date, total_records, updated_at
FROM crypto_metadata
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 10;

-- Check for coins not updated recently
SELECT symbol, last_sync_date,
       CURRENT_DATE - last_sync_date AS days_behind
FROM crypto_metadata
WHERE is_active = true
  AND last_sync_date < CURRENT_DATE - INTERVAL '2 days'
ORDER BY days_behind DESC;
```

## 🐛 Troubleshooting

### Problem: Cron job not running

**Check cron logs:**
```bash
grep CRON /var/log/syslog  # Ubuntu
grep CRON /var/log/cron    # CentOS
```

**Test manually:**
```bash
python daily_update.py
```

### Problem: Task Scheduler not working (Windows)

1. Open Task Scheduler
2. Find "CryptoTrackerDailyUpdate"
3. Right-click → Run
4. Check "Last Run Result" column

### Problem: Rate limit errors

**CoinGecko rate limits:**
- Free tier: ~50 calls/minute
- Solution: Increase `API_RATE_LIMIT_DELAY` in config.py

**Binance rate limits:**
- Usually no issues
- If errors occur, increase `BINANCE_RATE_LIMIT_DELAY`

### Problem: Some coins always fail

**Check mapping:**
```python
python mapping.py
cat mapping.json | grep "null"  # Coins not on Binance
```

These coins will fallback to CoinGecko automatically.

## 🔐 Security

`.env` file contains sensitive keys:
```
SUPABASE_URL=...
SUPABASE_KEY=...
```

**Never commit `.env` to git!**

Already in `.gitignore`:
```
.env
*.env
```

## 📚 Integration with Domashna 2

Domashna 1 (Daily Update) + Domashna 2 (On-Demand API) = Complete System

**Domashna 1:**
- Runs automatically daily
- Keeps bulk data up-to-date
- Handles all 1000 coins

**Domashna 2:**
- Runs on-demand when user clicks "Show Graph"
- Fills small gaps (≤7 days)
- Faster response for individual coins

**Best of both worlds!** 🎉

## 🎉 Summary

- ✅ **Automatic**: Runs daily without manual intervention
- ✅ **Efficient**: Only fetches missing days (not entire history)
- ✅ **Smart**: Binance first, CoinGecko fallback
- ✅ **Scalable**: Handles 1000+ coins easily
- ✅ **Reliable**: Retries and error handling
- ✅ **Logged**: Full audit trail in logs/
