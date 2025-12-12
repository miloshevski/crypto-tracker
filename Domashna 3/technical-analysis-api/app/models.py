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
