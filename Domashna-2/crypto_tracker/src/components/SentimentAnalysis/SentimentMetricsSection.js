import SentimentSourceCard from './SentimentSourceCard';

export default function SentimentMetricsSection({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No sentiment metrics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-200 mb-4">
          Sentiment Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <SentimentSourceCard key={index} metric={metric} />
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 p-5 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <h4 className="text-lg font-semibold text-gray-200 mb-4">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-200">
              {metrics.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Sources Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {metrics.filter(m => m.signal === 'BUY').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Positive Signals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {metrics.filter(m => m.signal === 'HOLD').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Neutral Signals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {metrics.filter(m => m.signal === 'SELL').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Negative Signals</div>
          </div>
        </div>

        {/* Average Sentiment */}
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Average Sentiment Score</span>
            <span className="text-lg font-bold text-gray-200">
              {(metrics.reduce((sum, m) => sum + m.sentiment_score, 0) / metrics.length).toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* Information Notice */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="flex-1 text-sm text-blue-300">
            <p className="font-semibold mb-1">About Sentiment Analysis</p>
            <p className="text-blue-300/80">
              Sentiment scores range from -1 (very negative) to +1 (very positive).
              This analysis combines social media activity, news coverage, and community discussions
              to gauge market sentiment. Use this as one of many factors in your decision-making process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
