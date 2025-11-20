# Quick Start Guide - Daily Crypto Update

## Брзо стартување за веќе постоечка база

### 1. Apply ALTER на постоечката schema (опционално)

```sql
-- Само додава index на last_sync_date
-- Отвори Supabase SQL Editor и copy-paste:
```

```bash
cd "Domashna 1"
# Или copy-paste содржината од alter_existing_schema.sql во Supabase
```

### 2. Test рачно

```bash
# Activate virtual environment (ако имаш)
venv\Scripts\activate

# Run daily update
python daily_update.py
```

Ова ќе:
- ✅ Fetch-ува top 1000 од CoinGecko
- ✅ Ажурира rankings
- ✅ Провери `last_sync_date` за секоја монета
- ✅ Fetch-ува само недостасувачки денови
- ✅ Бинанс → CoinGecko fallback

### 3. Setup автоматизација

**Windows:**
```bash
# Right-click setup_daily_task.bat → Run as Administrator
setup_daily_task.bat
```

**Linux/Mac:**
```bash
chmod +x setup_daily_cron.sh
./setup_daily_cron.sh
```

### 4. Verify

**Check logs:**
```bash
tail -f logs/daily_update.log  # Linux/Mac
Get-Content logs\daily_update.log -Tail 50 -Wait  # PowerShell
```

**Check database:**
```sql
SELECT symbol, last_sync_date, total_records, updated_at
FROM crypto_metadata
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 10;
```

## Што треба да знаеш

### Прв пат (Initial Run)
- Ако `last_sync_date IS NULL` → fetch-ува entire history (10 години)
- Трае: 2-3 часа за 1000 монети
- **Run once**

### Daily Run (After Initial)
- Ако `last_sync_date = '2025-11-19'` и денес е `2025-11-20` → fetch-ува само 1 ден!
- Трае: 5-10 минути
- **Automatic** секој ден во 00:00

### Mapping (CoinGecko → Binance)

Автоматски се прави:
```
bitcoin   → BTCUSDT  (Binance)
ethereum  → ETHUSDT  (Binance)
tether    → NULL     (не е на Binance, користи CoinGecko)
```

### Troubleshooting

**Problem: "No module named 'ccxt'"**
```bash
pip install -r requirements.txt
```

**Problem: "supabase connection error"**
Check `.env` file:
```
SUPABASE_URL=...
SUPABASE_KEY=...
```

**Problem: Cron/Task не работи**
Test manually first:
```bash
python daily_update.py
```

Check logs за грешки.

## Files

- `daily_update.py` - Main script
- `mapping.py` - CoinGecko → Binance mapping utility
- `alter_existing_schema.sql` - ALTER script за веќе постоечка база
- `setup_daily_cron.sh` - Linux/Mac automation
- `setup_daily_task.bat` - Windows automation
- `DAILY_UPDATE_README.md` - Детална документација

## TL;DR

```bash
# 1. Run ALTER (optional, just adds index)
# Copy-paste alter_existing_schema.sql во Supabase

# 2. Test manually
python daily_update.py

# 3. Setup automation
setup_daily_task.bat  # Windows
./setup_daily_cron.sh # Linux/Mac

# 4. Done! 🎉
```

Базата ќе се ажурира автоматски секој ден во 00:00!
