"""
Daily Update Script for Crypto Tracker
=======================================
Automatically runs daily to:
1. Fetch top 1000 coins from CoinGecko
2. Update rankings if changed
3. For each coin, check last_sync_date
4. Fetch missing days (only what's needed)
5. Try Binance first, fallback to CoinGecko

Designed to run as cron job daily at 00:00
"""

import ccxt
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from supabase import create_client, Client
from tqdm import tqdm
import config

# Initialize Supabase
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

# Initialize exchanges
binance = ccxt.binance({'enableRateLimit': True})


def get_top_1000_from_coingecko() -> List[Dict]:
    """
    Fetch top 1000 coins from CoinGecko with their current ranking

    Returns:
        List of dicts with: id, symbol, name, rank
    """
    print("\n📥 Fetching top 1000 coins from CoinGecko...")

    coins = []
    per_page = 250
    pages = 4  # 4 pages x 250 = 1000

    for page in range(1, pages + 1):
        url = (
            f"https://api.coingecko.com/api/v3/coins/markets"
            f"?vs_currency=usd&order=market_cap_desc&per_page={per_page}&page={page}"
        )

        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            data = resp.json()

            for idx, coin in enumerate(data):
                coins.append({
                    'coingecko_id': coin['id'],
                    'symbol': coin['symbol'].upper(),
                    'name': coin['name'],
                    'rank': (page - 1) * per_page + idx + 1
                })

            time.sleep(1.2)  # Rate limiting

        except Exception as e:
            print(f"   ⚠️  Error fetching page {page}: {e}")
            continue

    print(f"   ✅ Retrieved {len(coins)} coins")
    return coins[:1000]


def create_coingecko_binance_mapping() -> Dict[str, Optional[str]]:
    """
    Create mapping from CoinGecko ID to Binance symbol

    Returns:
        Dict: {coingecko_id: binance_symbol or None}
    """
    print("\n🔗 Creating CoinGecko → Binance mapping...")

    # Get all Binance USDT markets
    binance_markets = binance.load_markets()
    binance_bases = set()

    for market, info in binance_markets.items():
        if info.get('quote') == 'USDT':
            binance_bases.add(info.get('base').lower())

    print(f"   → Found {len(binance_bases)} Binance USDT pairs")

    # Get CoinGecko coins
    coins = get_top_1000_from_coingecko()

    mapping = {}
    for coin in coins:
        symbol_lower = coin['symbol'].lower()

        if symbol_lower in binance_bases:
            mapping[coin['coingecko_id']] = coin['symbol'] + 'USDT'
        else:
            mapping[coin['coingecko_id']] = None

    return mapping, coins


def update_rankings(coins: List[Dict], mapping: Dict[str, Optional[str]]):
    """
    Update crypto_metadata with new rankings and symbols

    Args:
        coins: List of coins from CoinGecko
        mapping: CoinGecko ID to Binance symbol mapping
    """
    print("\n📊 Updating rankings in database...")

    updated_count = 0
    new_count = 0

    for coin in tqdm(coins, desc="Updating metadata"):
        binance_symbol = mapping.get(coin['coingecko_id'])

        # Check if coin exists
        existing = supabase.table('crypto_metadata') \
            .select('id, rank') \
            .eq('symbol', coin['symbol']) \
            .execute()

        metadata = {
            'symbol': coin['symbol'],
            'name': coin['name'],
            'rank': coin['rank'],
            'coingecko_id': coin['coingecko_id'],
            'binance_symbol': binance_symbol,
            'is_active': True,
            'updated_at': datetime.now().isoformat()
        }

        if existing.data and len(existing.data) > 0:
            # Update existing
            if existing.data[0]['rank'] != coin['rank']:
                supabase.table('crypto_metadata') \
                    .update(metadata) \
                    .eq('symbol', coin['symbol']) \
                    .execute()
                updated_count += 1
        else:
            # Insert new
            supabase.table('crypto_metadata').insert(metadata).execute()
            new_count += 1

    print(f"   ✅ Updated: {updated_count}, New: {new_count}")


def get_coins_needing_update() -> List[Dict]:
    """
    Get all coins that need data updates

    Returns:
        List of dicts with: symbol, name, coingecko_id, binance_symbol, last_sync_date
    """
    print("\n🔍 Checking which coins need updates...")

    # Get all active coins
    response = supabase.table('crypto_metadata') \
        .select('symbol, name, coingecko_id, binance_symbol, last_sync_date') \
        .eq('is_active', True) \
        .execute()

    coins_to_update = []
    today = datetime.now().date()

    for coin in response.data:
        last_sync = coin.get('last_sync_date')

        if last_sync is None:
            # No data yet - need initial fetch
            days_missing = config.DAYS_OF_HISTORY
            start_date = today - timedelta(days=days_missing)
        else:
            # Calculate days missing
            last_sync_date = datetime.strptime(last_sync, '%Y-%m-%d').date()
            days_missing = (today - last_sync_date).days
            start_date = last_sync_date + timedelta(days=1)

        if days_missing > 0:
            coins_to_update.append({
                'symbol': coin['symbol'],
                'name': coin.get('name', coin['symbol']),
                'coingecko_id': coin['coingecko_id'],
                'binance_symbol': coin['binance_symbol'],
                'last_sync_date': last_sync,
                'days_missing': days_missing,
                'start_date': start_date,
                'end_date': today
            })

    print(f"   → {len(coins_to_update)} coins need updates")
    return coins_to_update


def fetch_from_binance(symbol: str, start_date: datetime.date, end_date: datetime.date) -> Optional[List]:
    """
    Fetch OHLCV data from Binance

    Args:
        symbol: Binance symbol (e.g., "BTCUSDT")
        start_date: Start date
        end_date: End date

    Returns:
        List of OHLCV candles or None if failed
    """
    try:
        since = int(datetime.combine(start_date, datetime.min.time()).timestamp() * 1000)

        candles = binance.fetch_ohlcv(
            symbol,
            timeframe='1d',
            since=since,
            limit=1000
        )

        return candles if candles else None

    except Exception as e:
        return None


def fetch_from_coingecko(coingecko_id: str, start_date: datetime.date, end_date: datetime.date) -> Optional[List]:
    """
    Fetch OHLCV data from CoinGecko

    Args:
        coingecko_id: CoinGecko ID (e.g., "bitcoin")
        start_date: Start date
        end_date: End date

    Returns:
        List of OHLCV candles in CCXT format or None if failed
    """
    try:
        from_timestamp = int(datetime.combine(start_date, datetime.min.time()).timestamp())
        to_timestamp = int(datetime.combine(end_date, datetime.min.time()).timestamp())

        url = (
            f"https://api.coingecko.com/api/v3/coins/{coingecko_id}/market_chart/range"
            f"?vs_currency=usd&from={from_timestamp}&to={to_timestamp}"
        )

        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        if 'prices' not in data:
            return None

        # Convert to CCXT format: [timestamp, open, high, low, close, volume]
        candles = []
        prices = data['prices']
        volumes = data.get('total_volumes', [])

        for i, (ts, price) in enumerate(prices):
            volume = volumes[i][1] if i < len(volumes) else 0

            candles.append([
                int(ts),
                float(price),  # open (approx)
                float(price),  # high (approx)
                float(price),  # low (approx)
                float(price),  # close
                float(volume)
            ])

        return candles

    except Exception as e:
        return None


def save_ohlcv_data(symbol: str, name: str, candles: List, exchange: str, start_date: datetime.date, end_date: datetime.date):
    """
    Save OHLCV data to database

    Args:
        symbol: Crypto symbol (e.g., "BTC")
        name: Crypto name (e.g., "Bitcoin")
        candles: List of OHLCV candles
        exchange: Exchange name ("binance" or "coingecko")
        start_date: Start date
        end_date: End date
    """
    records = []

    for candle in candles:
        candle_date = datetime.fromtimestamp(candle[0] / 1000).date()

        # Only include records within date range
        if candle_date < start_date or candle_date > end_date:
            continue

        # Handle potential overflow for numeric(20, 8) fields
        # Max value: 10^12 (999999999999.99999999)
        def safe_numeric(value, max_val=999999999999.0):
            """Cap values to prevent numeric overflow"""
            try:
                val = float(value)
                if val > max_val:
                    return max_val
                if val < -max_val:
                    return -max_val
                return val
            except:
                return 0.0

        records.append({
            'symbol': symbol,
            'name': name,
            'date': candle_date.isoformat(),
            'open': safe_numeric(candle[1]),
            'high': safe_numeric(candle[2]),
            'low': safe_numeric(candle[3]),
            'close': safe_numeric(candle[4]),
            'volume': safe_numeric(candle[5]),
            'exchange': exchange,
            'quote_currency': 'USDT' if exchange == 'binance' else 'USD',
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })

    if records:
        try:
            # Upsert to avoid duplicates
            supabase.table('crypto_data').upsert(
                records,
                on_conflict='symbol,date,exchange'
            ).execute()

            # Update last_sync_date in metadata
            supabase.table('crypto_metadata').update({
                'last_sync_date': end_date.isoformat(),
                'total_records': len(records),
                'updated_at': datetime.now().isoformat()
            }).eq('symbol', symbol).execute()

            return len(records)

        except Exception as e:
            print(f"      ⚠️  Error saving {symbol}: {e}")
            return 0

    return 0


def update_coin_data(coin: Dict) -> Dict:
    """
    Update data for a single coin

    Args:
        coin: Dict with symbol, coingecko_id, binance_symbol, start_date, end_date

    Returns:
        Dict with status
    """
    symbol = coin['symbol']
    binance_symbol = coin['binance_symbol']
    coingecko_id = coin['coingecko_id']
    start_date = coin['start_date']
    end_date = coin['end_date']

    candles = None
    exchange = None

    # Try Binance first
    if binance_symbol:
        candles = fetch_from_binance(binance_symbol, start_date, end_date)
        if candles:
            exchange = 'binance'

    # Fallback to CoinGecko
    if not candles and coingecko_id:
        candles = fetch_from_coingecko(coingecko_id, start_date, end_date)
        if candles:
            exchange = 'coingecko'

    if not candles:
        return {'symbol': symbol, 'success': False, 'records': 0, 'exchange': None}

    # Save to database
    records_saved = save_ohlcv_data(symbol, coin['name'], candles, exchange, start_date, end_date)

    return {
        'symbol': symbol,
        'success': True,
        'records': records_saved,
        'exchange': exchange
    }


def main():
    """
    Main function for daily update
    """
    print("\n" + "="*60)
    print("🚀 DAILY CRYPTO DATA UPDATE")
    print("="*60)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Step 1: Get top 1000 and create mapping
        mapping, coins = create_coingecko_binance_mapping()

        # Step 2: Update rankings
        update_rankings(coins, mapping)

        # Step 3: Get coins needing updates
        coins_to_update = get_coins_needing_update()

        if not coins_to_update:
            print("\n✅ All coins are up-to-date!")
            return

        # Step 4: Update each coin
        print(f"\n🔄 Updating {len(coins_to_update)} coins...")

        stats = {
            'success': 0,
            'failed': 0,
            'total_records': 0,
            'binance': 0,
            'coingecko': 0
        }

        for coin in tqdm(coins_to_update, desc="Fetching data"):
            result = update_coin_data(coin)

            if result['success']:
                stats['success'] += 1
                stats['total_records'] += result['records']

                if result['exchange'] == 'binance':
                    stats['binance'] += 1
                elif result['exchange'] == 'coingecko':
                    stats['coingecko'] += 1
            else:
                stats['failed'] += 1

            # Rate limiting
            time.sleep(0.1)

        # Print summary
        print("\n" + "="*60)
        print("📊 DAILY UPDATE SUMMARY")
        print("="*60)
        print(f"✅ Success: {stats['success']}")
        print(f"❌ Failed: {stats['failed']}")
        print(f"💾 Total records saved: {stats['total_records']:,}")
        print(f"📈 From Binance: {stats['binance']}")
        print(f"🦎 From CoinGecko: {stats['coingecko']}")
        print("="*60)

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        raise


if __name__ == "__main__":
    main()
