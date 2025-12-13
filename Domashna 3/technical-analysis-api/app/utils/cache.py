import requests_cache
from ..config import settings

# Create cached session for API requests
onchain_session = requests_cache.CachedSession(
    cache_name='onchain_cache',
    expire_after=settings.CACHE_EXPIRY_SECONDS,
    backend='memory'
)

sentiment_session = requests_cache.CachedSession(
    cache_name='sentiment_cache',
    expire_after=settings.CACHE_EXPIRY_SECONDS,
    backend='memory'
)
