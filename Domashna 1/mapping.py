"""
automatic_mapping.py
-----------------------------------------
Automatically map CoinGecko coins to Binance USDT trading pairs.
No manual dictionary. Fully automatic.

Output example:
{
  "bitcoin": "BTCUSDT",
  "ethereum": "ETHUSDT",
  "tether": null,
  ...
}
"""

import requests
import ccxt

# ==========================
# Fetch coins from CoinGecko
# ==========================

def get_top_coins(limit=1000):
    per_page = 250
    pages = (limit // per_page) + 1

    coins = []
    for page in range(1, pages + 1):
        url = (
            f"https://api.coingecko.com/api/v3/coins/markets"
            f"?vs_currency=usd&order=market_cap_desc&per_page={per_page}&page={page}"
        )
        resp = requests.get(url, timeout=30)
        if resp.status_code != 200:
            raise RuntimeError(f"CoinGecko error: {resp.text}")

        data = resp.json()
        if not data:
            break

        for c in data:
            coins.append({
                "id": c["id"],
                "symbol": c["symbol"].lower(),
                "name": c["name"],
            })

        if len(coins) >= limit:
            break

    return coins[:limit]


# ==========================
# Fetch Binance USDT markets
# ==========================

def get_binance_usdt_bases():
    """
    Returns set of base symbols (lowercase) that have /USDT markets on Binance.
    Example: {"btc", "eth", "sol", ...}
    """
    binance = ccxt.binance()
    markets = binance.load_markets()

    bases = set()
    for market, info in markets.items():
        base = info.get("base")
        quote = info.get("quote")
        if not base or not quote:
            continue
        if quote.upper() == "USDT":
            bases.add(base.lower())

    return bases


# ==========================
# Automatic mapping function
# ==========================

def auto_map_coingecko_to_binance(coins):
    binance_bases = get_binance_usdt_bases()
    mapping = {}

    for coin in coins:
        sym = coin["symbol"].lower()

        if sym in binance_bases:
            # Convert BTC -> BTCUSDT
            mapping[coin["id"]] = sym.upper() + "USDT"
        else:
            mapping[coin["id"]] = None

    return mapping


# ==========================
# Main
# ==========================

if __name__ == "__main__":
    print("📥 Fetching top 1000 coins from CoinGecko...")
    coins = get_top_coins(1000)
    print(f"   → Retrieved {len(coins)} coins")

    print("\n📊 Loading Binance markets (USDT pairs)...")
    usdt_bases = get_binance_usdt_bases()
    print(f"   → Binance USDT markets: {len(usdt_bases)}")

    print("\n🔗 Mapping CoinGecko → Binance automatically...")
    mapping = auto_map_coingecko_to_binance(coins)

    # Show first 20 mappings
    print("\n=== Sample mappings ===")
    for i, (cid, pair) in enumerate(mapping.items()):
        print(f"{cid:25}  →  {pair}")
        if i >= 19:
            break

    # Save mapping.json
    import json
    with open("mapping.json", "w") as f:
        json.dump(mapping, f, indent=2)

    print("\n💾 Saved to mapping.json")
    print("✅ Done!")
