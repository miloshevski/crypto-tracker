'use client';

export default function OverallSignal({ signal, score, buyCount, sellCount, holdCount, totalIndicators }) {
  const getSignalConfig = (signal) => {
    switch(signal) {
      case 'STRONG_BUY':
        return {
          bg: 'bg-gradient-to-br from-emerald-500/10 to-green-500/5',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          label: 'Strong Buy',
          icon: '↗'
        };
      case 'BUY':
        return {
          bg: 'bg-gradient-to-br from-green-500/10 to-emerald-500/5',
          border: 'border-green-500/30',
          text: 'text-green-400',
          label: 'Buy',
          icon: '↗'
        };
      case 'STRONG_SELL':
        return {
          bg: 'bg-gradient-to-br from-rose-500/10 to-red-500/5',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          label: 'Strong Sell',
          icon: '↘'
        };
      case 'SELL':
        return {
          bg: 'bg-gradient-to-br from-red-500/10 to-rose-500/5',
          border: 'border-red-500/30',
          text: 'text-red-400',
          label: 'Sell',
          icon: '↘'
        };
      case 'HOLD':
        return {
          bg: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/5',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          label: 'Hold',
          icon: '→'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-500/10 to-gray-600/5',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          label: 'Neutral',
          icon: '—'
        };
    }
  };

  const config = getSignalConfig(signal);

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-8 mb-6 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Market Signal</p>
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-4xl font-bold ${config.text}`}>{config.label}</span>
            <span className={`text-3xl ${config.text}`}>{config.icon}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-300">{buyCount} Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-gray-300">{holdCount} Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-300">{sellCount} Bearish</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm mb-1">Consensus Score</p>
          <div className={`text-5xl font-bold ${config.text}`}>
            {score > 0 ? '+' : ''}{score}
          </div>
          <p className="text-gray-500 text-xs mt-1">out of {totalIndicators}</p>
        </div>
      </div>
    </div>
  );
}
