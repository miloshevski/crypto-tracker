export default function SentimentOverallSignal({ overall, symbol }) {
  const getSignalColor = (signal) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-900/30 border-green-500 text-green-400';
      case 'BUY':
        return 'bg-green-900/20 border-green-600 text-green-500';
      case 'HOLD':
        return 'bg-yellow-900/20 border-yellow-600 text-yellow-500';
      case 'SELL':
        return 'bg-red-900/20 border-red-600 text-red-500';
      case 'STRONG_SELL':
        return 'bg-red-900/30 border-red-500 text-red-400';
      default:
        return 'bg-gray-800 border-gray-600 text-gray-400';
    }
  };

  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'STRONG_BUY':
        return '🚀';
      case 'BUY':
        return '📈';
      case 'HOLD':
        return '⏸️';
      case 'SELL':
        return '📉';
      case 'STRONG_SELL':
        return '⚠️';
      default:
        return '💭';
    }
  };

  const getSentimentDescription = (signal) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'Very positive sentiment across social media and news';
      case 'BUY':
        return 'Positive sentiment in the market';
      case 'HOLD':
        return 'Neutral sentiment, mixed signals';
      case 'SELL':
        return 'Negative sentiment detected';
      case 'STRONG_SELL':
        return 'Very negative sentiment, caution advised';
      default:
        return 'Sentiment data unavailable';
    }
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${getSignalColor(overall.signal)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{getSignalIcon(overall.signal)}</span>
            <div>
              <h3 className="text-2xl font-bold">{overall.signal.replace('_', ' ')}</h3>
              <p className="text-sm opacity-80">Overall Sentiment for {symbol}</p>
            </div>
          </div>
          <p className="mt-3 opacity-90">{getSentimentDescription(overall.signal)}</p>
        </div>

        <div className="text-right ml-4">
          <div className="text-3xl font-bold">{overall.score > 0 ? '+' : ''}{overall.score}</div>
          <div className="text-xs opacity-75 mt-1">Sentiment Score</div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="opacity-75">Positive:</span>
              <span className="font-semibold text-green-400">{overall.buyCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="opacity-75">Neutral:</span>
              <span className="font-semibold text-yellow-400">{overall.holdCount}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="opacity-75">Negative:</span>
              <span className="font-semibold text-red-400">{overall.sellCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-current/20">
        <div className="text-xs opacity-75">
          Based on {overall.totalIndicators} sentiment sources
        </div>
      </div>
    </div>
  );
}
