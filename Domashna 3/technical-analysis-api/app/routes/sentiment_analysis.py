from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..models import SentimentRequest, SentimentResponse
from ..sentiment_analysis import calculate_all_sentiment_metrics
from ..sentiment_signals import generate_all_sentiment_signals, calculate_sentiment_overall_signal

router = APIRouter()

@router.post("/sentiment-analysis", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment for a cryptocurrency from multiple sources

    Provides signals based on:
    - Twitter/Social Media sentiment (via LunarCrush)
    - Reddit sentiment (via PRAW + VADER NLP)
    - News sentiment (via NewsAPI + VADER NLP)
    - Social volume (overall interest)

    Sources can be filtered using the 'sources' parameter.
    """
    try:
        # Validate symbol
        symbol = request.symbol.lower().strip()

        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol cannot be empty")

        # Validate sources
        valid_sources = ["twitter", "reddit", "news"]
        sources = [s.lower() for s in request.sources if s.lower() in valid_sources]

        if not sources:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sources. Must be one or more of: {valid_sources}"
            )

        # Fetch sentiment metrics
        metrics = calculate_all_sentiment_metrics(symbol, sources)

        if not metrics:
            raise HTTPException(
                status_code=500,
                detail="Failed to fetch sentiment data. Please try again later."
            )

        # Generate signals for each source
        signals = generate_all_sentiment_signals(metrics)

        # Calculate overall signal
        overall_signal = calculate_sentiment_overall_signal(signals)

        # Build response
        return SentimentResponse(
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
            detail=f"Error analyzing sentiment: {str(e)}"
        )
