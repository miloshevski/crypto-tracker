from fastapi import APIRouter, HTTPException
from typing import List
from ..models import TechnicalAnalysisRequest, TechnicalAnalysisResponse
from ..indicators import (
    prepare_dataframe,
    filter_by_timeframe,
    calculate_all_indicators
)
from ..signals import generate_all_signals, calculate_overall_signal

router = APIRouter()

@router.post("/technical-analysis", response_model=TechnicalAnalysisResponse)
async def analyze_technical_indicators(request: TechnicalAnalysisRequest):
    """
    Calculate technical indicators and generate trading signals

    - **data**: List of OHLCV data points
    - **timeframe**: Analysis timeframe (1d, 1w, 1m)

    Returns calculated indicators with buy/sell/hold signals
    """
    try:
        # Validate input
        if not request.data or len(request.data) < 50:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data. Need at least 50 data points for technical analysis."
            )

        # Prepare dataframe
        df = prepare_dataframe(request.data)

        # Filter by timeframe
        df = filter_by_timeframe(df, request.timeframe)

        if len(df) < 50:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for timeframe '{request.timeframe}'. Need at least 50 points."
            )

        # Calculate all indicators
        indicators = calculate_all_indicators(df)

        # Generate signals
        signals = generate_all_signals(df, indicators)

        # Calculate overall signal
        overall = calculate_overall_signal(
            signals['oscillators'],
            signals['movingAverages']
        )

        # Return response
        return TechnicalAnalysisResponse(
            overall=overall,
            oscillators=signals['oscillators'],
            movingAverages=signals['movingAverages'],
            timeframe=request.timeframe,
            dataPoints=len(df)
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating technical analysis: {str(e)}"
        )
