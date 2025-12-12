from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import technical_analysis

app = FastAPI(
    title="Crypto Technical Analysis API",
    description="API for calculating technical indicators and generating trading signals",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {
        "message": "Crypto Technical Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "technical_analysis": "/api/technical-analysis"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
