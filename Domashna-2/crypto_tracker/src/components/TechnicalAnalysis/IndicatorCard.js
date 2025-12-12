'use client';

export default function IndicatorCard({ name, value, signal, reason }) {
  const getSignalConfig = (signal) => {
    switch(signal) {
      case 'BUY':
        return {
          bg: 'bg-green-500/5',
          border: 'border-green-500/20',
          badgeBg: 'bg-green-500/10',
          badgeText: 'text-green-400',
          badgeBorder: 'border-green-500/30',
          icon: '↗',
          label: 'Buy'
        };
      case 'SELL':
        return {
          bg: 'bg-red-500/5',
          border: 'border-red-500/20',
          badgeBg: 'bg-red-500/10',
          badgeText: 'text-red-400',
          badgeBorder: 'border-red-500/30',
          icon: '↘',
          label: 'Sell'
        };
      case 'HOLD':
        return {
          bg: 'bg-amber-500/5',
          border: 'border-amber-500/20',
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-400',
          badgeBorder: 'border-amber-500/30',
          icon: '→',
          label: 'Hold'
        };
      default:
        return {
          bg: 'bg-gray-500/5',
          border: 'border-gray-500/20',
          badgeBg: 'bg-gray-500/10',
          badgeText: 'text-gray-400',
          badgeBorder: 'border-gray-500/30',
          icon: '—',
          label: 'Neutral'
        };
    }
  };

  const config = getSignalConfig(signal);

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-5 hover:border-opacity-40 transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{name}</h3>
          {value !== null && value !== undefined ? (
            <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </p>
          ) : (
            <p className="text-xl text-gray-600">—</p>
          )}
        </div>
        <div className={`${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5`}>
          <span className="text-sm">{config.icon}</span>
          {config.label}
        </div>
      </div>
      <p className="text-gray-500 text-xs leading-relaxed">{reason}</p>
    </div>
  );
}
