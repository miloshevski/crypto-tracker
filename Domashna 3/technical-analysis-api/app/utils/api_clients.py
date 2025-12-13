import time
from typing import Optional, Dict, Any
import httpx
from .cache import onchain_session, sentiment_session

def fetch_with_retry(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
    session_type: str = "onchain",
    max_retries: int = 3
) -> Optional[Dict[str, Any]]:
    """
    Fetch data from API with retry logic and exponential backoff

    Args:
        url: API endpoint URL
        headers: HTTP headers
        params: Query parameters
        session_type: "onchain" or "sentiment" for cache selection
        max_retries: Maximum number of retry attempts

    Returns:
        JSON response or None if all retries fail
    """
    session = onchain_session if session_type == "onchain" else sentiment_session

    for attempt in range(max_retries):
        try:
            response = session.get(url, headers=headers, params=params, timeout=10)

            # Handle rate limiting
            if response.status_code == 429:
                wait_time = 2 ** attempt  # Exponential backoff
                time.sleep(wait_time)
                continue

            # Raise for HTTP errors
            response.raise_for_status()

            return response.json()

        except Exception as e:
            if attempt == max_retries - 1:
                # Last attempt failed
                print(f"API request failed after {max_retries} attempts: {e}")
                return None

            # Wait before retry
            wait_time = 2 ** attempt
            time.sleep(wait_time)

    return None
