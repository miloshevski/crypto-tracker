'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { LineChart, Line, CandlestickChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';

export default function CoinPage({ params }) {
  const { symbol } = use(params);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState('max');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    fetchData();
  }, [interval]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coins/${symbol}?interval=${interval}`);
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Error fetching coin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const intervals = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'year', label: 'Last Year' },
    { value: '5years', label: '5 Years' },
    { value: 'max', label: 'Max' },
  ];

  const chartTypes = [
    { value: 'line', label: 'Line Chart' },
    { value: 'candlestick', label: 'Candlestick (OHLC)' },
    { value: 'area', label: 'Area Chart' },
    { value: 'volume', label: 'Volume Chart' },
  ];

  // Custom Candlestick Chart Component
  const CandlestickData = () => {
    return (
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            domain={yAxisDomain}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#F3F4F6' }}
            itemStyle={{ color: '#60A5FA' }}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <Area type="monotone" dataKey="high" fill="#10B981" fillOpacity={0.1} stroke="none" />
          <Area type="monotone" dataKey="low" fill="#EF4444" fillOpacity={0.1} stroke="none" />
          <Line type="monotone" dataKey="open" stroke="#F59E0B" strokeWidth={1} dot={false} name="Open" />
          <Line type="monotone" dataKey="high" stroke="#10B981" strokeWidth={1} dot={false} name="High" />
          <Line type="monotone" dataKey="low" stroke="#EF4444" strokeWidth={1} dot={false} name="Low" />
          <Line type="monotone" dataKey="close" stroke="#60A5FA" strokeWidth={1.5} dot={false} name="Close" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading {symbol} data...</p>
        </div>
      </div>
    );
  }

  const latestData = data.length > 0 ? data[data.length - 1] : null;

  // Calculate dynamic Y-axis domain based on price range
  const calculateYAxisDomain = () => {
    if (data.length === 0) return ['auto', 'auto'];

    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close].filter(p => p != null));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;

    // Add 5% padding on each side for better visualization
    const padding = range * 0.05;

    return [
      (min - padding).toFixed(8),
      (max + padding).toFixed(8)
    ];
  };

  const yAxisDomain = calculateYAxisDomain();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to all coins
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{symbol.toUpperCase()}</h1>
              {latestData && (
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-semibold">
                    ${Number(latestData.close).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className="text-gray-400">
                    Latest: {new Date(latestData.date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interval Selection */}
            <div>
              <label className="block text-gray-400 mb-3 font-semibold">Time Interval</label>
              <div className="flex flex-wrap gap-2">
                {intervals.map((int) => (
                  <button
                    key={int.value}
                    onClick={() => setInterval(int.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      interval === int.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Type Selection */}
            <div>
              <label className="block text-gray-400 mb-3 font-semibold">Chart Type</label>
              <div className="flex flex-wrap gap-2">
                {chartTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      chartType === type.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {latestData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Open</div>
              <div className="text-xl font-bold text-amber-400">${Number(latestData.open).toLocaleString()}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">High</div>
              <div className="text-xl font-bold text-green-400">${Number(latestData.high).toLocaleString()}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Low</div>
              <div className="text-xl font-bold text-red-400">${Number(latestData.low).toLocaleString()}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Close</div>
              <div className="text-xl font-bold text-blue-400">${Number(latestData.close).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">
            {chartTypes.find(t => t.value === chartType)?.label} - {intervals.find(i => i.value === interval)?.label}
          </h2>

          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No data available for this time period</p>
            </div>
          ) : (
            <>
              {chartType === 'line' && (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      domain={yAxisDomain}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      itemStyle={{ color: '#60A5FA' }}
                      formatter={(value) => `$${Number(value).toLocaleString()}`}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Line type="monotone" dataKey="close" stroke="#60A5FA" strokeWidth={3} dot={false} name="Close Price" />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {chartType === 'candlestick' && <CandlestickData />}

              {chartType === 'area' && (
                <ResponsiveContainer width="100%" height={500}>
                  <ComposedChart data={data}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      domain={yAxisDomain}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      itemStyle={{ color: '#60A5FA' }}
                      formatter={(value) => `$${Number(value).toLocaleString()}`}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Area type="monotone" dataKey="close" stroke="#60A5FA" fillOpacity={1} fill="url(#colorPrice)" name="Close Price" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}

              {chartType === 'volume' && (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      itemStyle={{ color: '#8B5CF6' }}
                      formatter={(value) => Number(value).toLocaleString()}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                    <Bar dataKey="volume" fill="#8B5CF6" name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}

          <div className="mt-6 text-gray-400 text-sm">
            <p>Showing {data.length} data points</p>
            {data.length > 0 && (
              <p>From {new Date(data[0].date).toLocaleDateString()} to {new Date(data[data.length - 1].date).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
