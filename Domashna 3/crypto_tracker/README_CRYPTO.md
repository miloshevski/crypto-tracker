# 🚀 Crypto Exchange Analyzer - Next.js Frontend

A modern, responsive web application for visualizing cryptocurrency data from Supabase database.

---

## 🎯 Features

### **Main Page (List View)**
- ✅ Display top 1000 cryptocurrencies
- ✅ Real-time search by symbol or name
- ✅ Sortable columns (Rank, Price, 24h Change, Market Cap, Volume)
- ✅ Responsive table design
- ✅ Direct links to individual coin charts

### **Coin Detail Page (Chart View)**
- ✅ Interactive OHLCV charts
- ✅ Multiple time intervals:
  - Last Week
  - Last Month
  - Last Year
  - 5 Years
  - Max (All available data)
- ✅ Multiple chart types:
  - **Line Chart** - Simple price tracking
  - **Candlestick Chart (OHLC)** - Professional trader view with Open, High, Low, Close
  - **Area Chart** - Beautiful gradient visualization
  - **Volume Chart** - Trading volume bars
- ✅ Real-time OHLC stats display (Open, High, Low, Close)
- ✅ Responsive design for mobile/tablet/desktop

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript (React 19)
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Data Fetching:** Next.js API Routes

---

## 📁 Project Structure

```
crypto_tracker/
├── src/
│   ├── app/
│   │   ├── page.js                    # Main page (coin list)
│   │   ├── coin/
│   │   │   └── [symbol]/
│   │   │       └── page.js            # Individual coin page with charts
│   │   ├── api/
│   │   │   ├── coins/
│   │   │   │   ├── route.js           # GET /api/coins - Fetch all coins
│   │   │   │   └── [symbol]/
│   │   │   │       └── route.js       # GET /api/coins/:symbol?interval=week
│   │   ├── layout.js
│   │   └── globals.css
│   └── lib/
│       └── supabase.js                # Supabase client configuration
├── .env.local                          # Environment variables
├── package.json
└── README_CRYPTO.md                    # This file
```

---

## 🚀 Setup & Installation

### **1. Prerequisites**
- Node.js 18+ installed
- Supabase account with populated `crypto_data` table
- Environment variables ready

### **2. Install Dependencies**

```bash
cd "Domashna 3/crypto_tracker"
npm install
```

**Installed packages:**
- `next` - Next.js framework
- `react` & `react-dom` - React library
- `@supabase/supabase-js` - Supabase client
- `recharts` - Chart library
- `tailwindcss` - CSS framework

### **3. Configure Environment Variables**

Create `.env.local` file (already created):

```env
NEXT_PUBLIC_SUPABASE_URL=https://cltfyqlnckzlfttqcpve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### **4. Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Pages & Routes

### **Main Page: `/`**
**URL:** `http://localhost:3000`

**Features:**
- Table of top 1000 cryptocurrencies
- Search functionality
- Sortable columns
- "View Chart" button for each coin

**Data Source:** `/api/coins`
- Fetches from Supabase view: `latest_crypto_prices`
- Returns latest price, market cap, volume, 24h change

### **Coin Detail Page: `/coin/[symbol]`**
**URL:** `http://localhost:3000/coin/BTC`

**Features:**
- Time interval selector (Week, Month, Year, 5 Years, Max)
- Chart type selector (Line, Candlestick, Area, Volume)
- OHLC stats cards
- Interactive Recharts visualizations

**Data Source:** `/api/coins/[symbol]?interval=max`
- Fetches from Supabase table: `crypto_data`
- Filters by symbol and date range
- Returns OHLCV data for charting

---

## 📊 API Endpoints

### **GET /api/coins**
Fetch top 1000 cryptocurrencies with latest prices.

**Response:**
```json
{
  "coins": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "rank": 1,
      "current_price": 43500.50,
      "change_24h_percent": 2.5,
      "market_cap": 850000000000,
      "volume": 25000000000,
      "date": "2024-11-20"
    }
  ]
}
```

### **GET /api/coins/[symbol]?interval=week**
Fetch OHLCV data for a specific cryptocurrency.

**Parameters:**
- `symbol` (path) - Cryptocurrency symbol (e.g., BTC, ETH)
- `interval` (query) - Time interval: `week`, `month`, `year`, `5years`, `max`

**Response:**
```json
{
  "data": [
    {
      "date": "2024-11-13",
      "open": 42000.00,
      "high": 43500.00,
      "low": 41800.00,
      "close": 43200.00,
      "volume": 28000000000,
      "symbol": "BTC",
      "exchange": "binance"
    }
  ]
}
```

---

## 🎯 Chart Types Explained

### **1. Line Chart**
- **Best for:** Quick price overview
- **Shows:** Closing prices over time
- **Use case:** Daily price tracking

### **2. Candlestick Chart (OHLC)**
- **Best for:** Professional trading analysis
- **Shows:** Open, High, Low, Close prices with color coding
- **Use case:** Identifying price patterns and trends
- **Colors:**
  - 🟠 Orange - Open price
  - 🟢 Green - High price
  - 🔴 Red - Low price
  - 🔵 Blue - Close price

### **3. Area Chart**
- **Best for:** Visual appeal and trend visualization
- **Shows:** Closing prices with gradient fill
- **Use case:** Presentations and reports

### **4. Volume Chart**
- **Best for:** Trading volume analysis
- **Shows:** Daily trading volume as bars
- **Use case:** Understanding market activity

---

## 🔧 Customization

### **Change Number of Coins Displayed**

Edit `src/app/api/coins/route.js`:

```javascript
.limit(1000)  // Change to 100, 500, or any number
```

### **Add More Chart Types**

Add to `src/app/coin/[symbol]/page.js`:

```javascript
const chartTypes = [
  // ... existing types
  { value: 'combined', label: 'Price + Volume' },
];
```

### **Customize Colors**

Edit Tailwind classes in components:
- `bg-gray-900` - Background color
- `text-blue-400` - Text/link color
- `bg-green-600` - Positive change color

---

## 🎓 Database Requirements

The app expects these Supabase structures:

### **View: `latest_crypto_prices`**
```sql
CREATE VIEW latest_crypto_prices AS
SELECT DISTINCT ON (symbol)
  symbol,
  name,
  date,
  close AS current_price,
  volume,
  market_cap,
  rank,
  change_24h_percent
FROM crypto_data
WHERE is_active = true
ORDER BY symbol, date DESC;
```

### **Table: `crypto_data`**
Columns used:
- `symbol` - Crypto symbol (BTC, ETH, etc.)
- `name` - Full name
- `date` - Date of data point
- `open`, `high`, `low`, `close` - OHLC prices
- `volume` - Trading volume
- `market_cap` - Market capitalization
- `rank` - Market cap rank
- `change_24h_percent` - 24h price change
- `exchange` - Data source (binance, coinbase, kraken)

---

## 🚀 Deployment

### **Vercel (Recommended)**

1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

**URL:** `https://your-project.vercel.app`

### **Build for Production**

```bash
npm run build
npm start
```

---

## 🐛 Troubleshooting

### **"No coins displayed"**
- Check Supabase connection
- Verify `latest_crypto_prices` view exists
- Check browser console for errors
- Ensure `.env.local` has correct credentials

### **"No data available for this time period"**
- Crypto might not have historical data for that interval
- Try "Max" interval to see all available data
- Check Supabase for actual data

### **Charts not rendering**
- Verify `recharts` is installed: `npm list recharts`
- Check browser console for errors
- Ensure data has `date`, `open`, `high`, `low`, `close`, `volume` fields

---

## 📝 Future Enhancements

**Potential features to add:**
- [ ] User authentication (Supabase Auth)
- [ ] Watchlist/favorites
- [ ] Price alerts
- [ ] Comparison charts (multiple coins)
- [ ] Export data to CSV
- [ ] Dark/light theme toggle
- [ ] Real-time updates (websockets)
- [ ] Portfolio tracking
- [ ] News integration
- [ ] Mobile app (React Native)

---

## 🎯 Assignment Requirements Met

✅ **Display top 1000 coins** - Main page table
✅ **Graph with different intervals** - Week, Month, Year, 5Y, Max
✅ **OHLCV chart display** - Candlestick chart shows all 4 values
✅ **Button to view chart** - "View Chart" on each coin row
✅ **Responsive design** - Works on mobile, tablet, desktop
✅ **Data from Supabase** - Real-time database integration

---

## 👥 Credits

**Project:** Crypto Exchange Analyzer
**Course:** Software Design and Architecture - FINKI UKIM
**Year:** 2024/2025
**Tech Stack:** Next.js + Supabase + Recharts

---

**Enjoy exploring the crypto market data! 🚀📈**
