from typing import Dict, Any, List
from datetime import datetime
from .models import OnChainMetric, OverallSignal

def generate_nvt_signal(nvt_ratio: float) -> OnChainMetric:
    """Generate signal from NVT (Network Value to Transaction) ratio"""
    if nvt_ratio < 40:
        return OnChainMetric(
            name="NVT Ratio",
            value=round(nvt_ratio, 2),
            signal="BUY",
            reason="Undervalued (NVT < 40)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif nvt_ratio > 80:
        return OnChainMetric(
            name="NVT Ratio",
            value=round(nvt_ratio, 2),
            signal="SELL",
            reason="Overvalued (NVT > 80)",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="NVT Ratio",
            value=round(nvt_ratio, 2),
            signal="HOLD",
            reason="Fair value (NVT 40-80)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_active_addresses_signal(active_addresses: int) -> OnChainMetric:
    """Generate signal from active addresses metric"""
    # Baseline thresholds for Bitcoin-like activity
    # High activity (>700k) = bullish, Low activity (<300k) = bearish

    if active_addresses > 700_000:
        return OnChainMetric(
            name="Active Addresses",
            value=float(active_addresses),
            signal="BUY",
            reason=f"High network activity ({active_addresses:,} addresses)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif active_addresses < 300_000:
        return OnChainMetric(
            name="Active Addresses",
            value=float(active_addresses),
            signal="SELL",
            reason=f"Low network activity ({active_addresses:,} addresses)",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="Active Addresses",
            value=float(active_addresses),
            signal="HOLD",
            reason=f"Moderate network activity ({active_addresses:,} addresses)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_transaction_count_signal(transaction_count: int) -> OnChainMetric:
    """Generate signal from transaction count"""
    # Higher transaction count indicates more network usage (bullish)

    if transaction_count > 500_000:
        return OnChainMetric(
            name="Transaction Count (24h)",
            value=float(transaction_count),
            signal="BUY",
            reason=f"High transaction volume ({transaction_count:,} txs)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif transaction_count < 200_000:
        return OnChainMetric(
            name="Transaction Count (24h)",
            value=float(transaction_count),
            signal="SELL",
            reason=f"Low transaction volume ({transaction_count:,} txs)",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="Transaction Count (24h)",
            value=float(transaction_count),
            signal="HOLD",
            reason=f"Moderate transaction volume ({transaction_count:,} txs)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_exchange_flow_signal(net_flow: float) -> OnChainMetric:
    """
    Generate signal from exchange net flow
    Positive flow = inflow to exchanges (bearish - selling pressure)
    Negative flow = outflow from exchanges (bullish - accumulation)
    """
    if net_flow < -100_000_000:  # Large outflow (>$100M)
        return OnChainMetric(
            name="Exchange Net Flow",
            value=round(net_flow, 2),
            signal="BUY",
            reason="Large outflow from exchanges (accumulation)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif net_flow > 100_000_000:  # Large inflow (>$100M)
        return OnChainMetric(
            name="Exchange Net Flow",
            value=round(net_flow, 2),
            signal="SELL",
            reason="Large inflow to exchanges (selling pressure)",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="Exchange Net Flow",
            value=round(net_flow, 2),
            signal="HOLD",
            reason="Balanced exchange flow",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_whale_transactions_signal(whale_txs: int) -> OnChainMetric:
    """Generate signal from whale transactions (large holders moving funds)"""
    # Average whale activity ~20-30 txs/day
    # Sudden spike may indicate volatility

    if whale_txs > 50:
        return OnChainMetric(
            name="Whale Transactions",
            value=float(whale_txs),
            signal="HOLD",
            reason=f"High whale activity ({whale_txs} large txs) - volatility expected",
            strength=0,
            timestamp=datetime.now().isoformat()
        )
    elif whale_txs < 10:
        return OnChainMetric(
            name="Whale Transactions",
            value=float(whale_txs),
            signal="HOLD",
            reason=f"Low whale activity ({whale_txs} large txs) - stable market",
            strength=0,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="Whale Transactions",
            value=float(whale_txs),
            signal="HOLD",
            reason=f"Normal whale activity ({whale_txs} large txs)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_hash_rate_signal(hash_rate: float, symbol: str) -> OnChainMetric:
    """Generate signal from hash rate (only for PoW coins like Bitcoin)"""
    if hash_rate is None:
        return OnChainMetric(
            name="Hash Rate",
            value=None,
            signal="HOLD",
            reason="Not applicable (non-PoW chain)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )

    # Bitcoin hash rate trends
    # High hash rate = strong network security (bullish)
    if hash_rate > 450_000_000:  # >450 EH/s
        return OnChainMetric(
            name="Hash Rate",
            value=round(hash_rate, 0),
            signal="BUY",
            reason="High network security (strong hash rate)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif hash_rate < 300_000_000:  # <300 EH/s
        return OnChainMetric(
            name="Hash Rate",
            value=round(hash_rate, 0),
            signal="SELL",
            reason="Declining network security",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="Hash Rate",
            value=round(hash_rate, 0),
            signal="HOLD",
            reason="Stable network security",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_tvl_signal(tvl: float) -> OnChainMetric:
    """Generate signal from Total Value Locked (for DeFi chains)"""
    if tvl is None:
        return OnChainMetric(
            name="Total Value Locked (TVL)",
            value=None,
            signal="HOLD",
            reason="Not applicable (non-DeFi chain)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )

    # Higher TVL = more capital locked in DeFi (bullish for the ecosystem)
    if tvl > 40_000_000_000:  # >$40B
        return OnChainMetric(
            name="Total Value Locked (TVL)",
            value=round(tvl, 0),
            signal="BUY",
            reason=f"High DeFi activity (${tvl/1e9:.1f}B TVL)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif tvl < 10_000_000_000:  # <$10B
        return OnChainMetric(
            name="Total Value Locked (TVL)",
            value=round(tvl, 0),
            signal="SELL",
            reason=f"Low DeFi activity (${tvl/1e9:.1f}B TVL)",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="Total Value Locked (TVL)",
            value=round(tvl, 0),
            signal="HOLD",
            reason=f"Moderate DeFi activity (${tvl/1e9:.1f}B TVL)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_mvrv_signal(mvrv_ratio: float) -> OnChainMetric:
    """Generate signal from MVRV (Market Value to Realized Value) ratio"""
    if mvrv_ratio is None:
        return OnChainMetric(
            name="MVRV Ratio",
            value=None,
            signal="HOLD",
            reason="Data not available",
            strength=0,
            timestamp=datetime.now().isoformat()
        )

    # MVRV interpretation:
    # < 1 = undervalued (market < realized value)
    # > 3.5 = overvalued (typical market top indicator)

    if mvrv_ratio < 1.0:
        return OnChainMetric(
            name="MVRV Ratio",
            value=round(mvrv_ratio, 2),
            signal="BUY",
            reason="Undervalued (MVRV < 1.0)",
            strength=1,
            timestamp=datetime.now().isoformat()
        )
    elif mvrv_ratio > 3.5:
        return OnChainMetric(
            name="MVRV Ratio",
            value=round(mvrv_ratio, 2),
            signal="SELL",
            reason="Overvalued (MVRV > 3.5 - top indicator)",
            strength=-1,
            timestamp=datetime.now().isoformat()
        )
    else:
        return OnChainMetric(
            name="MVRV Ratio",
            value=round(mvrv_ratio, 2),
            signal="HOLD",
            reason="Fair value (MVRV 1.0-3.5)",
            strength=0,
            timestamp=datetime.now().isoformat()
        )


def generate_all_onchain_signals(metrics: Dict[str, Any], symbol: str) -> List[OnChainMetric]:
    """Generate signals for all available on-chain metrics"""
    signals = []

    # NVT Ratio
    if metrics.get("nvt_ratio"):
        signals.append(generate_nvt_signal(metrics["nvt_ratio"]))

    # Active Addresses
    if metrics.get("active_addresses"):
        signals.append(generate_active_addresses_signal(metrics["active_addresses"]))

    # Transaction Count
    if metrics.get("transaction_count"):
        signals.append(generate_transaction_count_signal(metrics["transaction_count"]))

    # Exchange Flow
    if metrics.get("exchange_net_flow") is not None:
        signals.append(generate_exchange_flow_signal(metrics["exchange_net_flow"]))

    # Whale Transactions
    if metrics.get("whale_transactions"):
        signals.append(generate_whale_transactions_signal(metrics["whale_transactions"]))

    # Hash Rate
    signals.append(generate_hash_rate_signal(metrics.get("hash_rate"), symbol))

    # TVL
    signals.append(generate_tvl_signal(metrics.get("tvl")))

    # MVRV
    signals.append(generate_mvrv_signal(metrics.get("mvrv_ratio")))

    return signals


def calculate_onchain_overall_signal(signals: List[OnChainMetric]) -> OverallSignal:
    """Calculate overall signal from all on-chain metrics"""
    # Filter out signals with None values (not applicable metrics)
    valid_signals = [s for s in signals if s.value is not None]

    if not valid_signals:
        return OverallSignal(
            signal="HOLD",
            score=0,
            buyCount=0,
            sellCount=0,
            holdCount=0,
            totalIndicators=0
        )

    # Calculate score
    score = sum(signal.strength for signal in valid_signals)

    # Count signals
    buy_count = sum(1 for signal in valid_signals if signal.signal == "BUY")
    sell_count = sum(1 for signal in valid_signals if signal.signal == "SELL")
    hold_count = sum(1 for signal in valid_signals if signal.signal == "HOLD")

    # Determine overall signal
    if score > 3:
        overall = "STRONG_BUY"
    elif score > 0:
        overall = "BUY"
    elif score < -3:
        overall = "STRONG_SELL"
    elif score < 0:
        overall = "SELL"
    else:
        overall = "HOLD"

    return OverallSignal(
        signal=overall,
        score=score,
        buyCount=buy_count,
        sellCount=sell_count,
        holdCount=hold_count,
        totalIndicators=len(valid_signals)
    )
