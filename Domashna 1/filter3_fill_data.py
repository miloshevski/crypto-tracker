"""
Filter 3: Fill Missing Data
Downloads historical OHLCV data from Binance and populates the database
"""

import ccxt
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from supabase import create_client, Client
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import config

# Initialize Supabase client
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

# Initialize multiple exchanges via CCXT for better coverage
exchanges = {
    'binance': ccxt.binance({'enableRateLimit': True, 'options': {'defaultType': 'spot'}}),
    'coinbase': ccxt.coinbase({'enableRateLimit': True}),
    'kraken': ccxt.kraken({'enableRateLimit': True}),
}

# Priority order for exchanges (try in this order)
EXCHANGE_PRIORITY = ['binance', 'coinbase', 'kraken']


def get_binance_symbol(symbol: str) -> str:
    """
    Convert our symbol format to Binance format

    Args:
        symbol: Our symbol (e.g., 'BTC')

    Returns:
        Binance symbol format (e.g., 'BTC/USDT')
    """
    return f"{symbol}/{config.BINANCE_QUOTE_CURRENCY}"


def fetch_ohlcv_data(symbol: str, start_date: datetime, end_date: datetime) -> tuple[List[List], str]:
    """
    Fetch OHLCV data from multiple exchanges (tries Binance, Coinbase, Kraken in order)

    Args:
        symbol: Cryptocurrency symbol (e.g., 'BTC')
        start_date: Start date for data
        end_date: End date for data

    Returns:
        Tuple of (List of OHLCV candles, exchange_name that succeeded)
    """
    # Convert datetime to milliseconds timestamp
    since = int(start_date.timestamp() * 1000)
    end = int(end_date.timestamp() * 1000)
    limit = 1000
    timeframe = '1d'  # Daily candles

    # Try each exchange in priority order
    for exchange_name in EXCHANGE_PRIORITY:
        exchange_client = exchanges[exchange_name]
        all_candles = []

        try:
            # Determine symbol format for this exchange
            if exchange_name == 'binance':
                trading_symbol = f"{symbol}/USDT"
            elif exchange_name == 'coinbase':
                trading_symbol = f"{symbol}/USD"
            elif exchange_name == 'kraken':
                trading_symbol = f"{symbol}/USD"
            else:
                trading_symbol = f"{symbol}/USDT"

            current_since = since

            while current_since < end:
                try:
                    # Fetch OHLCV data
                    candles = exchange_client.fetch_ohlcv(
                        trading_symbol,
                        timeframe=timeframe,
                        since=current_since,
                        limit=limit
                    )

                    if not candles:
                        break

                    all_candles.extend(candles)

                    # Update since to the last candle's timestamp + 1 day
                    current_since = candles[-1][0] + (24 * 60 * 60 * 1000)

                    # If we got less than limit, we've reached the end
                    if len(candles) < limit:
                        break

                    # Small delay to respect rate limits
                    time.sleep(config.BINANCE_RATE_LIMIT_DELAY)

                except ccxt.RequestTimeout:
                    time.sleep(2)
                    continue

                except ccxt.NetworkError as e:
                    time.sleep(5)
                    continue

            # If we got data, return it with the exchange name
            if all_candles:
                return all_candles, exchange_name

        except ccxt.BadSymbol:
            # Symbol not found on this exchange, try next one
            continue

        except Exception as e:
            # Other error on this exchange, try next one
            continue

    # No exchange had the symbol
    return [], None


def transform_ohlcv_to_db_format(symbol: str, symbol_name: str, candles: List[List], exchange_name: str = 'binance') -> List[Dict]:
    """
    Transform OHLCV candles to database format

    Args:
        symbol: Cryptocurrency symbol
        symbol_name: Cryptocurrency name
        candles: List of OHLCV candles from exchange

    Returns:
        List of dictionaries ready for database insertion
    """
    records = []

    for candle in candles:
        # CCXT format: [timestamp, open, high, low, close, volume]
        timestamp = candle[0]
        date = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')

        # Determine quote currency based on exchange
        quote_currency = 'USDT' if exchange_name == 'binance' else 'USD'

        record = {
            'symbol': symbol,
            'name': symbol_name,
            'date': date,
            'open': float(candle[1]),
            'high': float(candle[2]),
            'low': float(candle[3]),
            'close': float(candle[4]),
            'volume': float(candle[5]),
            'exchange': exchange_name,
            'quote_currency': quote_currency,
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

        records.append(record)

    return records


def insert_batch_to_db(records: List[Dict]) -> tuple[int, int]:
    """
    Insert batch of records to database using upsert (insert or update on conflict)

    Args:
        records: List of record dictionaries

    Returns:
        Tuple of (inserted_count, updated_count)
    """
    if not records:
        return 0, 0

    try:
        # Upsert records (insert new, update existing based on unique constraint)
        response = supabase.table('crypto_data').upsert(
            records,
            on_conflict='symbol,date,exchange'
        ).execute()

        # Supabase doesn't differentiate between insert/update in response,
        # so we return total count
        return len(records), 0

    except Exception as e:
        print(f"    ❌ Error inserting batch: {e}")
        return 0, 0


def update_metadata_sync_status(symbol: str, last_sync_date: datetime, total_records: int):
    """
    Update crypto_metadata table with sync status

    Args:
        symbol: Cryptocurrency symbol
        last_sync_date: Last date that was synced
        total_records: Total number of records for this symbol
    """
    try:
        update_data = {
            'symbol': symbol,
            'last_sync_date': last_sync_date.strftime('%Y-%m-%d'),
            'total_records': total_records,
            'updated_at': datetime.now().isoformat()
        }

        supabase.table('crypto_metadata').upsert(
            update_data,
            on_conflict='symbol'
        ).execute()

    except Exception as e:
        print(f"    ⚠️  Error updating metadata for {symbol}: {e}")


def process_single_symbol(symbol_data: Dict) -> Dict:
    """
    Process a single cryptocurrency symbol - fetch and insert data

    Args:
        symbol_data: Dictionary with symbol information and date range

    Returns:
        Dictionary with processing results
    """
    symbol = symbol_data['symbol']
    name = symbol_data['name']
    start_date_str = symbol_data['start_date']
    end_date_str = symbol_data['end_date']
    days_missing = symbol_data['days_missing']

    result = {
        'symbol': symbol,
        'success': False,
        'records_inserted': 0,
        'error': None
    }

    # Skip if already up-to-date
    if days_missing == 0:
        result['success'] = True
        return result

    try:
        # Parse dates
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')

        # Fetch OHLCV data from multiple exchanges
        candles, exchange_used = fetch_ohlcv_data(symbol, start_date, end_date)

        if not candles or not exchange_used:
            result['error'] = "No data available from any exchange (Binance, Coinbase, Kraken)"
            return result

        # Transform to database format
        records = transform_ohlcv_to_db_format(symbol, name, candles, exchange_used)

        # Insert in batches
        total_inserted = 0
        for i in range(0, len(records), config.BATCH_SIZE):
            batch = records[i:i + config.BATCH_SIZE]
            inserted, _ = insert_batch_to_db(batch)
            total_inserted += inserted

            # Small delay to prevent socket errors
            time.sleep(0.1)

        # Update metadata
        update_metadata_sync_status(symbol, end_date, len(records))

        result['success'] = True
        result['records_inserted'] = total_inserted

    except Exception as e:
        result['error'] = str(e)

    return result


def filter3_fill_data(symbols_with_dates: List[Dict]) -> Dict:
    """
    Main function for Filter 3
    Downloads and inserts historical data for all symbols using parallel processing

    Args:
        symbols_with_dates: List of symbols with date range information from Filter 2

    Returns:
        Dictionary with processing statistics
    """
    print("\n" + "="*60)
    print("📊 FILTER 3: FILL MISSING DATA (THREADED)")
    print("="*60)

    stats = {
        'total_symbols': len(symbols_with_dates),
        'successful': 0,
        'failed': 0,
        'skipped': 0,
        'total_records_inserted': 0,
        'start_time': datetime.now()
    }

    # Filter out up-to-date symbols
    symbols_to_process = [s for s in symbols_with_dates if s['days_missing'] > 0]
    stats['skipped'] = len(symbols_with_dates) - len(symbols_to_process)

    print(f"\n📥 Processing {len(symbols_to_process)} symbols with {config.MAX_CONCURRENT_REQUESTS} parallel threads...")
    print(f"⏭️  Skipping {stats['skipped']} up-to-date symbols")

    # Process symbols in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=config.MAX_CONCURRENT_REQUESTS) as executor:
        # Submit all tasks
        future_to_symbol = {
            executor.submit(process_single_symbol, symbol_data): symbol_data
            for symbol_data in symbols_to_process
        }

        # Process results as they complete with progress bar
        progress_bar = tqdm(total=len(symbols_to_process), desc="Fetching data", ncols=100)

        for future in as_completed(future_to_symbol):
            symbol_data = future_to_symbol[future]
            symbol = symbol_data['symbol']

            try:
                result = future.result()

                if result['success']:
                    stats['successful'] += 1
                    stats['total_records_inserted'] += result['records_inserted']
                    progress_bar.set_description(f"✅ {symbol:8} ({result['records_inserted']} records)")
                else:
                    stats['failed'] += 1
                    progress_bar.set_description(f"❌ {symbol:8} - {result['error']}")

            except Exception as e:
                stats['failed'] += 1
                progress_bar.set_description(f"❌ {symbol:8} - Exception: {str(e)}")

            progress_bar.update(1)

        progress_bar.close()

    stats['end_time'] = datetime.now()
    stats['duration_seconds'] = (stats['end_time'] - stats['start_time']).total_seconds()

    # Print summary
    print("\n" + "="*60)
    print("📊 FILTER 3 SUMMARY")
    print("="*60)
    print(f"✅ Successfully processed: {stats['successful']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"⏭️  Skipped (up-to-date): {stats['skipped']}")
    print(f"📊 Total records inserted: {stats['total_records_inserted']:,}")
    print(f"⏱️  Duration: {stats['duration_seconds']:.2f} seconds ({stats['duration_seconds']/60:.2f} minutes)")

    if stats['successful'] > 0:
        avg_time_per_symbol = stats['duration_seconds'] / stats['successful']
        print(f"📈 Average time per symbol: {avg_time_per_symbol:.2f} seconds")

    print("="*60 + "\n")

    return stats


if __name__ == "__main__":
    # Test Filter 3 independently
    import json

    # Load Filter 2 output
    try:
        with open('filter2_output.json', 'r') as f:
            symbols_with_dates = json.load(f)
    except FileNotFoundError:
        print("❌ filter2_output.json not found. Run filter2_check_last_date.py first.")
        exit(1)

    # Run Filter 3
    stats = filter3_fill_data(symbols_with_dates)

    # Save stats
    with open('filter3_stats.json', 'w') as f:
        # Convert datetime objects to strings
        stats_serializable = {
            **stats,
            'start_time': stats['start_time'].isoformat(),
            'end_time': stats['end_time'].isoformat()
        }
        json.dump(stats_serializable, f, indent=2)

    print(f"✅ Filter 3 completed successfully!")
    print(f"💾 Saved stats to filter3_stats.json")
