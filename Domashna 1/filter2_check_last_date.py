"""
Filter 2: Check Last Available Date
Queries Supabase database to find the last date of available data for each symbol
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
from supabase import create_client, Client
from tqdm import tqdm
import config

# Initialize Supabase client
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)


def get_last_sync_date(symbol: str) -> Optional[datetime]:
    """
    Query database for the last date we have data for this symbol

    Args:
        symbol: Cryptocurrency symbol (e.g., 'BTC')

    Returns:
        Last date with data, or None if no data exists
    """
    try:
        # Query crypto_data table for max date
        response = supabase.table('crypto_data') \
            .select('date') \
            .eq('symbol', symbol) \
            .order('date', desc=True) \
            .limit(1) \
            .execute()

        if response.data and len(response.data) > 0:
            last_date_str = response.data[0]['date']
            # Parse date string to datetime
            return datetime.strptime(last_date_str, '%Y-%m-%d')
        else:
            return None

    except Exception as e:
        print(f"  ⚠️  Error querying {symbol}: {e}")
        return None


def calculate_download_range(symbol: str, last_date: Optional[datetime]) -> Dict:
    """
    Calculate what date range needs to be downloaded

    Args:
        symbol: Cryptocurrency symbol
        last_date: Last date with existing data (or None)

    Returns:
        Dictionary with download information
    """
    today = datetime.now()

    if last_date is None:
        # No existing data - need full history
        start_date = today - timedelta(days=config.DAYS_OF_HISTORY)
        days_missing = config.DAYS_OF_HISTORY
        download_type = "full_history"
    else:
        # Has existing data - only download missing days
        start_date = last_date + timedelta(days=1)
        days_missing = (today - last_date).days
        download_type = "incremental"

    return {
        'start_date': start_date,
        'end_date': today,
        'days_missing': days_missing,
        'download_type': download_type
    }


def update_metadata_table(symbol_data: Dict):
    """
    Update or insert cryptocurrency metadata in crypto_metadata table

    Args:
        symbol_data: Dictionary containing symbol information
    """
    try:
        metadata = {
            'symbol': symbol_data['symbol'],
            'name': symbol_data['name'],
            'rank': symbol_data.get('rank', 0),
            'coingecko_id': symbol_data.get('coingecko_id', ''),
            'is_active': True,
            'updated_at': datetime.now().isoformat()
        }

        # Try to upsert (insert or update if exists)
        response = supabase.table('crypto_metadata').upsert(
            metadata,
            on_conflict='symbol'
        ).execute()

    except Exception as e:
        print(f"  ⚠️  Error updating metadata for {symbol_data['symbol']}: {e}")


def filter2_check_last_date(symbols_list: List[Dict]) -> List[Dict]:
    """
    Main function for Filter 2
    Checks database for last available date for each symbol

    Args:
        symbols_list: List of symbol dictionaries from Filter 1

    Returns:
        List of symbols with date range information
    """
    print("\n" + "="*60)
    print("📅 FILTER 2: CHECK LAST AVAILABLE DATE")
    print("="*60)

    symbols_with_dates = []
    stats = {
        'full_history': 0,
        'incremental': 0,
        'up_to_date': 0,
        'total_days_to_fetch': 0
    }

    print(f"\n🔍 Checking database for {len(symbols_list)} symbols...")

    for symbol_data in tqdm(symbols_list, desc="Checking dates", ncols=80):
        symbol = symbol_data['symbol']

        # Get last sync date from database
        last_date = get_last_sync_date(symbol)

        # Calculate download range
        download_info = calculate_download_range(symbol, last_date)

        # Combine symbol data with download info
        symbol_with_date = {
            **symbol_data,
            'last_date': last_date.strftime('%Y-%m-%d') if last_date else None,
            'start_date': download_info['start_date'].strftime('%Y-%m-%d'),
            'end_date': download_info['end_date'].strftime('%Y-%m-%d'),
            'days_missing': download_info['days_missing'],
            'download_type': download_info['download_type']
        }

        symbols_with_dates.append(symbol_with_date)

        # Update statistics
        if download_info['days_missing'] == 0:
            stats['up_to_date'] += 1
        elif download_info['download_type'] == 'full_history':
            stats['full_history'] += 1
        else:
            stats['incremental'] += 1

        stats['total_days_to_fetch'] += download_info['days_missing']

        # Update metadata table
        update_metadata_table(symbol_data)

    # Print summary
    print("\n" + "="*60)
    print("📊 FILTER 2 SUMMARY")
    print("="*60)
    print(f"📊 Total symbols: {len(symbols_with_dates)}")
    print(f"🆕 Need full history ({config.YEARS_OF_HISTORY} years): {stats['full_history']}")
    print(f"📈 Need incremental update: {stats['incremental']}")
    print(f"✅ Already up-to-date: {stats['up_to_date']}")
    print(f"📅 Total days to fetch: {stats['total_days_to_fetch']:,}")
    print(f"📦 Estimated API calls: ~{stats['total_days_to_fetch'] // 1000 + len(symbols_with_dates):,}")

    # Show examples
    print(f"\n📋 Sample symbols needing full history:")
    full_history_samples = [s for s in symbols_with_dates if s['download_type'] == 'full_history'][:3]
    for sample in full_history_samples:
        print(f"   - {sample['symbol']:8} ({sample['name'][:20]:20}) - {sample['days_missing']:,} days")

    if stats['incremental'] > 0:
        print(f"\n📋 Sample symbols needing incremental update:")
        incremental_samples = [s for s in symbols_with_dates if s['download_type'] == 'incremental'][:3]
        for sample in incremental_samples:
            print(f"   - {sample['symbol']:8} ({sample['name'][:20]:20}) - {sample['days_missing']} days (from {sample['last_date']})")

    print("="*60 + "\n")

    return symbols_with_dates


if __name__ == "__main__":
    # Test Filter 2 independently
    import json

    # Load Filter 1 output
    try:
        with open('filter1_output.json', 'r') as f:
            symbols = json.load(f)
    except FileNotFoundError:
        print("❌ filter1_output.json not found. Run filter1_get_symbols.py first.")
        exit(1)

    # Run Filter 2
    symbols_with_dates = filter2_check_last_date(symbols)

    # Save output
    with open('filter2_output.json', 'w') as f:
        json.dump(symbols_with_dates, f, indent=2)

    print(f"✅ Filter 2 completed successfully!")
    print(f"💾 Saved output to filter2_output.json")
