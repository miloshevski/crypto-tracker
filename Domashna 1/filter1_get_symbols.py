"""
Filter 1: Get Top 1000 Crypto Symbols
Fetches top cryptocurrencies from CoinGecko API and filters out invalid ones
"""

import requests
import time
from datetime import datetime
from typing import List, Dict
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed
import config

def fetch_crypto_page(page: int) -> List[Dict]:
    """
    Fetch one page of cryptocurrencies from CoinGecko

    Args:
        page: Page number (1-indexed)

    Returns:
        List of cryptocurrency data dictionaries
    """
    url = f"{config.COINGECKO_BASE_URL}/coins/markets"
    params = {
        'vs_currency': 'usd',
        'order': 'market_cap_desc',
        'per_page': config.PER_PAGE,
        'page': page,
        'sparkline': 'false',
        'locale': 'en'
    }

    try:
        print(f"  📡 Fetching page {page}...")
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        print(f"  ✅ Page {page}: Received {len(data)} cryptos")
        return data
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Error fetching page {page}: {e}")
        return []


def is_valid_crypto(crypto: Dict) -> tuple[bool, str]:
    """
    Validate cryptocurrency based on homework requirements

    Filters out:
    - Delisted coins
    - Low liquidity (volume < threshold)
    - Duplicates (handled by symbol uniqueness)
    - Unstable quote currencies (we only use USD pairs)

    Args:
        crypto: Cryptocurrency data dictionary

    Returns:
        Tuple of (is_valid, reason_if_invalid)
    """
    # Check if required fields exist
    if not crypto.get('symbol') or not crypto.get('name'):
        return False, "Missing symbol or name"

    # Check if active (has current price)
    if not crypto.get('current_price'):
        return False, "No current price (likely delisted)"

    # Check 24h volume (liquidity check)
    volume_24h = crypto.get('total_volume', 0)
    if volume_24h < config.MIN_VOLUME_24H:
        return False, f"Low liquidity (24h volume: ${volume_24h:,.0f})"

    # Check market cap
    market_cap = crypto.get('market_cap', 0)
    if market_cap < config.MIN_MARKET_CAP:
        return False, f"Low market cap (${market_cap:,.0f})"

    # Check if it has a rank (CoinGecko assigns ranks to active coins)
    if not crypto.get('market_cap_rank'):
        return False, "No market cap rank (likely inactive)"

    return True, ""


def transform_crypto_data(crypto: Dict) -> Dict:
    """
    Transform CoinGecko API response to our database schema format

    Args:
        crypto: Raw cryptocurrency data from CoinGecko

    Returns:
        Transformed data ready for database insertion
    """
    return {
        'symbol': crypto['symbol'].upper(),
        'name': crypto['name'],
        'rank': crypto.get('market_cap_rank', 0),
        'market_cap': crypto.get('market_cap', 0),
        'current_price': crypto.get('current_price', 0),
        'volume_24h': crypto.get('total_volume', 0),
        'high_24h': crypto.get('high_24h', 0),
        'low_24h': crypto.get('low_24h', 0),
        'price_change_24h': crypto.get('price_change_24h', 0),
        'price_change_percentage_24h': crypto.get('price_change_percentage_24h', 0),
        'coingecko_id': crypto.get('id', ''),
        'is_active': True,
        'last_updated': crypto.get('last_updated', datetime.now().isoformat())
    }


def filter1_get_top_symbols() -> List[Dict]:
    """
    Main function for Filter 1
    Fetches top 1000 cryptocurrencies by market cap and filters for validity

    Strategy: Fetch exactly top 1000 coins, then keep only valid ones (≤ 1000)

    Returns:
        List of valid cryptocurrency symbols with metadata (≤ 1000)
    """
    print("\n" + "="*60)
    print("🔍 FILTER 1: GET TOP 1000 CRYPTO SYMBOLS (THREADED)")
    print("="*60)

    all_cryptos = []
    excluded_cryptos = []

    # Fetch exactly top 1000 cryptos using ThreadPoolExecutor for parallel requests
    print(f"\n📥 Fetching top {config.TOP_CRYPTOS_COUNT} cryptos ({config.FETCH_PAGES} pages × {config.PER_PAGE} each) in parallel...")

    # Use ThreadPoolExecutor to fetch pages concurrently
    with ThreadPoolExecutor(max_workers=config.FETCH_PAGES) as executor:
        # Submit all page fetch tasks
        future_to_page = {
            executor.submit(fetch_crypto_page, page): page
            for page in range(1, config.FETCH_PAGES + 1)
        }

        # Collect results as they complete
        page_results = {}
        for future in tqdm(as_completed(future_to_page), total=config.FETCH_PAGES, desc="Fetching pages", ncols=80):
            page = future_to_page[future]
            try:
                cryptos = future.result()
                page_results[page] = cryptos
            except Exception as e:
                print(f"\n  ❌ Error fetching page {page}: {e}")
                page_results[page] = []

        # Combine results in order
        for page in sorted(page_results.keys()):
            all_cryptos.extend(page_results[page])

    print(f"\n✅ Fetched {len(all_cryptos)} total cryptocurrencies in parallel")

    # Validate and filter - keep only valid ones from top 1000
    print(f"\n🔍 Validating cryptocurrencies (keeping valid ones only)...")
    valid_cryptos = []

    for crypto in tqdm(all_cryptos, desc="Validating", ncols=80):
        is_valid, reason = is_valid_crypto(crypto)

        if is_valid:
            transformed = transform_crypto_data(crypto)
            valid_cryptos.append(transformed)
        else:
            excluded_cryptos.append({
                'symbol': crypto.get('symbol', 'UNKNOWN').upper(),
                'name': crypto.get('name', 'Unknown'),
                'reason': reason
            })

    # Remove duplicates by symbol (keep highest ranked)
    unique_cryptos = {}
    for crypto in valid_cryptos:
        symbol = crypto['symbol']
        if symbol not in unique_cryptos or crypto['rank'] < unique_cryptos[symbol]['rank']:
            unique_cryptos[symbol] = crypto

    valid_cryptos = list(unique_cryptos.values())

    # Sort by rank
    valid_cryptos.sort(key=lambda x: x['rank'])

    # No hard limit - we keep all valid cryptos from the top 1000 fetched
    # Result will be ≤ 1000 depending on how many pass validation

    # Print summary
    print("\n" + "="*60)
    print("📊 FILTER 1 SUMMARY")
    print("="*60)
    print(f"📥 Fetched: Top {len(all_cryptos)} cryptocurrencies by market cap")
    print(f"✅ Valid (after filtering): {len(valid_cryptos)}")
    print(f"❌ Excluded: {len(excluded_cryptos)}")
    print(f"📈 Top 5 valid cryptos by market cap:")
    for i, crypto in enumerate(valid_cryptos[:5], 1):
        print(f"   {i}. {crypto['symbol']:8} - {crypto['name']:20} - ${crypto['market_cap']:,.0f}")

    # Show exclusion reasons breakdown
    if excluded_cryptos:
        print(f"\n❌ Exclusion reasons:")
        reasons_count = {}
        for excluded in excluded_cryptos:
            reason = excluded['reason'].split('(')[0].strip()  # Get main reason
            reasons_count[reason] = reasons_count.get(reason, 0) + 1

        for reason, count in sorted(reasons_count.items(), key=lambda x: x[1], reverse=True):
            print(f"   - {reason}: {count}")

    print("="*60 + "\n")

    return valid_cryptos


if __name__ == "__main__":
    # Test Filter 1 independently
    symbols = filter1_get_top_symbols()

    print(f"\n✅ Filter 1 completed successfully!")
    print(f"📊 Retrieved {len(symbols)} valid cryptocurrencies")

    # Save to JSON for inspection
    import json
    with open('filter1_output.json', 'w') as f:
        json.dump(symbols, f, indent=2)
    print(f"💾 Saved output to filter1_output.json")
