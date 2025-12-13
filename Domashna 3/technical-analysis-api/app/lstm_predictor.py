import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error, r2_score
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from typing import List, Dict, Any, Tuple
from .models import OHLCVData
import warnings
warnings.filterwarnings('ignore')

def prepare_lstm_data(data: List[OHLCVData], lookback: int = 30, train_ratio: float = 0.7) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, MinMaxScaler]:
    """
    Prepare data for LSTM model

    Args:
        data: List of OHLCV data
        lookback: Number of previous days to use for prediction
        train_ratio: Ratio of data to use for training (default 70%)

    Returns:
        X_train, y_train, X_test, y_test, scaler
    """
    # Convert to DataFrame
    df = pd.DataFrame([d.model_dump() for d in data])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')

    # Use OHLCV features
    features = ['open', 'high', 'low', 'close', 'volume']
    dataset = df[features].values

    # Normalize the data
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(dataset)

    # Create sequences
    X, y = [], []
    for i in range(lookback, len(scaled_data)):
        X.append(scaled_data[i-lookback:i])
        y.append(scaled_data[i, 3])  # Predict close price (index 3)

    X, y = np.array(X), np.array(y)

    # Split into train and test
    split_idx = int(len(X) * train_ratio)
    X_train = X[:split_idx]
    y_train = y[:split_idx]
    X_test = X[split_idx:]
    y_test = y[split_idx:]

    return X_train, y_train, X_test, y_test, scaler

def build_lstm_model(input_shape: Tuple[int, int], units: List[int] = [50, 50]) -> Sequential:
    """
    Build LSTM model

    Args:
        input_shape: Shape of input data (lookback, features)
        units: List of units for each LSTM layer

    Returns:
        Compiled LSTM model
    """
    model = Sequential()

    # First LSTM layer
    model.add(LSTM(units[0], return_sequences=True, input_shape=input_shape))
    model.add(Dropout(0.2))

    # Additional LSTM layers
    for unit in units[1:]:
        model.add(LSTM(unit, return_sequences=True))
        model.add(Dropout(0.2))

    # Final LSTM layer
    model.add(LSTM(units[-1]))
    model.add(Dropout(0.2))

    # Output layer
    model.add(Dense(1))

    # Compile model
    model.compile(optimizer='adam', loss='mean_squared_error')

    return model

def train_lstm_model(X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, epochs: int = 50, batch_size: int = 32) -> Tuple[Sequential, Dict[str, Any]]:
    """
    Train LSTM model

    Args:
        X_train, y_train: Training data
        X_test, y_test: Testing data
        epochs: Number of training epochs
        batch_size: Batch size for training

    Returns:
        Trained model and training history
    """
    model = build_lstm_model(input_shape=(X_train.shape[1], X_train.shape[2]))

    # Train model
    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_data=(X_test, y_test),
        verbose=0
    )

    return model, history.history

def evaluate_lstm_model(model: Sequential, X_test: np.ndarray, y_test: np.ndarray, scaler: MinMaxScaler) -> Dict[str, float]:
    """
    Evaluate LSTM model performance

    Args:
        model: Trained LSTM model
        X_test, y_test: Test data
        scaler: Scaler used for normalization

    Returns:
        Dictionary with evaluation metrics
    """
    # Make predictions
    predictions = model.predict(X_test, verbose=0)

    # Denormalize predictions and actual values
    # Create dummy array with same shape as original features
    dummy_array = np.zeros((len(predictions), scaler.n_features_in_))
    dummy_array[:, 3] = predictions.flatten()  # Put predictions in close price column
    predictions_denorm = scaler.inverse_transform(dummy_array)[:, 3]

    dummy_array[:, 3] = y_test.flatten()
    y_test_denorm = scaler.inverse_transform(dummy_array)[:, 3]

    # Calculate metrics
    rmse = np.sqrt(mean_squared_error(y_test_denorm, predictions_denorm))
    mape = mean_absolute_percentage_error(y_test_denorm, predictions_denorm) * 100
    r2 = r2_score(y_test_denorm, predictions_denorm)

    return {
        'rmse': float(rmse),
        'mape': float(mape),
        'r2_score': float(r2)
    }

def predict_future_prices(model: Sequential, data: List[OHLCVData], scaler: MinMaxScaler, lookback: int = 30, days_ahead: int = 7) -> List[Dict[str, Any]]:
    """
    Predict future prices

    Args:
        model: Trained LSTM model
        data: Historical OHLCV data
        scaler: Scaler used for normalization
        lookback: Number of previous days used for prediction
        days_ahead: Number of days to predict into the future

    Returns:
        List of predictions with dates and prices
    """
    # Convert to DataFrame
    df = pd.DataFrame([d.model_dump() for d in data])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')

    features = ['open', 'high', 'low', 'close', 'volume']
    dataset = df[features].values

    # Normalize
    scaled_data = scaler.transform(dataset)

    # Get last lookback days
    last_sequence = scaled_data[-lookback:]

    predictions = []
    current_sequence = last_sequence.copy()

    # Predict future days
    for i in range(days_ahead):
        # Reshape for prediction
        X_pred = current_sequence.reshape(1, lookback, len(features))

        # Predict next day
        pred_scaled = model.predict(X_pred, verbose=0)[0][0]

        # Create full feature array for denormalization
        dummy_array = np.zeros((1, len(features)))
        dummy_array[0, 3] = pred_scaled
        pred_denorm = scaler.inverse_transform(dummy_array)[0, 3]

        # Calculate prediction date
        last_date = pd.to_datetime(df.iloc[-1]['date'])
        pred_date = last_date + pd.Timedelta(days=i+1)

        predictions.append({
            'date': pred_date.strftime('%Y-%m-%d'),
            'predicted_price': float(pred_denorm),
            'days_ahead': i + 1
        })

        # Update sequence for next prediction
        # Use predicted close price for all OHLC values (simplified)
        new_row = np.array([pred_scaled, pred_scaled, pred_scaled, pred_scaled, scaled_data[-1, 4]])
        current_sequence = np.vstack([current_sequence[1:], new_row])

    return predictions

def run_lstm_analysis(data: List[OHLCVData], lookback: int = 30, train_ratio: float = 0.7, epochs: int = 50, days_ahead: int = 7) -> Dict[str, Any]:
    """
    Run complete LSTM analysis pipeline

    Args:
        data: Historical OHLCV data
        lookback: Number of previous days to use for prediction
        train_ratio: Ratio of data to use for training
        epochs: Number of training epochs
        days_ahead: Number of days to predict into the future

    Returns:
        Dictionary with model performance metrics and predictions
    """
    # Prepare data
    X_train, y_train, X_test, y_test, scaler = prepare_lstm_data(data, lookback, train_ratio)

    # Train model
    model, history = train_lstm_model(X_train, y_train, X_test, y_test, epochs=epochs)

    # Evaluate model
    metrics = evaluate_lstm_model(model, X_test, y_test, scaler)

    # Make future predictions
    predictions = predict_future_prices(model, data, scaler, lookback, days_ahead)

    # Get training history stats
    final_loss = history['loss'][-1]
    final_val_loss = history['val_loss'][-1]

    return {
        'metrics': metrics,
        'predictions': predictions,
        'training': {
            'lookback_period': lookback,
            'train_test_split': f"{int(train_ratio*100)}/{int((1-train_ratio)*100)}",
            'epochs': epochs,
            'final_training_loss': float(final_loss),
            'final_validation_loss': float(final_val_loss),
            'train_samples': int(len(X_train)),
            'test_samples': int(len(X_test))
        }
    }
