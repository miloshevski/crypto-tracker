'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function CompareContent() {
  const searchParams = useSearchParams();
  const coinSymbols = searchParams.get('coins')?.split(',') || [];

  const [coinsData, setCoinsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState('month');

  useEffect(() => {
    if (coinSymbols.length > 0) {
      fetchAllCoinsData();
    }
  }, [interval]);

  const fetchAllCoinsData = async () => {
    setLoading(true);
    try {
      const promises = coinSymbols.map(symbol =>
        fetch(`/api/coins/${symbol}?interval=${interval}`)
          .then(res => res.json())
          .then(result => ({ symbol, data: result.data || [] }))
      );

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(({ symbol, data }) => {
        dataMap[symbol] = data;
      });
      setCoinsData(dataMap);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
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

  const colors = ['#60A5FA', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Normalize data for overlay comparison
  const getNormalizedData = () => {
    if (Object.keys(coinsData).length === 0) return [];

    // Get all unique dates
    const allDates = new Set();
    Object.values(coinsData).forEach(data => {
      data.forEach(item => allDates.add(item.date));
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const dataPoint = { date };
      Object.entries(coinsData).forEach(([symbol, data]) => {
        const item = data.find(d => d.date === date);
        if (item) {
          dataPoint[`${symbol}_close`] = item.close;
        }
      });
      return dataPoint;
    });
  };

  // Get percentage change comparison
  const getPercentageChangeData = () => {
    if (Object.keys(coinsData).length === 0) return [];

    const result = [];
    Object.entries(coinsData).forEach(([symbol, data]) => {
      if (data.length > 0) {
        const firstPrice = data[0].close;
        const lastPrice = data[data.length - 1].close;
        const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
        result.push({ symbol, percentChange });
      }
    });
    return result;
  };

  // Get latest stats for each coin
  const getLatestStats = (symbol) => {
    const data = coinsData[symbol];
    if (!data || data.length === 0) return null;
    return data[data.length - 1];
  };

  // Calculate overall stats
  const calculateStats = (symbol) => {
    const data = coinsData[symbol];
    if (!data || data.length === 0) return null;

    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      latest: lastPrice,
      high,
      low,
      avgVolume,
      change,
      changePercent
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (coinSymbols.length < 2) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Not Enough Coins Selected</h1>
          <p className="text-gray-400 mb-6">Please select at least 2 coins to compare.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            ← Back to Coins List
          </Link>
        </div>
      </div>
    );
  }

  const normalizedData = getNormalizedData();
  const percentageData = getPercentageChangeData();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Back to all coins
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">⚖️ Coin Comparison</h1>
              <p className="text-gray-400">
                Comparing {coinSymbols.length} cryptocurrencies: {coinSymbols.map(s => s.toUpperCase()).join(' vs ')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-gray-400 mb-3 font-semibold">Time Interval</label>
          <div className="flex flex-wrap gap-2">
            {intervals.map((int) => (
              <button
                key={int.value}
                onClick={() => setInterval(int.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  interval === int.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {coinSymbols.map((symbol, index) => {
            const stats = calculateStats(symbol);
            const latest = getLatestStats(symbol);

            return (
              <div
                key={symbol}
                className="bg-gray-800 rounded-lg p-6 border-l-4"
                style={{ borderLeftColor: colors[index % colors.length] }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold" style={{ color: colors[index % colors.length] }}>
                    {symbol.toUpperCase()}
                  </h3>
                  <Link
                    href={`/coin/${symbol}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    View Details →
                  </Link>
                </div>

                {stats && latest && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-400 text-sm">Current Price</div>
                      <div className="text-2xl font-bold">
                        ${Number(stats.latest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                      </div>
                    </div>

                    <div className={`text-lg font-semibold ${stats.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.changePercent >= 0 ? '↗' : '↘'} {stats.changePercent.toFixed(2)}%
                      <span className="text-sm text-gray-400 ml-2">
                        ({intervals.find(i => i.value === interval)?.label})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-700">
                      <div>
                        <div className="text-gray-400 text-xs">High</div>
                        <div className="text-sm font-semibold text-green-400">
                          ${Number(stats.high).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Low</div>
                        <div className="text-sm font-semibold text-red-400">
                          ${Number(stats.low).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400 text-xs">Avg Volume</div>
                      <div className="text-sm font-semibold">
                        {Number(stats.avgVolume).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(latest.date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {!stats && (
                  <div className="text-gray-400 text-center py-8">
                    No data available
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Price Comparison Chart */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">📈 Price Comparison</h2>

          {normalizedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={normalizedData}>
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
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                {coinSymbols.map((symbol, index) => (
                  <Line
                    key={symbol}
                    type="monotone"
                    dataKey={`${symbol}_close`}
                    stroke={colors[index % colors.length]}
                    strokeWidth={3}
                    dot={false}
                    name={symbol.toUpperCase()}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No overlapping data available for comparison</p>
            </div>
          )}
        </div>

        {/* Percentage Change Comparison */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">📊 Performance Comparison ({intervals.find(i => i.value === interval)?.label})</h2>

          {percentageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={percentageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="symbol"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  label={{ value: 'Change %', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value) => `${Number(value).toFixed(2)}%`}
                />
                <Bar
                  dataKey="percentChange"
                  fill="#8B5CF6"
                  radius={[8, 8, 0, 0]}
                >
                  {percentageData.map((entry, index) => (
                    <cell key={`cell-${index}`} fill={entry.percentChange >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No data available for performance comparison</p>
            </div>
          )}
        </div>

        {/* Individual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {coinSymbols.map((symbol, index) => {
            const data = coinsData[symbol] || [];

            return (
              <div key={symbol} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors[index % colors.length] }}>
                  {symbol.toUpperCase()} - Individual Chart
                </h3>

                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
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
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#F3F4F6' }}
                        formatter={(value) => `$${Number(value).toLocaleString()}`}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={false}
                        name="Close Price"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No data available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading comparison...</p>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
