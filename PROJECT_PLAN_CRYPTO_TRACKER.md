# Crypto Exchange Analyzer - Complete Project Plan & Implementation Guide

## 🎯 PROJECT OVERVIEW

**Project Name:** Crypto Exchange Analyzer
**Type:** Full-stack Web Application
**Purpose:** Analyze top 1000 cryptocurrencies from international exchanges using Pipe and Filter architecture
**Course:** Software Design and Architecture - FINKI UKIM
**Academic Year:** 2024/2025

---

## 🏗️ TECHNOLOGY STACK

### **Frontend**
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18+
- **Styling:** Tailwind CSS
- **Charts:** Chart.js / Recharts / ApexCharts
- **State Management:** React Context API / Zustand
- **API Client:** Axios / Native Fetch
- **Deployment:** Vercel

### **Backend**
- **Runtime:** Next.js API Routes (serverless functions)
- **Language:** TypeScript/JavaScript
- **Architecture:** Pipe and Filter Pattern
- **Cron Jobs:** Vercel Cron Jobs for automated data updates

### **Database**
- **Provider:** Supabase (PostgreSQL)
- **ORM:** Supabase Client Library
- **Features:** Real-time subscriptions, Row Level Security (RLS)
- **Hosting:** Supabase Cloud

### **Data Sources (APIs - NO WEB SCRAPING)**
- **Primary:** Binance API (free, no auth required for public data)
- **Secondary:** CoinGecko API (free tier: 10-50 calls/min)
- **Alternative:** CoinMarketCap API (free tier available)
- **Library:** ccxt (Crypto Exchange Trading Library) - supports 100+ exchanges

### **Performance & Optimization**
- **Parallel Processing:** Promise.all() for concurrent API calls
- **Rate Limiting:** Bottleneck.js or p-queue
- **Caching:** Redis (Upstash) or Next.js cache
- **Background Jobs:** Vercel Cron or Supabase Edge Functions

---

## 📊 DATA REQUIREMENTS

### **Data Coverage**
- **Cryptocurrencies:** Top 1000 active cryptocurrencies
- **Time Range:** Minimum 10 years historical data (daily basis)
- **Update Frequency:** Daily automated updates

### **Data Points to Collect**
```typescript
interface CryptoData {
  symbol: string;              // e.g., "BTC", "ETH"
  name: string;                // e.g., "Bitcoin", "Ethereum"
  date: Date;                  // Trading date

  // OHLCV Data
  open: number;                // Opening price
  high: number;                // Highest price
  low: number;                 // Lowest price
  close: number;               // Closing price
  volume: number;              // Trading volume

  // 24H Metrics
  last_price_24h: number;      // Last price in 24h
  volume_24h: number;          // 24h volume
  high_24h: number;            // 24h high
  low_24h: number;             // 24h low
  change_24h_percent: number;  // 24h change %

  // Market Data
  market_cap: number;          // Market capitalization
  liquidity: number;           // Liquidity score
  rank: number;                // Market cap rank

  // Metadata
  exchange: string;            // Source exchange
  quote_currency: string;      // USD, USDT, etc.
  is_active: boolean;          // Active trading status
  last_updated: Date;          // Last update timestamp
}
```

---

## 🔄 PIPE AND FILTER ARCHITECTURE

### **Architecture Overview**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌──────────┐
│  Filter 1   │─────▶│  Filter 2   │─────▶│  Filter 3   │─────▶│ Database │
│   Symbols   │      │  Check DB   │      │  Fill Data  │      │ Supabase │
└─────────────┘      └─────────────┘      └─────────────┘      └──────────┘
     │                      │                     │
     │                      │                     │
     ▼                      ▼                     ▼
 CoinGecko API         Supabase Query       Binance API
 (Top 1000)            (Last Date)          (OHLCV Data)
```

### **Filter 1: Get Top 1000 Crypto Symbols**
**Location:** `/api/filters/filter1-get-symbols.ts`

**Input:** None (or manual trigger)

**Process:**
1. Call CoinGecko API: `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1`
2. Fetch 4 pages (250 × 4 = 1000 cryptos)
3. Filter out invalid cryptocurrencies:
   - Delisted coins (check `is_active` status)
   - Low liquidity (volume_24h < threshold)
   - Duplicates (same symbol different exchanges)
   - Unstable quote currencies (only keep USD/USDT pairs)
4. Validate data completeness (no null critical fields)

**Output:** Array of validated crypto symbols with metadata
```typescript
interface SymbolData {
  symbol: string;
  name: string;
  rank: number;
  market_cap: number;
  is_active: boolean;
}
```

**Implementation Notes:**
- Use pagination to get all 1000 cryptos
- Implement retry logic for failed API calls
- Cache results for 24 hours to reduce API calls
- Log excluded cryptocurrencies with reasons

---

### **Filter 2: Check Last Available Date**
**Location:** `/api/filters/filter2-check-last-date.ts`

**Input:** Array of SymbolData from Filter 1

**Process:**
1. For each symbol, query Supabase:
   ```sql
   SELECT MAX(date) as last_date
   FROM crypto_data
   WHERE symbol = $symbol
   ```
2. If no data exists:
   - Set `last_date = null`
   - Set `download_range = "10_years"` (or max available)
3. If data exists:
   - Calculate days missing: `today - last_date`
   - Set `download_range = "incremental"`
4. Check exchange availability for historical data (some exchanges limit history)

**Output:** Array of symbols with date information
```typescript
interface SymbolWithDate {
  symbol: string;
  name: string;
  last_date: Date | null;
  download_range: "10_years" | "incremental";
  days_missing: number;
}
```

**Implementation Notes:**
- Batch database queries for performance (100 symbols per query)
- Handle timezone conversions (UTC standard)
- Consider exchange rate limits when planning downloads

---

### **Filter 3: Fill Missing Data**
**Location:** `/api/filters/filter3-fill-data.ts`

**Input:** Array of SymbolWithDate from Filter 2

**Process:**
1. For each symbol, determine date range:
   - If `last_date = null`: download from (today - 10 years) to today
   - If `last_date` exists: download from (last_date + 1 day) to today
2. Call Binance API (or use ccxt library):
   ```javascript
   // Using ccxt
   const exchange = new ccxt.binance();
   const ohlcv = await exchange.fetchOHLCV(symbol, '1d', since, limit);
   ```
3. Transform API response to database schema
4. Validate data integrity:
   - Check for gaps in dates
   - Verify OHLCV values are positive
   - Ensure volume is not zero for active trading days
5. Batch insert/upsert to Supabase:
   ```sql
   INSERT INTO crypto_data (symbol, date, open, high, low, close, volume, ...)
   VALUES (...)
   ON CONFLICT (symbol, date) DO UPDATE SET ...
   ```
6. Update metadata table with last sync timestamp

**Output:** Database populated with complete historical data

**Implementation Notes:**
- Use parallel processing with rate limiting (max 10 concurrent requests)
- Implement exponential backoff for API rate limits
- Save checkpoint after each successful batch (resume capability)
- Log statistics: total records inserted, update time, errors

---

## 📁 PROJECT STRUCTURE

```
crypto-exchange-analyzer/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/                  # Main app group
│   │   ├── page.tsx                  # Homepage - market overview
│   │   ├── crypto/[symbol]/          # Individual crypto page
│   │   ├── portfolio/                # User portfolio
│   │   ├── analytics/                # Analytics dashboard
│   │   └── admin/                    # Admin panel
│   ├── api/                          # API Routes
│   │   ├── filters/
│   │   │   ├── filter1-get-symbols/route.ts
│   │   │   ├── filter2-check-last-date/route.ts
│   │   │   ├── filter3-fill-data/route.ts
│   │   │   └── run-pipeline/route.ts    # Execute all filters
│   │   ├── crypto/
│   │   │   ├── [symbol]/route.ts        # Get crypto data
│   │   │   ├── list/route.ts            # Get all cryptos
│   │   │   └── search/route.ts          # Search cryptos
│   │   ├── market/
│   │   │   ├── overview/route.ts        # Market stats
│   │   │   └── trending/route.ts        # Trending cryptos
│   │   └── cron/
│   │       └── daily-update/route.ts    # Scheduled updates
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
│
├── components/                       # React components
│   ├── ui/                          # Shadcn UI components
│   ├── charts/                      # Chart components
│   │   ├── PriceChart.tsx
│   │   ├── VolumeChart.tsx
│   │   └── MarketCapChart.tsx
│   ├── crypto/                      # Crypto-specific
│   │   ├── CryptoCard.tsx
│   │   ├── CryptoTable.tsx
│   │   └── CryptoSearch.tsx
│   ├── layout/                      # Layout components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── dashboard/
│       ├── MarketOverview.tsx
│       ├── TopGainers.tsx
│       └── TopLosers.tsx
│
├── lib/                             # Utility libraries
│   ├── supabase/
│   │   ├── client.ts               # Supabase client
│   │   ├── server.ts               # Server-side client
│   │   └── types.ts                # Database types
│   ├── api/
│   │   ├── binance.ts              # Binance API wrapper
│   │   ├── coingecko.ts            # CoinGecko API wrapper
│   │   └── ccxt-client.ts          # CCXT unified API
│   ├── filters/                    # Filter logic (reusable)
│   │   ├── filter1.ts
│   │   ├── filter2.ts
│   │   ├── filter3.ts
│   │   └── pipeline.ts             # Pipeline orchestrator
│   ├── utils/
│   │   ├── date-helpers.ts
│   │   ├── number-formatters.ts
│   │   ├── validators.ts
│   │   └── rate-limiter.ts
│   └── constants.ts                # App constants
│
├── types/                          # TypeScript types
│   ├── crypto.ts
│   ├── api.ts
│   └── database.ts
│
├── supabase/                       # Supabase config
│   ├── migrations/                 # SQL migrations
│   │   └── 001_initial_schema.sql
│   └── seed.sql                    # Seed data
│
├── public/                         # Static assets
│   ├── images/
│   └── icons/
│
├── docs/                           # Documentation (Homework 1)
│   ├── project-description.md      # ~1 page project description
│   ├── requirements.md             # 5-10 pages requirements spec
│   │                               # (functional, non-functional, personas)
│   ├── architecture.md             # Pipe & Filter architecture diagram
│   └── api-research.md             # API source research & selection
│
├── scripts/                        # Utility scripts
│   ├── setup-db.ts                 # Database setup
│   ├── test-pipeline.ts            # Test pipe-filter locally
│   └── measure-performance.ts      # Performance timer (bonus challenge)
│
├── .env.local                      # Environment variables
├── .gitignore
├── next.config.js                  # Next.js config
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vercel.json                     # Vercel deployment config
└── README.md
```

---

## 🗄️ DATABASE SCHEMA (SUPABASE)

### **Table: crypto_data** (Main OHLCV data)
```sql
CREATE TABLE crypto_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  date DATE NOT NULL,

  -- OHLCV
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,

  -- 24H Metrics
  last_price_24h DECIMAL(20, 8),
  volume_24h DECIMAL(20, 8),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  change_24h_percent DECIMAL(10, 4),

  -- Market Data
  market_cap DECIMAL(25, 2),
  liquidity DECIMAL(20, 8),
  rank INTEGER,

  -- Metadata
  exchange VARCHAR(50) DEFAULT 'binance',
  quote_currency VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(symbol, date, exchange)
);

-- Indexes for performance
CREATE INDEX idx_crypto_symbol ON crypto_data(symbol);
CREATE INDEX idx_crypto_date ON crypto_data(date DESC);
CREATE INDEX idx_crypto_symbol_date ON crypto_data(symbol, date DESC);
CREATE INDEX idx_crypto_rank ON crypto_data(rank) WHERE rank IS NOT NULL;
```

### **Table: crypto_metadata** (Symbol information)
```sql
CREATE TABLE crypto_metadata (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rank INTEGER,

  -- Exchange Info
  exchange VARCHAR(50),
  trading_pairs TEXT[], -- Array of available pairs (BTC/USDT, BTC/USD)

  -- Data Sync Status
  last_sync_date DATE,
  first_available_date DATE,
  data_completeness_percent DECIMAL(5, 2), -- % of days with data

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_delisted BOOLEAN DEFAULT false,
  delisted_date DATE,

  -- API Metadata
  coingecko_id VARCHAR(100),
  binance_symbol VARCHAR(20),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metadata_symbol ON crypto_metadata(symbol);
CREATE INDEX idx_metadata_rank ON crypto_metadata(rank);
```

### **Table: pipeline_logs** (Track pipeline execution)
```sql
CREATE TABLE pipeline_logs (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID DEFAULT gen_random_uuid(),
  filter_name VARCHAR(50), -- 'filter1', 'filter2', 'filter3'
  status VARCHAR(20), -- 'running', 'success', 'failed'

  -- Stats
  symbols_processed INTEGER,
  records_inserted INTEGER,
  records_updated INTEGER,
  errors_count INTEGER,

  -- Performance
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Details
  error_message TEXT,
  metadata JSONB, -- Additional info

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pipeline_run_id ON pipeline_logs(run_id);
CREATE INDEX idx_pipeline_created ON pipeline_logs(created_at DESC);
```

### **Table: user_watchlist** (User favorites - future feature)
```sql
CREATE TABLE user_watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, symbol)
);

CREATE INDEX idx_watchlist_user ON user_watchlist(user_id);
```

---

## 🔌 API INTEGRATION GUIDE

### **CoinGecko API** (Free Tier)
**Base URL:** `https://api.coingecko.com/api/v3`

**Endpoints to Use:**
```javascript
// 1. Get top 1000 cryptos by market cap
GET /coins/markets
  ?vs_currency=usd
  &order=market_cap_desc
  &per_page=250
  &page=1
  &sparkline=false

// Response:
[
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    current_price: 43500,
    market_cap: 850000000000,
    market_cap_rank: 1,
    total_volume: 25000000000,
    high_24h: 44000,
    low_24h: 43000,
    price_change_24h: 500,
    price_change_percentage_24h: 1.16,
    ...
  }
]

// Rate Limits: 10-50 calls/min (free tier)
```

**Wrapper Example:**
```typescript
// lib/api/coingecko.ts
export async function getTop1000Cryptos(): Promise<SymbolData[]> {
  const results: SymbolData[] = [];

  for (let page = 1; page <= 4; page++) {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?` +
      `vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`
    );
    const data = await response.json();
    results.push(...data);

    // Respect rate limits
    await sleep(1200); // ~50 calls/min
  }

  return results;
}
```

---

### **Binance API** (No Auth Required for Public Data)
**Base URL:** `https://api.binance.com/api/v3`

**Endpoints to Use:**
```javascript
// 1. Get historical OHLCV data (klines)
GET /klines
  ?symbol=BTCUSDT
  &interval=1d
  &startTime=1609459200000  // Unix timestamp ms
  &endTime=1640995200000
  &limit=1000               // Max 1000 per request

// Response: Array of [timestamp, open, high, low, close, volume, ...]
[
  [
    1609459200000,  // Open time
    "29000.00",     // Open
    "29500.00",     // High
    "28800.00",     // Low
    "29300.00",     // Close
    "1234.56",      // Volume
    1609545599999,  // Close time
    "35987654.32",  // Quote asset volume
    5678,           // Number of trades
    "678.90",       // Taker buy base asset volume
    "19876543.21",  // Taker buy quote asset volume
    "0"             // Ignore
  ]
]

// 2. Get 24h ticker price change
GET /ticker/24hr?symbol=BTCUSDT

// Rate Limits: 1200 requests/min (weight-based)
```

**Wrapper Example:**
```typescript
// lib/api/binance.ts
export async function getHistoricalData(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<OHLCVData[]> {
  const interval = '1d';
  const limit = 1000;
  const results: OHLCVData[] = [];

  let currentStart = startDate.getTime();
  const end = endDate.getTime();

  while (currentStart < end) {
    const url = `https://api.binance.com/api/v3/klines?` +
      `symbol=${symbol}USDT&interval=${interval}&` +
      `startTime=${currentStart}&limit=${limit}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.length === 0) break;

    results.push(...data.map(transformToOHLCV));

    // Update start time for next batch
    currentStart = data[data.length - 1][0] + 86400000; // +1 day

    await sleep(100); // Rate limiting
  }

  return results;
}
```

---

### **CCXT Library** (Recommended - Unified API)
**Installation:** `npm install ccxt`

**Advantages:**
- Unified interface for 100+ exchanges
- Built-in rate limiting
- Automatic retry logic
- Type definitions

**Example Usage:**
```typescript
// lib/api/ccxt-client.ts
import ccxt from 'ccxt';

const exchange = new ccxt.binance({
  enableRateLimit: true, // Automatic rate limiting
});

export async function fetchOHLCVData(
  symbol: string,
  timeframe: string = '1d',
  since?: number,
  limit?: number
): Promise<any[]> {
  try {
    // symbol format: 'BTC/USDT'
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit);
    return ohlcv;
    // Returns: [[timestamp, open, high, low, close, volume], ...]
  } catch (error) {
    console.error(`Error fetching OHLCV for ${symbol}:`, error);
    throw error;
  }
}

export async function fetchAllMarkets(): Promise<any> {
  const markets = await exchange.loadMarkets();
  return markets;
}
```

---

## ⚡ PERFORMANCE OPTIMIZATION (Bonus Challenge)

### **Goal:** Populate empty database as fast as possible

### **Strategies:**

#### 1. **Parallel Processing**
```typescript
// Process multiple cryptos simultaneously
async function processBatch(symbols: string[], batchSize: number = 10) {
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    await Promise.all(batch.map(symbol => processSymbol(symbol)));
  }
}
```

#### 2. **Rate Limiting with p-queue**
```typescript
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 10,           // 10 concurrent requests
  interval: 1000,            // Per second
  intervalCap: 50,           // Max 50 requests/sec
});

queue.add(() => fetchData(symbol));
```

#### 3. **Batch Database Inserts**
```typescript
// Instead of inserting one by one, batch insert 1000 records at once
const { error } = await supabase
  .from('crypto_data')
  .upsert(records, { onConflict: 'symbol,date' });
```

#### 4. **Caching**
```typescript
// Cache API responses with Upstash Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

// Cache for 24 hours
await redis.set(`crypto:${symbol}`, data, { ex: 86400 });
```

#### 5. **Performance Timer**
```typescript
// scripts/measure-performance.ts
import { performance } from 'perf_hooks';

async function measurePipelinePerformance() {
  console.log('🚀 Starting pipeline performance test...\n');

  const startTime = performance.now();

  // Clear database
  await clearDatabase();

  // Run Filter 1
  console.log('Filter 1: Getting top 1000 symbols...');
  const t1 = performance.now();
  const symbols = await filter1_getSymbols();
  console.log(`✓ Filter 1 completed in ${((performance.now() - t1) / 1000).toFixed(2)}s`);
  console.log(`  Found ${symbols.length} symbols\n`);

  // Run Filter 2
  console.log('Filter 2: Checking last dates...');
  const t2 = performance.now();
  const symbolsWithDates = await filter2_checkLastDate(symbols);
  console.log(`✓ Filter 2 completed in ${((performance.now() - t2) / 1000).toFixed(2)}s\n`);

  // Run Filter 3
  console.log('Filter 3: Filling missing data...');
  const t3 = performance.now();
  await filter3_fillData(symbolsWithDates);
  console.log(`✓ Filter 3 completed in ${((performance.now() - t3) / 1000).toFixed(2)}s\n`);

  const endTime = performance.now();
  const totalSeconds = ((endTime - startTime) / 1000).toFixed(2);
  const totalMinutes = (parseFloat(totalSeconds) / 60).toFixed(2);

  console.log('═══════════════════════════════════════');
  console.log(`🏁 TOTAL TIME: ${totalSeconds}s (${totalMinutes} minutes)`);
  console.log('═══════════════════════════════════════\n');

  // Get stats
  const stats = await getDatabaseStats();
  console.log('📊 Database Statistics:');
  console.log(`  Total records: ${stats.totalRecords.toLocaleString()}`);
  console.log(`  Unique symbols: ${stats.uniqueSymbols}`);
  console.log(`  Date range: ${stats.earliestDate} to ${stats.latestDate}`);
  console.log(`  Avg records per symbol: ${stats.avgRecordsPerSymbol}`);

  return { totalSeconds, stats };
}
```

#### 6. **Optimization Checklist**
- [ ] Use connection pooling for Supabase
- [ ] Implement retry logic with exponential backoff
- [ ] Use streaming for large API responses
- [ ] Compress data before sending to database
- [ ] Use Vercel Edge Functions for faster cold starts
- [ ] Implement resume capability (save checkpoint after each batch)
- [ ] Use database indexes on frequently queried columns
- [ ] Monitor and log bottlenecks

---

## 🚀 DEPLOYMENT GUIDE

### **Vercel Deployment**

#### 1. **Install Vercel CLI**
```bash
npm i -g vercel
```

#### 2. **Configure Environment Variables**
Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys (if needed)
COINGECKO_API_KEY=your_key_here
BINANCE_API_KEY=your_key_here
BINANCE_API_SECRET=your_secret_here

# Upstash Redis (optional)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxGE=

# Cron Secret (for security)
CRON_SECRET=your_random_secret_string_here
```

#### 3. **Configure Vercel Cron Jobs**
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-update",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### 4. **Deploy**
```bash
vercel --prod
```

#### 5. **Add Environment Variables in Vercel Dashboard**
- Go to Project Settings → Environment Variables
- Add all variables from `.env.local`

---

### **Supabase Setup**

#### 1. **Create Project**
- Go to https://supabase.com
- Create new project
- Wait for database provisioning

#### 2. **Run Migrations**
```bash
# Install Supabase CLI
npm install -g supabase

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### 3. **Enable Row Level Security (Optional)**
```sql
-- Enable RLS on crypto_data table
ALTER TABLE crypto_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON crypto_data FOR SELECT
  TO public
  USING (true);

-- Allow authenticated write access
CREATE POLICY "Allow authenticated write access"
  ON crypto_data FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 📝 HOMEWORK 1 DELIVERABLES

### **1. Project Description (~1 page)**
**File:** `docs/project-description.md`

**Content:**
- **What:** Crypto Exchange Analyzer for top 1000 cryptocurrencies
- **Technologies:** Next.js, Supabase, Binance/CoinGecko APIs
- **Data Source:** International crypto exchanges (Binance, CoinGecko)
- **Data Processing:** Pipe and Filter architecture with 3 filters
- **Storage:** PostgreSQL (Supabase) with optimized schema
- **Expected Results:**
  - Complete 10-year historical database of top 1000 cryptos
  - Daily OHLCV data with market metrics
  - Automated daily updates via cron jobs
  - Web interface for data visualization
  - High-performance data pipeline
- **Benefits:**
  - Centralized crypto market data
  - Historical analysis capabilities
  - Real-time market insights
  - Foundation for advanced analytics (ML, predictions)

---

### **2. Requirements Specification (5-10 pages)**
**File:** `docs/requirements.md`

**Structure:**

#### **A. Functional Requirements**
1. **Data Collection**
   - FR1: System shall automatically retrieve top 1000 cryptocurrencies ranked by market cap
   - FR2: System shall download minimum 10 years of historical OHLCV data
   - FR3: System shall update database daily with latest data
   - FR4: System shall filter out delisted/inactive cryptocurrencies
   - FR5: System shall handle missing data and gaps in historical records

2. **Data Storage**
   - FR6: System shall store OHLCV data in structured database
   - FR7: System shall maintain metadata for each cryptocurrency
   - FR8: System shall prevent duplicate entries
   - FR9: System shall track data sync status per symbol

3. **API Endpoints**
   - FR10: System shall provide API to query crypto data by symbol
   - FR11: System shall provide API to list all available cryptos
   - FR12: System shall provide API to search cryptocurrencies
   - FR13: System shall provide market overview statistics

4. **User Interface**
   - FR14: System shall display list of top cryptocurrencies
   - FR15: System shall show individual crypto detail pages with charts
   - FR16: System shall provide search and filter functionality
   - FR17: System shall display real-time price updates

5. **Pipeline Execution**
   - FR18: System shall execute pipe-filter pipeline on demand
   - FR19: System shall log pipeline execution results
   - FR20: System shall provide progress tracking during data collection

#### **B. Non-Functional Requirements**
1. **Performance**
   - NFR1: Database population shall complete within reasonable time (target: < 2 hours for 1000 symbols × 10 years)
   - NFR2: API response time shall be < 500ms for single crypto queries
   - NFR3: System shall handle concurrent requests (min 100 users)
   - NFR4: Page load time shall be < 3 seconds

2. **Scalability**
   - NFR5: System shall support adding more cryptocurrencies beyond 1000
   - NFR6: Database shall efficiently handle millions of records
   - NFR7: System shall scale horizontally on Vercel platform

3. **Reliability**
   - NFR8: System shall have 99% uptime
   - NFR9: Failed API calls shall retry automatically (max 3 attempts)
   - NFR10: Pipeline shall resume from last checkpoint on failure

4. **Security**
   - NFR11: API keys shall be stored securely in environment variables
   - NFR12: Cron endpoints shall require authentication token
   - NFR13: Database shall use Row Level Security policies

5. **Maintainability**
   - NFR14: Code shall follow TypeScript best practices
   - NFR15: Functions shall be modular and reusable
   - NFR16: System shall have comprehensive logging
   - NFR17: Architecture shall support adding new data sources

6. **Usability**
   - NFR18: UI shall be responsive (mobile, tablet, desktop)
   - NFR19: Charts shall be interactive and zoomable
   - NFR20: System shall provide user-friendly error messages

#### **C. User Personas**

**Persona 1: Alex - Crypto Investor**
- **Age:** 28
- **Occupation:** Software Engineer
- **Goals:** Track portfolio, analyze historical trends, make informed investment decisions
- **Technical Level:** High
- **Use Cases:**
  - Views historical price charts to identify patterns
  - Compares multiple cryptocurrencies side-by-side
  - Downloads data for custom analysis
  - Sets up watchlist for favorite coins

**Persona 2: Dr. Maria - Financial Researcher**
- **Age:** 45
- **Occupation:** Economics Professor
- **Goals:** Research crypto market dynamics, publish academic papers
- **Technical Level:** Medium
- **Use Cases:**
  - Exports historical data for statistical analysis
  - Studies correlation between different cryptocurrencies
  - Analyzes market volatility during specific periods
  - Needs reliable, complete datasets

**Persona 3: Sarah - Crypto Enthusiast**
- **Age:** 22
- **Occupation:** Student
- **Goals:** Learn about crypto markets, follow trends
- **Technical Level:** Low-Medium
- **Use Cases:**
  - Browses top cryptocurrencies by market cap
  - Reads crypto news and market updates
  - Checks daily price changes
  - Discovers new trending coins

#### **D. User Scenarios**

**Scenario 1: First-Time User Exploring the Platform**
1. Sarah visits the homepage
2. Sees overview of top 10 cryptocurrencies with 24h changes
3. Clicks on Bitcoin card to view details
4. Sees interactive price chart with 1Y timeframe
5. Switches to 1M timeframe to see recent trends
6. Scrolls down to see volume chart and market metrics
7. Clicks "Add to Watchlist" button
8. Creates account to save watchlist

**Scenario 2: Data Analyst Downloading Historical Data**
1. Alex logs into the platform
2. Searches for "Ethereum" in the search bar
3. Navigates to Ethereum detail page
4. Selects "All Time" timeframe
5. Clicks "Export Data" button
6. Downloads CSV with complete historical OHLCV data
7. Uses data in custom Python analysis script

**Scenario 3: Admin Running Manual Pipeline Update**
1. Admin logs into admin dashboard
2. Views last pipeline execution status: "Success - 2 hours ago"
3. Notices new cryptocurrency entered top 1000
4. Clicks "Run Pipeline Now" button
5. Monitors progress: "Filter 1: 1000/1000 symbols processed"
6. Sees notification: "Pipeline completed successfully"
7. Verifies new cryptocurrency appears in database

---

### **3. API Research Document**
**File:** `docs/api-research.md`

**Content:**
- Comparison table of API options (CoinGecko vs CoinMarketCap vs Binance vs CCXT)
- Rate limits comparison
- Data availability comparison
- Cost analysis (free tier limitations)
- Justification for chosen APIs
- Backup strategy if primary API fails

---

### **4. Architecture Diagram**
**File:** `docs/architecture.md`

Include:
- Pipe and Filter architecture diagram
- System architecture diagram (Next.js + Supabase)
- Data flow diagram
- Entity-Relationship diagram (database schema)
- Deployment architecture (Vercel + Supabase)

---

## 🎯 IMPLEMENTATION CHECKLIST

### **Phase 1: Setup (Day 1)**
- [ ] Create Next.js project with TypeScript
- [ ] Install dependencies (ccxt, Supabase client, Chart.js, Tailwind)
- [ ] Setup Supabase project and create database schema
- [ ] Configure environment variables
- [ ] Create project structure (folders, files)
- [ ] Initialize Git repository

### **Phase 2: Backend - Pipe & Filter (Days 2-4)**
- [ ] Implement Filter 1: Get top 1000 symbols from CoinGecko
- [ ] Implement Filter 2: Check last date in Supabase
- [ ] Implement Filter 3: Fill missing data from Binance
- [ ] Create pipeline orchestrator to run all filters
- [ ] Add error handling and retry logic
- [ ] Add logging to `pipeline_logs` table
- [ ] Implement performance timer
- [ ] Test pipeline with empty database

### **Phase 3: API Routes (Days 5-6)**
- [ ] Create `/api/filters/run-pipeline` endpoint
- [ ] Create `/api/crypto/[symbol]` endpoint
- [ ] Create `/api/crypto/list` endpoint
- [ ] Create `/api/crypto/search` endpoint
- [ ] Create `/api/market/overview` endpoint
- [ ] Create `/api/cron/daily-update` endpoint
- [ ] Test all endpoints with Postman/Thunder Client

### **Phase 4: Frontend (Days 7-9)**
- [ ] Design homepage layout (Navbar, Hero, CryptoTable)
- [ ] Implement CryptoTable component with pagination
- [ ] Create individual crypto detail page
- [ ] Add PriceChart component (Chart.js/Recharts)
- [ ] Add VolumeChart component
- [ ] Implement search functionality
- [ ] Add loading states and error handling
- [ ] Make UI responsive

### **Phase 5: Documentation (Days 10-11)**
- [ ] Write project description (~1 page)
- [ ] Write requirements specification (5-10 pages)
- [ ] Create architecture diagrams
- [ ] Document API research and selection
- [ ] Write README.md with setup instructions
- [ ] Add code comments

### **Phase 6: Optimization & Testing (Days 12-13)**
- [ ] Optimize pipeline performance (parallel processing, batching)
- [ ] Implement rate limiting
- [ ] Add caching layer
- [ ] Test with different crypto symbols
- [ ] Test edge cases (missing data, API failures)
- [ ] Run performance benchmark
- [ ] Fix bugs

### **Phase 7: Deployment (Day 14)**
- [ ] Deploy to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Setup Vercel Cron job
- [ ] Verify production deployment works
- [ ] Test live site
- [ ] Prepare presentation demo

---

## 🚨 COMMON PITFALLS TO AVOID

1. **API Rate Limiting**
   - Don't make requests too fast
   - Implement proper delays between calls
   - Use CCXT's built-in rate limiting

2. **Database Connection Limits**
   - Use connection pooling
   - Close connections properly
   - Don't open new connection for each query

3. **Memory Issues**
   - Don't load all data into memory at once
   - Process data in batches
   - Stream large responses

4. **Date/Time Handling**
   - Always use UTC timezone
   - Be careful with JavaScript Date vs timestamps
   - Handle timezone conversions correctly

5. **Symbol Format Inconsistencies**
   - CoinGecko uses "bitcoin", Binance uses "BTCUSDT"
   - Maintain symbol mapping table
   - Normalize symbols before querying

6. **Error Handling**
   - Don't fail entire pipeline on single error
   - Log errors but continue processing
   - Implement retry logic

7. **Missing Data**
   - Some cryptos don't have 10 years of data
   - Handle gracefully (download max available)
   - Don't assume all APIs return same data

---

## 💡 HELPFUL RESOURCES

### **Documentation**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- CCXT: https://docs.ccxt.com/
- Binance API: https://binance-docs.github.io/apidocs/
- CoinGecko API: https://www.coingecko.com/en/api/documentation
- Vercel Deployment: https://vercel.com/docs

### **Libraries**
- Chart.js: https://www.chartjs.org/
- Recharts: https://recharts.org/
- p-queue: https://github.com/sindresorhus/p-queue
- date-fns: https://date-fns.org/

### **Tools**
- Supabase Studio (database GUI)
- Postman/Thunder Client (API testing)
- Vercel Analytics (performance monitoring)

---

## 🎓 GRADING CRITERIA (IMPORTANT!)

### **What Professors Will Evaluate:**

1. **Architecture Quality (30%)**
   - Proper implementation of Pipe and Filter pattern
   - Clear separation of concerns
   - Modularity and reusability
   - Code organization

2. **Functionality (25%)**
   - All 3 filters working correctly
   - Complete data collection (top 1000 cryptos)
   - Proper data validation and filtering
   - Error handling

3. **Documentation (20%)**
   - Clear project description
   - Complete requirements specification
   - Architecture diagrams
   - Code comments

4. **Performance (15%)**
   - Pipeline execution speed (bonus challenge)
   - Efficient database operations
   - Proper use of async/parallel processing

5. **Presentation (10%)**
   - Live demo
   - Clear explanation of architecture
   - Q&A responses

---

## 🎯 SUCCESS CRITERIA

Your project will be considered successful when:

✅ Pipeline automatically downloads and processes top 1000 cryptos
✅ Database contains minimum 10 years of OHLCV data per crypto
✅ All 3 filters are implemented and working
✅ Filters are properly connected in a pipe
✅ Data is validated and formatted correctly
✅ System handles errors gracefully
✅ Documentation is complete and clear
✅ Code is pushed to GitLab FINKI
✅ Live demo works without issues
✅ Performance is optimized (bonus points)

---

## 🚀 GETTING STARTED

### **Immediate Next Steps:**

1. **Read this entire document carefully**
2. **Form your team (max 3 members)**
3. **Create GitLab FINKI repository**
4. **Setup development environment:**
   ```bash
   npx create-next-app@latest crypto-exchange-analyzer --typescript --tailwind --app
   cd crypto-exchange-analyzer
   npm install ccxt @supabase/supabase-js chart.js p-queue
   ```
5. **Create Supabase account and project**
6. **Start with Filter 1 implementation**
7. **Test each filter independently before connecting**
8. **Document as you go**

---

## 📞 WHEN YOU NEED HELP

**Use me (Claude) by providing this prompt:**

```
I'm working on the Crypto Exchange Analyzer project for Software Design and Architecture course.
[Describe your specific issue/question]

For context, refer to the PROJECT_PLAN_CRYPTO_TRACKER.md file which contains:
- Full project requirements
- Technology stack (Next.js, Supabase, Binance API)
- Pipe and Filter architecture details
- Database schema
- Performance optimization strategies

I need help with [specific task/problem].
```

---

## ✅ FINAL NOTES

- **Don't procrastinate!** This is a substantial project
- **Test frequently** - don't wait until the end
- **Commit regularly** to Git
- **Ask for help early** if stuck
- **Focus on architecture quality** - that's what matters most
- **Document everything** - you'll need it for presentation
- **Have fun!** This is a real-world applicable skill

---

**Good luck! 🚀 You've got this!**

---

_Last updated: 2024-11-19_
_For: MSE Finance Tracker Team - New Crypto Project_
_Course: Software Design and Architecture - FINKI UKIM_
