from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..models import OnChainRequest, OnChainResponse
from ..onchain_metrics import calculate_all_onchain_metrics
from ..onchain_signals import generate_all_onchain_signals, calculate_onchain_overall_signal

router = APIRouter()

@router.post("/onchain-analysis", response_model=OnChainResponse)
async def analyze_onchain_metrics(request: OnChainRequest):
    """
    Analyze on-chain metrics for a cryptocurrency

    Provides signals based on:
    - NVT Ratio (Network Value to Transaction)
    - Active Addresses
    - Transaction Count
    - Exchange Flows
    - Whale Transactions
    - Hash Rate (for PoW chains)
    - TVL (for DeFi chains)
    - MVRV Ratio (for Bitcoin)
    """
    try:
        # Validate symbol
        symbol = request.symbol.lower().strip()

        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol cannot be empty")

        # Fetch on-chain metrics
        metrics = calculate_all_onchain_metrics(symbol)

        if not metrics:
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch on-chain data. Please try again later."
            )

        # Generate signals for each metric
        signals = generate_all_onchain_signals(metrics, symbol)

        # Calculate overall signal
        overall_signal = calculate_onchain_overall_signal(signals)

        # Build response
        return OnChainResponse(
            overall=overall_signal,
            metrics=signals,
            symbol=symbol,
            lastUpdated=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing on-chain metrics: {str(e)}"
        )
