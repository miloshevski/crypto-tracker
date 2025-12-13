from typing import Dict, Any, List
from .models import SentimentMetric, OverallSignal


def generate_twitter_sentiment_signal(sentiment_score: float, volume: int) -> SentimentMetric:
    """
    Generate signal from Twitter/social media sentiment

    Args:
        sentiment_score: Sentiment score from -1 to 1
        volume: Social media volume

    Returns:
        SentimentMetric with BUY/SELL/HOLD signal
    """
    # Define volume threshold (above average indicates strong signal)
    avg_volume = 10000
    high_volume = volume > avg_volume * 1.5

    if sentiment_score > 0.3 and high_volume:
        return SentimentMetric(
            source="twitter",
            sentiment_score=round(sentiment_score, 3),
            volume=volume,
            signal="BUY",
            reason=f"Positive sentiment ({sentiment_score:.2f}) with high social volume",
            strength=1
        )
    elif sentiment_score < -0.3 and high_volume:
        return SentimentMetric(
            source="twitter",
            sentiment_score=round(sentiment_score, 3),
            volume=volume,
            signal="SELL",
            reason=f"Negative sentiment ({sentiment_score:.2f}) with high social volume",
            strength=-1
        )
    elif sentiment_score > 0.3:
        return SentimentMetric(
            source="twitter",
            sentiment_score=round(sentiment_score, 3),
            volume=volume,
            signal="HOLD",
            reason=f"Positive sentiment ({sentiment_score:.2f}) but low volume",
            strength=0
        )
    elif sentiment_score < -0.3:
        return SentimentMetric(
            source="twitter",
            sentiment_score=round(sentiment_score, 3),
            volume=volume,
            signal="HOLD",
            reason=f"Negative sentiment ({sentiment_score:.2f}) but low volume",
            strength=0
        )
    else:
        return SentimentMetric(
            source="twitter",
            sentiment_score=round(sentiment_score, 3),
            volume=volume,
            signal="HOLD",
            reason=f"Neutral sentiment ({sentiment_score:.2f})",
            strength=0
        )


def generate_reddit_sentiment_signal(sentiment_score: float, post_count: int) -> SentimentMetric:
    """
    Generate signal from Reddit sentiment

    Args:
        sentiment_score: Sentiment score from -1 to 1
        post_count: Number of Reddit posts analyzed

    Returns:
        SentimentMetric with BUY/SELL/HOLD signal
    """
    # Reddit tends to be more conservative, require higher threshold
    high_activity = post_count > 50

    if sentiment_score > 0.4 and high_activity:
        return SentimentMetric(
            source="reddit",
            sentiment_score=round(sentiment_score, 3),
            volume=post_count,
            signal="BUY",
            reason=f"Strong positive sentiment ({sentiment_score:.2f}) with {post_count} posts",
            strength=1
        )
    elif sentiment_score < -0.4 and high_activity:
        return SentimentMetric(
            source="reddit",
            sentiment_score=round(sentiment_score, 3),
            volume=post_count,
            signal="SELL",
            reason=f"Strong negative sentiment ({sentiment_score:.2f}) with {post_count} posts",
            strength=-1
        )
    elif sentiment_score > 0.2:
        return SentimentMetric(
            source="reddit",
            sentiment_score=round(sentiment_score, 3),
            volume=post_count,
            signal="HOLD",
            reason=f"Moderately positive sentiment ({sentiment_score:.2f})",
            strength=0
        )
    elif sentiment_score < -0.2:
        return SentimentMetric(
            source="reddit",
            sentiment_score=round(sentiment_score, 3),
            volume=post_count,
            signal="HOLD",
            reason=f"Moderately negative sentiment ({sentiment_score:.2f})",
            strength=0
        )
    else:
        return SentimentMetric(
            source="reddit",
            sentiment_score=round(sentiment_score, 3),
            volume=post_count,
            signal="HOLD",
            reason=f"Neutral sentiment ({sentiment_score:.2f})",
            strength=0
        )


def generate_news_sentiment_signal(sentiment_score: float, article_count: int) -> SentimentMetric:
    """
    Generate signal from news sentiment

    Args:
        sentiment_score: Sentiment score from -1 to 1
        article_count: Number of news articles analyzed

    Returns:
        SentimentMetric with BUY/SELL/HOLD signal
    """
    # News sentiment is more reliable with higher article count
    sufficient_articles = article_count >= 10

    if sentiment_score > 0.3 and sufficient_articles:
        return SentimentMetric(
            source="news",
            sentiment_score=round(sentiment_score, 3),
            volume=article_count,
            signal="BUY",
            reason=f"Positive news coverage ({sentiment_score:.2f}) across {article_count} articles",
            strength=1
        )
    elif sentiment_score < -0.3 and sufficient_articles:
        return SentimentMetric(
            source="news",
            sentiment_score=round(sentiment_score, 3),
            volume=article_count,
            signal="SELL",
            reason=f"Negative news coverage ({sentiment_score:.2f}) across {article_count} articles",
            strength=-1
        )
    elif not sufficient_articles:
        return SentimentMetric(
            source="news",
            sentiment_score=round(sentiment_score, 3),
            volume=article_count,
            signal="HOLD",
            reason=f"Insufficient news coverage ({article_count} articles)",
            strength=0
        )
    else:
        return SentimentMetric(
            source="news",
            sentiment_score=round(sentiment_score, 3),
            volume=article_count,
            signal="HOLD",
            reason=f"Neutral news sentiment ({sentiment_score:.2f})",
            strength=0
        )


def generate_social_volume_signal(total_volume: int) -> SentimentMetric:
    """
    Generate signal from overall social media volume

    Args:
        total_volume: Total social media volume across all sources

    Returns:
        SentimentMetric with BUY/SELL/HOLD signal
    """
    # Average baseline volume
    avg_volume = 20000
    very_high_volume = total_volume > avg_volume * 2
    low_volume = total_volume < avg_volume * 0.5

    if very_high_volume:
        return SentimentMetric(
            source="social_volume",
            sentiment_score=0.0,  # Volume doesn't have inherent sentiment
            volume=total_volume,
            signal="BUY",
            reason=f"Very high social activity ({total_volume:,}) - strong interest",
            strength=1
        )
    elif low_volume:
        return SentimentMetric(
            source="social_volume",
            sentiment_score=0.0,
            volume=total_volume,
            signal="SELL",
            reason=f"Low social activity ({total_volume:,}) - declining interest",
            strength=-1
        )
    else:
        return SentimentMetric(
            source="social_volume",
            sentiment_score=0.0,
            volume=total_volume,
            signal="HOLD",
            reason=f"Normal social activity ({total_volume:,})",
            strength=0
        )


def generate_all_sentiment_signals(metrics: Dict[str, Any]) -> List[SentimentMetric]:
    """
    Generate signals for all sentiment sources

    Args:
        metrics: Dict containing sentiment metrics from all sources

    Returns:
        List of SentimentMetric objects
    """
    signals = []

    # Twitter/Social sentiment
    if "twitter" in metrics:
        twitter_data = metrics["twitter"]
        signals.append(generate_twitter_sentiment_signal(
            twitter_data.get("sentiment_score", 0),
            twitter_data.get("social_volume", 0)
        ))

    # Reddit sentiment
    if "reddit" in metrics:
        reddit_data = metrics["reddit"]
        signals.append(generate_reddit_sentiment_signal(
            reddit_data.get("sentiment_score", 0),
            reddit_data.get("post_count", 0)
        ))

    # News sentiment
    if "news" in metrics:
        news_data = metrics["news"]
        signals.append(generate_news_sentiment_signal(
            news_data.get("sentiment_score", 0),
            news_data.get("article_count", 0)
        ))

    # Social volume
    if "social_volume" in metrics:
        volume_data = metrics["social_volume"]
        signals.append(generate_social_volume_signal(
            volume_data.get("total_volume", 0)
        ))

    return signals


def calculate_sentiment_overall_signal(signals: List[SentimentMetric]) -> OverallSignal:
    """
    Calculate overall sentiment signal

    Args:
        signals: List of SentimentMetric objects

    Returns:
        OverallSignal with aggregated sentiment
    """
    if not signals:
        return OverallSignal(
            signal="HOLD",
            score=0,
            buyCount=0,
            sellCount=0,
            holdCount=0,
            totalIndicators=0
        )

    # Calculate score
    score = sum(signal.strength for signal in signals)

    # Count signals
    buy_count = sum(1 for signal in signals if signal.signal == "BUY")
    sell_count = sum(1 for signal in signals if signal.signal == "SELL")
    hold_count = sum(1 for signal in signals if signal.signal == "HOLD")

    # Determine overall signal
    if score > 2:
        overall = "STRONG_BUY"
    elif score > 0:
        overall = "BUY"
    elif score < -2:
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
        totalIndicators=len(signals)
    )
