from fastapi import APIRouter, HTTPException
from typing import Optional
import asyncio
from datetime import datetime

from ..models import (
    UnifiedAnalysisRequest,
    UnifiedAnalysisResponse,
    AnalysisCategory,
    OverallSignal,
    TechnicalAnalysisResponse,
    LSTMResponse,
    OnChainResponse,
    SentimentResponse
)

# Import analysis functions
from ..indicators import prepare_dataframe, filter_by_timeframe, calculate_all_indicators
from ..signals import generate_all_signals, calculate_overall_signal
from ..lstm_predictor import run_lstm_analysis
from ..onchain_metrics import calculate_all_onchain_metrics
from ..onchain_signals import generate_all_onchain_signals, calculate_onchain_overall_signal
from ..sentiment_analysis import calculate_all_sentiment_metrics
from ..sentiment_signals import generate_all_sentiment_signals, calculate_sentiment_overall_signal

router = APIRouter()


def signal_to_score(signal: str) -> int:
    """Convert signal string to numeric score"""
    score_map = {
        "STRONG_BUY": 2,
        "BUY": 1,
        "HOLD": 0,
        "SELL": -1,
        "STRONG_SELL": -2
    }
    return score_map.get(signal, 0)


def score_to_signal(score: float) -> str:
    """Convert numeric score to signal string"""
    if score > 1.5:
        return "STRONG_BUY"
    elif score > 0.5:
        return "BUY"
    elif score > -0.5:
        return "HOLD"
    elif score > -1.5:
        return "SELL"
    else:
        return "STRONG_SELL"


async def run_technical_analysis(data, timeframe: str) -> Optional[TechnicalAnalysisResponse]:
    """Run technical analysis"""
    try:
        if len(data) < 50:
            return None

        df = prepare_dataframe(data)
        df = filter_by_timeframe(df, timeframe)

        if len(df) < 50:
            return None

        indicators = calculate_all_indicators(df)
        signals = generate_all_signals(df, indicators)
        overall = calculate_overall_signal(signals['oscillators'], signals['movingAverages'])

        return TechnicalAnalysisResponse(
            overall=overall,
            oscillators=signals['oscillators'],
            movingAverages=signals['movingAverages'],
            timeframe=timeframe,
            dataPoints=len(df)
        )
    except Exception as e:
        print(f"Technical analysis failed: {e}")
        return None


async def run_lstm_prediction_async(data, lookback: int, epochs: int, days_ahead: int) -> Optional[LSTMResponse]:
    """Run LSTM prediction"""
    try:
        if len(data) < 100:
            return None

        result = run_lstm_analysis(data, lookback, epochs, days_ahead)
        return result
    except Exception as e:
        print(f"LSTM prediction failed: {e}")
        return None


async def run_onchain_analysis_async(symbol: str) -> Optional[OnChainResponse]:
    """Run on-chain analysis"""
    try:
        metrics = calculate_all_onchain_metrics(symbol)
        if not metrics:
            return None

        signals = generate_all_onchain_signals(metrics, symbol)
        overall = calculate_onchain_overall_signal(signals)

        return OnChainResponse(
            overall=overall,
            metrics=signals,
            symbol=symbol,
            lastUpdated=datetime.now().isoformat()
        )
    except Exception as e:
        print(f"On-chain analysis failed: {e}")
        return None


async def run_sentiment_analysis_async(symbol: str, sources: list) -> Optional[SentimentResponse]:
    """Run sentiment analysis"""
    try:
        metrics = calculate_all_sentiment_metrics(symbol, sources)
        if not metrics:
            return None

        signals = generate_all_sentiment_signals(metrics)
        overall = calculate_sentiment_overall_signal(signals)

        return SentimentResponse(
            overall=overall,
            metrics=signals,
            symbol=symbol,
            lastUpdated=datetime.now().isoformat()
        )
    except Exception as e:
        print(f"Sentiment analysis failed: {e}")
        return None


@router.post("/unified-analysis", response_model=UnifiedAnalysisResponse)
async def analyze_comprehensive(request: UnifiedAnalysisRequest):
    """
    Comprehensive cryptocurrency analysis combining all analysis types

    Runs in parallel:
    - Technical Analysis (indicators and signals)
    - LSTM Price Prediction (machine learning)
    - On-Chain Metrics (blockchain data)
    - Sentiment Analysis (social media and news)

    Returns weighted overall signal based on all available analyses.
    """
    try:
        # Validate inputs
        if len(request.data) < 50:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data points. Need at least 50 OHLCV data points for technical analysis."
            )

        # Run all analyses in parallel
        tasks = []

        # Technical analysis (always run)
        tasks.append(run_technical_analysis(request.data, request.timeframe))

        # LSTM prediction (if enabled)
        if request.include_lstm:
            tasks.append(run_lstm_prediction_async(request.data, lookback=30, epochs=50, days_ahead=7))
        else:
            tasks.append(asyncio.sleep(0, result=None))

        # On-chain analysis (if enabled)
        if request.include_onchain:
            tasks.append(run_onchain_analysis_async(request.symbol))
        else:
            tasks.append(asyncio.sleep(0, result=None))

        # Sentiment analysis (if enabled)
        if request.include_sentiment:
            tasks.append(run_sentiment_analysis_async(request.symbol, ["twitter", "reddit", "news"]))
        else:
            tasks.append(asyncio.sleep(0, result=None))

        # Wait for all analyses to complete
        results = await asyncio.gather(*tasks, return_exceptions=True)

        technical_result = results[0] if not isinstance(results[0], Exception) else None
        lstm_result = results[1] if len(results) > 1 and not isinstance(results[1], Exception) else None
        onchain_result = results[2] if len(results) > 2 and not isinstance(results[2], Exception) else None
        sentiment_result = results[3] if len(results) > 3 and not isinstance(results[3], Exception) else None

        # Calculate weighted overall signal
        categories = []
        weights = {
            "technical": 0.30,
            "lstm": 0.25,
            "onchain": 0.25,
            "sentiment": 0.20
        }

        total_score = 0.0
        total_weight = 0.0

        # Technical Analysis
        if technical_result:
            tech_score = signal_to_score(technical_result.overall.signal)
            total_score += tech_score * weights["technical"]
            total_weight += weights["technical"]

            categories.append(AnalysisCategory(
                name="Technical Analysis",
                signal=technical_result.overall.signal,
                score=technical_result.overall.score,
                confidence=0.75,  # Static confidence, could be calculated
                weight=weights["technical"]
            ))

        # LSTM Prediction
        if lstm_result:
            # Determine LSTM signal from prediction trend
            if lstm_result.predictions and len(lstm_result.predictions) > 0:
                first_price = request.data[-1].close
                last_pred = lstm_result.predictions[-1].predicted_price
                price_change_pct = ((last_pred - first_price) / first_price) * 100

                if price_change_pct > 5:
                    lstm_signal = "BUY"
                    lstm_score = 1
                elif price_change_pct < -5:
                    lstm_signal = "SELL"
                    lstm_score = -1
                else:
                    lstm_signal = "HOLD"
                    lstm_score = 0

                total_score += lstm_score * weights["lstm"]
                total_weight += weights["lstm"]

                # Calculate confidence from R2 score
                confidence = min(max(lstm_result.metrics.r2_score, 0), 1)

                categories.append(AnalysisCategory(
                    name="LSTM Prediction",
                    signal=lstm_signal,
                    score=lstm_score,
                    confidence=round(confidence, 2),
                    weight=weights["lstm"]
                ))

        # On-Chain Analysis
        if onchain_result:
            onchain_score = signal_to_score(onchain_result.overall.signal)
            total_score += onchain_score * weights["onchain"]
            total_weight += weights["onchain"]

            categories.append(AnalysisCategory(
                name="On-Chain Metrics",
                signal=onchain_result.overall.signal,
                score=onchain_result.overall.score,
                confidence=0.70,
                weight=weights["onchain"]
            ))

        # Sentiment Analysis
        if sentiment_result:
            sent_score = signal_to_score(sentiment_result.overall.signal)
            total_score += sent_score * weights["sentiment"]
            total_weight += weights["sentiment"]

            categories.append(AnalysisCategory(
                name="Sentiment Analysis",
                signal=sentiment_result.overall.signal,
                score=sentiment_result.overall.score,
                confidence=0.65,
                weight=weights["sentiment"]
            ))

        # Calculate final weighted score
        if total_weight > 0:
            final_score = total_score / total_weight
        else:
            final_score = 0

        final_signal = score_to_signal(final_score)

        # Generate recommendation text
        recommendation = generate_recommendation(
            final_signal,
            final_score,
            technical_result,
            lstm_result,
            onchain_result,
            sentiment_result
        )

        # Create overall signal for unified analysis
        overall_signal = OverallSignal(
            signal=final_signal,
            score=int(round(final_score * 5)),  # Scale to approximate buy/sell count
            buyCount=sum(1 for c in categories if c.signal in ["BUY", "STRONG_BUY"]),
            sellCount=sum(1 for c in categories if c.signal in ["SELL", "STRONG_SELL"]),
            holdCount=sum(1 for c in categories if c.signal == "HOLD"),
            totalIndicators=len(categories)
        )

        return UnifiedAnalysisResponse(
            overall=overall_signal,
            categories=categories,
            technical=technical_result,
            lstm=lstm_result,
            onchain=onchain_result,
            sentiment=sentiment_result,
            recommendation=recommendation
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in unified analysis: {str(e)}"
        )


def generate_recommendation(
    signal: str,
    score: float,
    technical,
    lstm,
    onchain,
    sentiment
) -> str:
    """Generate human-readable recommendation text"""

    parts = [f"Based on comprehensive analysis, the overall signal is {signal} (score: {score:.2f})."]

    # Technical analysis summary
    if technical:
        parts.append(f"Technical indicators show {technical.overall.signal} with {technical.overall.buyCount} bullish and {technical.overall.sellCount} bearish signals.")

    # LSTM summary
    if lstm and lstm.predictions:
        parts.append(f"LSTM model predicts price movement with {lstm.metrics.r2_score:.2%} confidence.")

    # On-chain summary
    if onchain:
        parts.append(f"On-chain metrics indicate {onchain.overall.signal} with {onchain.overall.buyCount} positive signals.")

    # Sentiment summary
    if sentiment:
        avg_sentiment = sum(m.sentiment_score for m in sentiment.metrics) / len(sentiment.metrics) if sentiment.metrics else 0
        parts.append(f"Market sentiment is {'positive' if avg_sentiment > 0 else 'negative' if avg_sentiment < 0 else 'neutral'} ({avg_sentiment:.2f}).")

    return " ".join(parts)
