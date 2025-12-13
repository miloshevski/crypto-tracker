export default function SentimentSourceCard({ metric }) {
  const getSignalColor = (signal) => {
    switch (signal) {
      case 'BUY':
        return 'border-green-500/30 bg-green-900/10';
      case 'SELL':
        return 'border-red-500/30 bg-red-900/10';
      case 'HOLD':
      default:
        return 'border-gray-600/30 bg-gray-800/30';
    }
  };

  const getSignalBadgeColor = (signal) => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'SELL':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HOLD':
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/50';
    }
  };

  const getSourceIcon = (source) => {
    switch (source.toLowerCase()) {
      case 'twitter':
        return '𝕏';
      case 'reddit':
        return '🤖';
      case 'news':
        return '📰';
      case 'social_volume':
        return '📊';
      default:
        return '💭';
    }
  };

  const getSourceName = (source) => {
    return source.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getSentimentEmoji = (score) => {
    if (score > 0.5) return '😄';
    if (score > 0.2) return '🙂';
    if (score > -0.2) return '😐';
    if (score > -0.5) return '🙁';
    return '😞';
  };

  const getSentimentBar = (score) => {
    // Convert -1 to 1 scale to 0-100%
    const percentage = ((score + 1) / 2) * 100;
    const color = score > 0.3 ? 'bg-green-500' : score < -0.3 ? 'bg-red-500' : 'bg-yellow-500';

    return (
      <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <div className={`rounded-lg border p-5 ${getSignalColor(metric.signal)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getSourceIcon(metric.source)}</span>
          <h4 className="text-lg font-semibold text-gray-200">
            {getSourceName(metric.source)}
          </h4>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSignalBadgeColor(metric.signal)}`}>
          {metric.signal}
        </span>
      </div>

      {/* Sentiment Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Sentiment Score</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{getSentimentEmoji(metric.sentiment_score)}</span>
            <span className="text-lg font-bold">
              {metric.sentiment_score > 0 ? '+' : ''}{metric.sentiment_score.toFixed(3)}
            </span>
          </div>
        </div>
        {getSentimentBar(metric.sentiment_score)}
      </div>

      {/* Volume/Activity */}
      {metric.volume !== null && metric.volume !== undefined && (
        <div className="flex items-center justify-between py-2 border-t border-gray-700/50">
          <span className="text-sm text-gray-400">
            {metric.source === 'social_volume' ? 'Total Volume' :
             metric.source === 'twitter' ? 'Social Volume' :
             metric.source === 'reddit' ? 'Posts' : 'Articles'}
          </span>
          <span className="text-sm font-semibold text-gray-300">
            {metric.volume.toLocaleString()}
          </span>
        </div>
      )}

      {/* Reason */}
      <div className="mt-3 pt-3 border-t border-gray-700/50">
        <p className="text-xs text-gray-400 italic">
          {metric.reason}
        </p>
      </div>

      {/* Strength Indicator */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">Signal Strength:</span>
        <div className="flex gap-1">
          {[-1, 0, 1].map((level) => (
            <div
              key={level}
              className={`w-6 h-2 rounded ${
                metric.strength === level
                  ? level === 1
                    ? 'bg-green-500'
                    : level === -1
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
