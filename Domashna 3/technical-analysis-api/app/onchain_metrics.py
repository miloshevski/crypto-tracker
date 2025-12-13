from typing import Dict, Any, Optional
from .utils.api_clients import fetch_with_retry
from .config import settings

def fetch_coingecko_data(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Fetch cryptocurrency data from CoinGecko API (free, no API key required)

    Args:
        symbol: Cryptocurrency name (e.g., 'bitcoin', 'ethereum')

    Returns:
        Dict with market data or None if fetch fails
    """
    url = f"https://api.coingecko.com/api/v3/coins/{symbol}"
    params = {
        "localization": "false",
        "tickers": "false",
        "community_data": "true",
        "developer_data": "false"
    }

    data = fetch_with_retry(url, params=params, session_type="onchain")

    if not data:
        return None

    try:
        market_data = data.get("market_data", {})
        return {
            "market_cap": market_data.get("market_cap", {}).get("usd"),
            "total_volume": market_data.get("total_volume", {}).get("usd"),
            "circulating_supply": market_data.get("circulating_supply"),
            "total_supply": market_data.get("total_supply"),
            "price": market_data.get("current_price", {}).get("usd"),
            "price_change_24h": market_data.get("price_change_percentage_24h"),
            "market_cap_change_24h": market_data.get("market_cap_change_percentage_24h")
        }
    except Exception as e:
        print(f"Error parsing CoinGecko data: {e}")
        return None


def fetch_glassnode_data(symbol: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch on-chain metrics from Glassnode API (requires API key, free tier available)

    Args:
        symbol: Cryptocurrency ticker (e.g., 'BTC', 'ETH')
        api_key: Glassnode API key

    Returns:
        Dict with on-chain metrics or None
    """
    if not api_key:
        return None

    # Glassnode uses ticker symbols (BTC, ETH), map common names
    symbol_map = {
        "bitcoin": "BTC",
        "ethereum": "ETH"
    }
    ticker = symbol_map.get(symbol.lower(), symbol.upper())

    metrics = {}

    # Active addresses (last value)
    url_active = "https://api.glassnode.com/v1/metrics/addresses/active_count"
    params_active = {"a": ticker, "api_key": api_key}
    active_data = fetch_with_retry(url_active, params=params_active, session_type="onchain")

    if active_data and len(active_data) > 0:
        metrics["active_addresses"] = active_data[-1].get("v")

    # Note: Free tier has limited metrics, add more if premium key available
    return metrics if metrics else None


def calculate_all_onchain_metrics(symbol: str) -> Dict[str, Any]:
    """
    Calculate all on-chain metrics for a cryptocurrency

    Args:
        symbol: Cryptocurrency name

    Returns:
        Dict containing all available on-chain metrics
    """
    metrics = {}

    # Fetch CoinGecko data (always available, free)
    cg_data = fetch_coingecko_data(symbol)

    if cg_data:
        # Calculate NVT Ratio (Network Value to Transaction)
        # NVT = Market Cap / Daily Transaction Volume
        if cg_data.get("market_cap") and cg_data.get("total_volume"):
            nvt_ratio = cg_data["market_cap"] / cg_data["total_volume"]
            metrics["nvt_ratio"] = nvt_ratio

        # Store raw data for other calculations
        metrics["market_cap"] = cg_data.get("market_cap")
        metrics["total_volume"] = cg_data.get("total_volume")
        metrics["circulating_supply"] = cg_data.get("circulating_supply")
        metrics["price_change_24h"] = cg_data.get("price_change_24h")
        metrics["market_cap_change_24h"] = cg_data.get("market_cap_change_24h")

    # Fetch Glassnode data (if API key available)
    if settings.GLASSNODE_API_KEY:
        gn_data = fetch_glassnode_data(symbol, settings.GLASSNODE_API_KEY)
        if gn_data:
            metrics.update(gn_data)

    # Mock/Placeholder metrics for demonstration
    # In production, these would come from real APIs

    # Active Addresses - if not from Glassnode, use placeholder based on market cap
    if "active_addresses" not in metrics and metrics.get("market_cap"):
        # Rough estimate: larger market cap = more addresses
        market_cap = metrics["market_cap"]
        if market_cap > 100_000_000_000:  # > $100B
            metrics["active_addresses"] = 800_000
        elif market_cap > 10_000_000_000:  # > $10B
            metrics["active_addresses"] = 400_000
        else:
            metrics["active_addresses"] = 150_000

    # Transaction Count (24h) - placeholder based on volume
    if metrics.get("total_volume"):
        # Estimate: higher volume = more transactions
        volume = metrics["total_volume"]
        metrics["transaction_count"] = int(volume / 1_000_000)  # Rough estimate

    # Exchange Flow - placeholder
    # Positive = net inflow (bearish), negative = net outflow (bullish)
    metrics["exchange_net_flow"] = 0  # Neutral placeholder

    # Whale Transactions (>$1M) - placeholder
    metrics["whale_transactions"] = 25  # Average placeholder

    # Hash Rate - only relevant for PoW coins like Bitcoin
    if symbol.lower() == "bitcoin":
        metrics["hash_rate"] = 400_000_000  # 400 EH/s placeholder
    else:
        metrics["hash_rate"] = None

    # TVL (Total Value Locked) - relevant for DeFi coins
    if symbol.lower() in ["ethereum", "avalanche", "polygon"]:
        if symbol.lower() == "ethereum":
            metrics["tvl"] = 50_000_000_000  # $50B placeholder
        else:
            metrics["tvl"] = 5_000_000_000  # $5B placeholder
    else:
        metrics["tvl"] = None

    # MVRV Ratio (Market Value to Realized Value) - typically only for Bitcoin
    if symbol.lower() == "bitcoin":
        # MVRV typically ranges from 0.5 to 4
        # Values > 3.5 indicate top, < 1 indicate bottom
        metrics["mvrv_ratio"] = 2.1  # Neutral placeholder
    else:
        metrics["mvrv_ratio"] = None

    return metrics
