import pandas as pd
from typing import Dict, Any, List
from .models import IndicatorSignal, OverallSignal

def generate_rsi_signal(rsi_value: float) -> IndicatorSignal:
    """Generate signal for RSI"""
    if pd.isna(rsi_value):
        return IndicatorSignal(
            name="RSI (14)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if rsi_value < 30:
        return IndicatorSignal(
            name="RSI (14)",
            value=round(rsi_value, 2),
            signal="BUY",
            reason=f"Oversold (RSI < 30)",
            strength=1
        )
    elif rsi_value > 70:
        return IndicatorSignal(
            name="RSI (14)",
            value=round(rsi_value, 2),
            signal="SELL",
            reason=f"Overbought (RSI > 70)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="RSI (14)",
            value=round(rsi_value, 2),
            signal="HOLD",
            reason="Neutral zone (30-70)",
            strength=0
        )

def generate_macd_signal(macd: float, signal: float, prev_macd: float, prev_signal: float) -> IndicatorSignal:
    """Generate signal for MACD"""
    if pd.isna(macd) or pd.isna(signal):
        return IndicatorSignal(
            name="MACD (12,26,9)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    # Bullish crossover: MACD crosses above signal line
    if prev_macd < prev_signal and macd > signal:
        return IndicatorSignal(
            name="MACD (12,26,9)",
            value=round(macd, 2),
            signal="BUY",
            reason="Bullish crossover",
            strength=1
        )
    # Bearish crossover: MACD crosses below signal line
    elif prev_macd > prev_signal and macd < signal:
        return IndicatorSignal(
            name="MACD (12,26,9)",
            value=round(macd, 2),
            signal="SELL",
            reason="Bearish crossover",
            strength=-1
        )
    # No crossover but check if above or below
    elif macd > signal:
        return IndicatorSignal(
            name="MACD (12,26,9)",
            value=round(macd, 2),
            signal="HOLD",
            reason="MACD above signal (bullish trend)",
            strength=0
        )
    else:
        return IndicatorSignal(
            name="MACD (12,26,9)",
            value=round(macd, 2),
            signal="HOLD",
            reason="MACD below signal (bearish trend)",
            strength=0
        )

def generate_stochastic_signal(k_value: float) -> IndicatorSignal:
    """Generate signal for Stochastic Oscillator"""
    if pd.isna(k_value):
        return IndicatorSignal(
            name="Stochastic (14)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if k_value < 20:
        return IndicatorSignal(
            name="Stochastic (14)",
            value=round(k_value, 2),
            signal="BUY",
            reason="Oversold (%K < 20)",
            strength=1
        )
    elif k_value > 80:
        return IndicatorSignal(
            name="Stochastic (14)",
            value=round(k_value, 2),
            signal="SELL",
            reason="Overbought (%K > 80)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="Stochastic (14)",
            value=round(k_value, 2),
            signal="HOLD",
            reason="Neutral zone (20-80)",
            strength=0
        )

def generate_adx_signal(adx_value: float, plus_di: float, minus_di: float) -> IndicatorSignal:
    """Generate signal for ADX"""
    if pd.isna(adx_value) or pd.isna(plus_di) or pd.isna(minus_di):
        return IndicatorSignal(
            name="ADX (14)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if adx_value > 25 and plus_di > minus_di:
        return IndicatorSignal(
            name="ADX (14)",
            value=round(adx_value, 2),
            signal="BUY",
            reason="Strong uptrend (ADX>25, +DI>-DI)",
            strength=1
        )
    elif adx_value > 25 and minus_di > plus_di:
        return IndicatorSignal(
            name="ADX (14)",
            value=round(adx_value, 2),
            signal="SELL",
            reason="Strong downtrend (ADX>25, -DI>+DI)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="ADX (14)",
            value=round(adx_value, 2),
            signal="HOLD",
            reason=f"Weak trend (ADX<25)",
            strength=0
        )

def generate_cci_signal(cci_value: float) -> IndicatorSignal:
    """Generate signal for CCI"""
    if pd.isna(cci_value):
        return IndicatorSignal(
            name="CCI (20)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if cci_value < -100:
        return IndicatorSignal(
            name="CCI (20)",
            value=round(cci_value, 2),
            signal="BUY",
            reason="Oversold (CCI < -100)",
            strength=1
        )
    elif cci_value > 100:
        return IndicatorSignal(
            name="CCI (20)",
            value=round(cci_value, 2),
            signal="SELL",
            reason="Overbought (CCI > 100)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="CCI (20)",
            value=round(cci_value, 2),
            signal="HOLD",
            reason="Neutral zone (-100 to 100)",
            strength=0
        )

def generate_sma_signal(current_price: float, sma_20: float, sma_50: float) -> IndicatorSignal:
    """Generate signal for SMA"""
    if pd.isna(sma_20) or pd.isna(sma_50):
        return IndicatorSignal(
            name="SMA (20/50)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    # Golden Cross: SMA20 > SMA50 and price > SMA20
    if sma_20 > sma_50 and current_price > sma_20:
        return IndicatorSignal(
            name="SMA (20/50)",
            value=round(sma_20, 2),
            signal="BUY",
            reason="Golden Cross (SMA20>SMA50, Price>SMA20)",
            strength=1
        )
    # Death Cross: SMA20 < SMA50 and price < SMA20
    elif sma_20 < sma_50 and current_price < sma_20:
        return IndicatorSignal(
            name="SMA (20/50)",
            value=round(sma_20, 2),
            signal="SELL",
            reason="Death Cross (SMA20<SMA50, Price<SMA20)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="SMA (20/50)",
            value=round(sma_20, 2),
            signal="HOLD",
            reason="Mixed signals",
            strength=0
        )

def generate_ema_signal(ema_12: float, ema_26: float) -> IndicatorSignal:
    """Generate signal for EMA"""
    if pd.isna(ema_12) or pd.isna(ema_26):
        return IndicatorSignal(
            name="EMA (12/26)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if ema_12 > ema_26:
        return IndicatorSignal(
            name="EMA (12/26)",
            value=round(ema_12, 2),
            signal="BUY",
            reason="Bullish (EMA12 > EMA26)",
            strength=1
        )
    elif ema_12 < ema_26:
        return IndicatorSignal(
            name="EMA (12/26)",
            value=round(ema_12, 2),
            signal="SELL",
            reason="Bearish (EMA12 < EMA26)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="EMA (12/26)",
            value=round(ema_12, 2),
            signal="HOLD",
            reason="Neutral",
            strength=0
        )

def generate_wma_signal(current_price: float, wma: float) -> IndicatorSignal:
    """Generate signal for WMA"""
    if pd.isna(wma):
        return IndicatorSignal(
            name="WMA (20)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if current_price > wma:
        return IndicatorSignal(
            name="WMA (20)",
            value=round(wma, 2),
            signal="BUY",
            reason="Bullish momentum (Price > WMA)",
            strength=1
        )
    elif current_price < wma:
        return IndicatorSignal(
            name="WMA (20)",
            value=round(wma, 2),
            signal="SELL",
            reason="Bearish momentum (Price < WMA)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="WMA (20)",
            value=round(wma, 2),
            signal="HOLD",
            reason="Neutral",
            strength=0
        )

def generate_bollinger_signal(current_price: float, upper: float, lower: float, middle: float) -> IndicatorSignal:
    """Generate signal for Bollinger Bands"""
    if pd.isna(upper) or pd.isna(lower) or pd.isna(middle):
        return IndicatorSignal(
            name="Bollinger Bands (20,2)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    if current_price < lower:
        return IndicatorSignal(
            name="Bollinger Bands (20,2)",
            value=round(lower, 2),
            signal="BUY",
            reason="Price below lower band (oversold)",
            strength=1
        )
    elif current_price > upper:
        return IndicatorSignal(
            name="Bollinger Bands (20,2)",
            value=round(upper, 2),
            signal="SELL",
            reason="Price above upper band (overbought)",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="Bollinger Bands (20,2)",
            value=round(middle, 2),
            signal="HOLD",
            reason="Price within bands",
            strength=0
        )

def generate_volume_ma_signal(current_volume: float, volume_ma: float, current_price: float, prev_price: float) -> IndicatorSignal:
    """Generate signal for Volume MA"""
    if pd.isna(volume_ma):
        return IndicatorSignal(
            name="Volume MA (20)",
            value=None,
            signal="HOLD",
            reason="Insufficient data",
            strength=0
        )

    # High volume with price rising
    if current_volume > 1.5 * volume_ma and current_price > prev_price:
        return IndicatorSignal(
            name="Volume MA (20)",
            value=round(volume_ma, 2),
            signal="BUY",
            reason="High volume with rising price",
            strength=1
        )
    # High volume with price falling
    elif current_volume > 1.5 * volume_ma and current_price < prev_price:
        return IndicatorSignal(
            name="Volume MA (20)",
            value=round(volume_ma, 2),
            signal="SELL",
            reason="High volume with falling price",
            strength=-1
        )
    else:
        return IndicatorSignal(
            name="Volume MA (20)",
            value=round(volume_ma, 2),
            signal="HOLD",
            reason="Normal volume",
            strength=0
        )

def generate_all_signals(df: pd.DataFrame, indicators: Dict[str, Any]) -> Dict[str, List[IndicatorSignal]]:
    """Generate signals for all indicators"""
    latest_idx = len(df) - 1
    prev_idx = latest_idx - 1

    current_price = df.loc[latest_idx, 'close']
    prev_price = df.loc[prev_idx, 'close'] if prev_idx >= 0 else current_price
    current_volume = df.loc[latest_idx, 'volume']

    # Oscillators
    oscillators = [
        generate_rsi_signal(indicators['rsi'].iloc[-1]),
        generate_macd_signal(
            indicators['macd']['macd'].iloc[-1],
            indicators['macd']['signal'].iloc[-1],
            indicators['macd']['macd'].iloc[-2] if len(indicators['macd']['macd']) > 1 else indicators['macd']['macd'].iloc[-1],
            indicators['macd']['signal'].iloc[-2] if len(indicators['macd']['signal']) > 1 else indicators['macd']['signal'].iloc[-1]
        ),
        generate_stochastic_signal(indicators['stochastic']['k'].iloc[-1]),
        generate_adx_signal(
            indicators['adx']['adx'].iloc[-1],
            indicators['adx']['plus_di'].iloc[-1],
            indicators['adx']['minus_di'].iloc[-1]
        ),
        generate_cci_signal(indicators['cci'].iloc[-1])
    ]

    # Moving Averages
    moving_averages = [
        generate_sma_signal(
            current_price,
            indicators['sma']['sma_20'].iloc[-1],
            indicators['sma']['sma_50'].iloc[-1]
        ),
        generate_ema_signal(
            indicators['ema']['ema_12'].iloc[-1],
            indicators['ema']['ema_26'].iloc[-1]
        ),
        generate_wma_signal(current_price, indicators['wma'].iloc[-1]),
        generate_bollinger_signal(
            current_price,
            indicators['bollinger']['upper'].iloc[-1],
            indicators['bollinger']['lower'].iloc[-1],
            indicators['bollinger']['middle'].iloc[-1]
        ),
        generate_volume_ma_signal(
            current_volume,
            indicators['volume_ma'].iloc[-1],
            current_price,
            prev_price
        )
    ]

    return {
        'oscillators': oscillators,
        'movingAverages': moving_averages
    }

def calculate_overall_signal(oscillators: List[IndicatorSignal], moving_averages: List[IndicatorSignal]) -> OverallSignal:
    """Calculate overall trading signal"""
    all_signals = oscillators + moving_averages

    # Calculate score
    score = sum(signal.strength for signal in all_signals)

    # Count signals
    buy_count = sum(1 for signal in all_signals if signal.signal == "BUY")
    sell_count = sum(1 for signal in all_signals if signal.signal == "SELL")
    hold_count = sum(1 for signal in all_signals if signal.signal == "HOLD")

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
        totalIndicators=len(all_signals)
    )
