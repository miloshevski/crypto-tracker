import pandas as pd
import ta
from typing import List, Dict, Any
from .models import OHLCVData

def prepare_dataframe(data: List[OHLCVData]) -> pd.DataFrame:
    """Convert OHLCV data to pandas DataFrame"""
    df = pd.DataFrame([d.model_dump() for d in data])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    return df

def filter_by_timeframe(df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
    """Filter data based on timeframe"""
    timeframe_points = {
        '1d': 60,  # Increased from 30 to 60 for better indicator calculation (need 50+ for SMA 50)
        '1w': 90,
        '1m': 365
    }
    points = timeframe_points.get(timeframe, 90)
    return df.tail(points).reset_index(drop=True)

def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calculate RSI (Relative Strength Index)"""
    return ta.momentum.RSIIndicator(close=df['close'], window=period).rsi()

def calculate_macd(df: pd.DataFrame) -> Dict[str, pd.Series]:
    """Calculate MACD (Moving Average Convergence Divergence)"""
    macd_indicator = ta.trend.MACD(close=df['close'])
    return {
        'macd': macd_indicator.macd(),
        'signal': macd_indicator.macd_signal(),
        'histogram': macd_indicator.macd_diff()
    }

def calculate_stochastic(df: pd.DataFrame, period: int = 14) -> Dict[str, pd.Series]:
    """Calculate Stochastic Oscillator"""
    stoch = ta.momentum.StochasticOscillator(
        high=df['high'],
        low=df['low'],
        close=df['close'],
        window=period
    )
    return {
        'k': stoch.stoch(),
        'd': stoch.stoch_signal()
    }

def calculate_adx(df: pd.DataFrame, period: int = 14) -> Dict[str, pd.Series]:
    """Calculate ADX (Average Directional Index)"""
    adx_indicator = ta.trend.ADXIndicator(
        high=df['high'],
        low=df['low'],
        close=df['close'],
        window=period
    )
    return {
        'adx': adx_indicator.adx(),
        'plus_di': adx_indicator.adx_pos(),
        'minus_di': adx_indicator.adx_neg()
    }

def calculate_cci(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Calculate CCI (Commodity Channel Index)"""
    return ta.trend.CCIIndicator(
        high=df['high'],
        low=df['low'],
        close=df['close'],
        window=period
    ).cci()

def calculate_sma(df: pd.DataFrame, periods: List[int] = [20, 50]) -> Dict[str, pd.Series]:
    """Calculate SMA (Simple Moving Average)"""
    result = {}
    for period in periods:
        result[f'sma_{period}'] = ta.trend.SMAIndicator(
            close=df['close'],
            window=period
        ).sma_indicator()
    return result

def calculate_ema(df: pd.DataFrame, periods: List[int] = [12, 26]) -> Dict[str, pd.Series]:
    """Calculate EMA (Exponential Moving Average)"""
    result = {}
    for period in periods:
        result[f'ema_{period}'] = ta.trend.EMAIndicator(
            close=df['close'],
            window=period
        ).ema_indicator()
    return result

def calculate_wma(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Calculate WMA (Weighted Moving Average)"""
    return ta.trend.WMAIndicator(
        close=df['close'],
        window=period
    ).wma()

def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, std_dev: int = 2) -> Dict[str, pd.Series]:
    """Calculate Bollinger Bands"""
    bollinger = ta.volatility.BollingerBands(
        close=df['close'],
        window=period,
        window_dev=std_dev
    )
    return {
        'upper': bollinger.bollinger_hband(),
        'middle': bollinger.bollinger_mavg(),
        'lower': bollinger.bollinger_lband()
    }

def calculate_volume_ma(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Calculate Volume Moving Average"""
    return ta.trend.SMAIndicator(
        close=df['volume'],
        window=period
    ).sma_indicator()

def calculate_all_indicators(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate all technical indicators"""
    if len(df) < 50:
        raise ValueError("Insufficient data points. Need at least 50 data points.")
    
    indicators = {
        'rsi': calculate_rsi(df),
        'macd': calculate_macd(df),
        'stochastic': calculate_stochastic(df),
        'adx': calculate_adx(df),
        'cci': calculate_cci(df),
        'sma': calculate_sma(df),
        'ema': calculate_ema(df),
        'wma': calculate_wma(df),
        'bollinger': calculate_bollinger_bands(df),
        'volume_ma': calculate_volume_ma(df)
    }
    
    return indicators
