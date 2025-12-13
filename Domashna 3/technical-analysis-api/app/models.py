from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class OHLCVData(BaseModel):
    """OHLCV data point"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class TechnicalAnalysisRequest(BaseModel):
    """Request model for technical analysis"""
    data: List[OHLCVData] = Field(..., description="OHLCV historical data")
    timeframe: str = Field(default="1w", description="Timeframe: 1d, 1w, or 1m")

class IndicatorSignal(BaseModel):
    """Signal for a single indicator"""
    name: str
    value: Optional[float] = None
    signal: str  # BUY, SELL, HOLD
    reason: str
    strength: int  # -1, 0, or 1

class OverallSignal(BaseModel):
    """Overall trading signal"""
    signal: str  # STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    score: int
    buyCount: int
    sellCount: int
    holdCount: int
    totalIndicators: int

class TechnicalAnalysisResponse(BaseModel):
    """Response model for technical analysis"""
    overall: OverallSignal
    oscillators: List[IndicatorSignal]
    movingAverages: List[IndicatorSignal]
    timeframe: str
    dataPoints: int

class LSTMRequest(BaseModel):
    """Request model for LSTM price prediction"""
    data: List[OHLCVData] = Field(..., description="OHLCV historical data")
    lookback: int = Field(default=30, description="Number of previous days to use (default 30)")
    epochs: int = Field(default=50, description="Number of training epochs (default 50)")
    days_ahead: int = Field(default=7, description="Number of days to predict (default 7)")

class PricePrediction(BaseModel):
    """Single price prediction"""
    date: str
    predicted_price: float
    days_ahead: int

class LSTMMetrics(BaseModel):
    """LSTM model performance metrics"""
    rmse: float
    mape: float
    r2_score: float

class LSTMTrainingInfo(BaseModel):
    """LSTM training information"""
    lookback_period: int
    train_test_split: str
    epochs: int
    final_training_loss: float
    final_validation_loss: float
    train_samples: int
    test_samples: int

class LSTMResponse(BaseModel):
    """Response model for LSTM price prediction"""
    metrics: LSTMMetrics
    predictions: List[PricePrediction]
    training: LSTMTrainingInfo

# On-Chain Analysis Models

class OnChainRequest(BaseModel):
    """Request model for on-chain analysis"""
    symbol: str = Field(..., description="Cryptocurrency symbol (e.g., 'bitcoin', 'ethereum')")

class OnChainMetric(BaseModel):
    """Single on-chain metric with signal"""
    name: str
    value: Optional[float] = None
    signal: str  # BUY, SELL, HOLD
    reason: str
    strength: int  # -1, 0, or 1
    timestamp: Optional[str] = None

class OnChainResponse(BaseModel):
    """Response model for on-chain analysis"""
    overall: OverallSignal
    metrics: List[OnChainMetric]
    symbol: str
    lastUpdated: str

# Sentiment Analysis Models

class SentimentRequest(BaseModel):
    """Request model for sentiment analysis"""
    symbol: str = Field(..., description="Cryptocurrency symbol (e.g., 'bitcoin', 'ethereum')")
    sources: List[str] = Field(default=["twitter", "reddit", "news"], description="Sentiment sources to analyze")

class SentimentMetric(BaseModel):
    """Single sentiment metric with signal"""
    source: str  # "twitter", "reddit", "news", "social_volume"
    sentiment_score: float  # -1 to 1
    volume: Optional[int] = None
    signal: str  # BUY, SELL, HOLD
    reason: str
    strength: int  # -1, 0, or 1

class SentimentResponse(BaseModel):
    """Response model for sentiment analysis"""
    overall: OverallSignal
    metrics: List[SentimentMetric]
    symbol: str
    lastUpdated: str

# Unified Analysis Models

class UnifiedAnalysisRequest(BaseModel):
    """Request model for unified analysis combining all analysis types"""
    data: List[OHLCVData] = Field(..., description="OHLCV historical data for technical and LSTM analysis")
    symbol: str = Field(..., description="Cryptocurrency symbol for on-chain and sentiment analysis")
    timeframe: str = Field(default="1w", description="Timeframe: 1d, 1w, or 1m")
    include_lstm: bool = Field(default=True, description="Include LSTM price prediction")
    include_onchain: bool = Field(default=True, description="Include on-chain metrics")
    include_sentiment: bool = Field(default=True, description="Include sentiment analysis")

class AnalysisCategory(BaseModel):
    """Analysis category with weighted score"""
    name: str  # "Technical", "LSTM", "On-Chain", "Sentiment"
    signal: str  # STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    score: int
    confidence: float
    weight: float

class UnifiedAnalysisResponse(BaseModel):
    """Response model for unified analysis"""
    overall: OverallSignal
    categories: List[AnalysisCategory]
    technical: Optional[TechnicalAnalysisResponse] = None
    lstm: Optional[LSTMResponse] = None
    onchain: Optional[OnChainResponse] = None
    sentiment: Optional[SentimentResponse] = None
    recommendation: str  # Detailed text recommendation
