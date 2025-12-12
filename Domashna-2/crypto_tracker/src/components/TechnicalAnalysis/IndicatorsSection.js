'use client';

import IndicatorCard from './IndicatorCard';

export default function IndicatorsSection({ title, indicators, icon }) {
  if (!indicators || indicators.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-500">{indicators.length} technical indicators</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {indicators.map((indicator, index) => (
          <IndicatorCard
            key={index}
            name={indicator.name}
            value={indicator.value}
            signal={indicator.signal}
            reason={indicator.reason}
          />
        ))}
      </div>
    </div>
  );
}
