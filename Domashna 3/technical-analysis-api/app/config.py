from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings and API keys"""

    # On-Chain API Keys
    GLASSNODE_API_KEY: Optional[str] = None

    # Sentiment API Keys
    LUNARCRUSH_API_KEY: Optional[str] = None
    NEWSAPI_KEY: Optional[str] = None

    # Reddit API Configuration
    REDDIT_CLIENT_ID: Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    REDDIT_USER_AGENT: str = "crypto-tracker/1.0"

    # Feature Flags
    ENABLE_ONCHAIN: bool = True
    ENABLE_SENTIMENT: bool = True

    # Cache Settings
    CACHE_EXPIRY_SECONDS: int = 300  # 5 minutes

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
