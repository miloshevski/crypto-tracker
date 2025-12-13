from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import technical_analysis, lstm_prediction, onchain_analysis, sentiment_analysis, unified_analysis

app = FastAPI(
    title="Comprehensive Crypto Analysis API",
    description="API for technical analysis, LSTM predictions, on-chain metrics, and sentiment analysis",
    version="3.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(technical_analysis.router, prefix="/api", tags=["Technical Analysis"])
app.include_router(lstm_prediction.router, prefix="/api", tags=["LSTM Price Prediction"])
app.include_router(onchain_analysis.router, prefix="/api", tags=["On-Chain Analysis"])
app.include_router(sentiment_analysis.router, prefix="/api", tags=["Sentiment Analysis"])
app.include_router(unified_analysis.router, prefix="/api", tags=["Unified Analysis"])

@app.get("/")
def read_root():
    return {
        "message": "Comprehensive Crypto Analysis API",
        "version": "3.0.0",
        "endpoints": {
            "technical_analysis": "/api/technical-analysis",
            "lstm_prediction": "/api/lstm-prediction",
            "onchain_analysis": "/api/onchain-analysis",
            "sentiment_analysis": "/api/sentiment-analysis",
            "unified_analysis": "/api/unified-analysis"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
