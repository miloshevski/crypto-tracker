from fastapi import APIRouter, HTTPException
from ..models import LSTMRequest, LSTMResponse
from ..lstm_predictor import run_lstm_analysis

router = APIRouter()

@router.post("/lstm-prediction", response_model=LSTMResponse)
async def predict_prices_lstm(request: LSTMRequest):
    """
    Predict future cryptocurrency prices using LSTM neural network

    - **data**: Historical OHLCV data
    - **lookback**: Number of previous days to use for prediction (default 30)
    - **epochs**: Number of training epochs (default 50)
    - **days_ahead**: Number of days to predict into the future (default 7)

    Returns LSTM model performance metrics and price predictions
    """
    try:
        # Validate input
        if not request.data or len(request.data) < 100:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data. Need at least 100 data points for LSTM prediction."
            )

        if request.lookback < 7 or request.lookback > 90:
            raise HTTPException(
                status_code=400,
                detail="Lookback period must be between 7 and 90 days."
            )

        if request.epochs < 10 or request.epochs > 200:
            raise HTTPException(
                status_code=400,
                detail="Epochs must be between 10 and 200."
            )

        if request.days_ahead < 1 or request.days_ahead > 30:
            raise HTTPException(
                status_code=400,
                detail="Days ahead must be between 1 and 30."
            )

        # Run LSTM analysis
        result = run_lstm_analysis(
            data=request.data,
            lookback=request.lookback,
            train_ratio=0.7,
            epochs=request.epochs,
            days_ahead=request.days_ahead
        )

        return LSTMResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running LSTM prediction: {str(e)}"
        )
