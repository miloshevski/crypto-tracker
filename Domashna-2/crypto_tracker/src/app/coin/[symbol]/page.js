'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { LineChart, Line, CandlestickChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import OverallSignal from '@/components/TechnicalAnalysis/OverallSignal';
import IndicatorsSection from '@/components/TechnicalAnalysis/IndicatorsSection';
import MetricsDisplay from '@/components/LSTM/MetricsDisplay';
import PredictionChart from '@/components/LSTM/PredictionChart';
import ConfigurationPanel from '@/components/LSTM/ConfigurationPanel';
import TrainingInfo from '@/components/LSTM/TrainingInfo';
import SentimentOverallSignal from '@/components/SentimentAnalysis/SentimentOverallSignal';
import SentimentMetricsSection from '@/components/SentimentAnalysis/SentimentMetricsSection';

export default function CoinPage({ params }) {
  const { symbol } = use(params);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState('max');
  const [chartType, setChartType] = useState('line');

  // Technical Analysis state
  const [activeTab, setActiveTab] = useState('charts');
  const [taTimeframe, setTaTimeframe] = useState('1w');
  const [taLoading, setTaLoading] = useState(false);
  const [taData, setTaData] = useState(null);
  const [taError, setTaError] = useState(null);

  // LSTM Prediction state
  const [lstmLoading, setLstmLoading] = useState(false);
  const [lstmData, setLstmData] = useState(null);
  const [lstmError, setLstmError] = useState(null);
  const [lstmConfig, setLstmConfig] = useState({
    lookback: 30,
    epochs: 50,
    days_ahead: 7
  });

  // Sentiment Analysis state
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState(null);
  const [sentimentError, setSentimentError] = useState(null);

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

  // Fetch Technical Analysis
  const fetchTechnicalAnalysis = async () => {
    if (!data || data.length === 0) {
      setTaError('No data available for technical analysis');
      return;
    }

    setTaLoading(true);
    setTaError(null);

    try {
      const response = await fetch('http://localhost:8000/api/technical-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          timeframe: taTimeframe
        })
      });

      if (!response.ok) {
        // Try to get detailed error message from API
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || response.statusText;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setTaData(result);
    } catch (error) {
      console.error('Error fetching technical analysis:', error);
      setTaError(error.message || 'Failed to fetch technical analysis');
    } finally {
      setTaLoading(false);
    }
  };

  // Fetch TA when tab is activated or timeframe changes
  useEffect(() => {
    if (activeTab === 'technical-analysis' && data.length > 0) {
      fetchTechnicalAnalysis();
    }
  }, [activeTab, taTimeframe, data]);

  // Fetch LSTM Prediction
  const fetchLSTMPrediction = async () => {
    if (!data || data.length < 100) {
      setLstmError('Insufficient data. Need at least 100 data points for LSTM prediction.');
      return;
    }

    setLstmLoading(true);
    setLstmError(null);

    try {
      const response = await fetch('http://localhost:8000/api/lstm-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          lookback: lstmConfig.lookback,
          epochs: lstmConfig.epochs,
          days_ahead: lstmConfig.days_ahead
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || response.statusText;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setLstmData(result);
    } catch (error) {
      console.error('Error fetching LSTM prediction:', error);
      setLstmError(error.message || 'Failed to generate LSTM prediction');
    } finally {
      setLstmLoading(false);
    }
  };

  const handleLstmConfigChange = (key, value) => {
    setLstmConfig(prev => ({ ...prev, [key]: value }));
  };

  // Fetch Sentiment Analysis
  const fetchSentimentAnalysis = async () => {
    setSentimentLoading(true);
    setSentimentError(null);

    try {
      const response = await fetch('http://localhost:8000/api/sentiment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol.toLowerCase(),
          sources: ['twitter', 'reddit', 'news']
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || response.statusText;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSentimentData(result);
    } catch (error) {
      console.error('Error fetching sentiment analysis:', error);
      setSentimentError(error.message || 'Failed to fetch sentiment analysis');
    } finally {
      setSentimentLoading(false);
    }
  };

  // Fetch sentiment when tab is activated
  useEffect(() => {
    if (activeTab === 'sentiment-analysis') {
      fetchSentimentAnalysis();
    }
  }, [activeTab, symbol]);

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

      {/* Tab Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800/50 rounded-xl p-1.5 inline-flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'charts'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-2">📊</span>
            Price Charts
          </button>
          <button
            onClick={() => setActiveTab('technical-analysis')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'technical-analysis'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-2">📈</span>
            Technical Analysis
          </button>
          <button
            onClick={() => setActiveTab('lstm-prediction')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'lstm-prediction'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-2">🧠</span>
            LSTM Prediction
          </button>
          <button
            onClick={() => setActiveTab('sentiment-analysis')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'sentiment-analysis'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="mr-2">💭</span>
            Sentiment Analysis
          </button>
        </div>

        {/* Price Charts Tab */}
        {activeTab === 'charts' && (
          <>
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
        </>
        )}

        {/* Technical Analysis Tab */}
        {activeTab === 'technical-analysis' && (
          <div>
            {/* Timeframe Selection */}
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-5 mb-6">
              <label className="block text-gray-400 text-sm mb-3 font-medium">Timeframe</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTaTimeframe('1d')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    taTimeframe === '1d'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  1 Day
                </button>
                <button
                  onClick={() => setTaTimeframe('1w')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    taTimeframe === '1w'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  1 Week
                </button>
                <button
                  onClick={() => setTaTimeframe('1m')}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    taTimeframe === '1m'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 border border-transparent'
                  }`}
                >
                  1 Month
                </button>
              </div>
            </div>

            {/* Loading State */}
            {taLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-gray-400 mt-6 text-sm">Analyzing market indicators...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {taError && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xl">⚠</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-semibold mb-1">Analysis Error</h3>
                    <p className="text-gray-400 text-sm mb-3">{taError}</p>
                    <button
                      onClick={fetchTechnicalAnalysis}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Analysis Results */}
            {!taLoading && !taError && taData && (
              <>
                {/* Overall Signal */}
                <OverallSignal
                  signal={taData.overall.signal}
                  score={taData.overall.score}
                  buyCount={taData.overall.buyCount}
                  sellCount={taData.overall.sellCount}
                  holdCount={taData.overall.holdCount}
                  totalIndicators={taData.overall.totalIndicators}
                />

                {/* Disclaimer */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-400 text-lg">!</span>
                    </div>
                    <div>
                      <h4 className="text-amber-400 font-semibold text-sm mb-1">Educational Purpose Only</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        This technical analysis is provided for educational and informational purposes.
                        It should not be considered as financial or investment advice.
                        Always conduct your own research and consult with qualified financial advisors before making investment decisions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Oscillators */}
                <IndicatorsSection
                  title="Oscillators"
                  indicators={taData.oscillators}
                  icon="🔄"
                />

                {/* Moving Averages */}
                <IndicatorsSection
                  title="Moving Averages"
                  indicators={taData.movingAverages}
                  icon="📊"
                />

                {/* Analysis Info */}
                <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Data Points Analyzed</span>
                    <span className="text-white font-medium">{taData.dataPoints}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-400">Timeframe</span>
                    <span className="text-white font-medium">{taTimeframe === '1d' ? '1 Day' : taTimeframe === '1w' ? '1 Week' : '1 Month'}</span>
                  </div>
                </div>
              </>
            )}

            {/* Initial State - No Data Yet */}
            {!taLoading && !taError && !taData && (
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Technical Analysis</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Comprehensive market analysis using 10 technical indicators across multiple timeframes.
                  Select a timeframe above to begin analyzing {symbol.toUpperCase()}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* LSTM Prediction Tab */}
        {activeTab === 'lstm-prediction' && (
          <div className="space-y-6">
            {/* Configuration Panel */}
            <ConfigurationPanel
              config={lstmConfig}
              onChange={handleLstmConfigChange}
              onPredict={fetchLSTMPrediction}
              loading={lstmLoading}
            />

            {/* Loading State */}
            {lstmLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-gray-400 mt-6 text-sm">Training LSTM model and generating predictions...</p>
                  <p className="text-gray-500 mt-2 text-xs">This may take 30-60 seconds</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {lstmError && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xl">⚠</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-semibold mb-1">Prediction Error</h3>
                    <p className="text-gray-400 text-sm mb-3">{lstmError}</p>
                    <button
                      onClick={fetchLSTMPrediction}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LSTM Results */}
            {!lstmLoading && !lstmError && lstmData && (
              <>
                {/* Disclaimer */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-400 text-lg">!</span>
                    </div>
                    <div>
                      <h4 className="text-amber-400 font-semibold text-sm mb-1">Educational Purpose Only</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        LSTM predictions are experimental and for educational purposes only.
                        Machine learning models cannot predict future prices with certainty.
                        This is not financial advice. Do your own research and consult professionals before investing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics Display */}
                <MetricsDisplay metrics={lstmData.metrics} />

                {/* Prediction Chart */}
                <PredictionChart
                  historicalData={data}
                  predictions={lstmData.predictions}
                />

                {/* Training Info */}
                <TrainingInfo training={lstmData.training} />
              </>
            )}

            {/* Initial State - No Data Yet */}
            {!lstmLoading && !lstmError && !lstmData && (
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">🧠</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">LSTM Price Prediction</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
                  Advanced neural network model to predict future {symbol.toUpperCase()} prices based on historical patterns.
                  Configure the model parameters above and click "Generate Predictions" to begin.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span>Lookback: {lstmConfig.lookback} days</span>
                  <span>•</span>
                  <span>Epochs: {lstmConfig.epochs}</span>
                  <span>•</span>
                  <span>Forecast: {lstmConfig.days_ahead} days</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sentiment Analysis Tab */}
        {activeTab === 'sentiment-analysis' && (
          <div className="bg-gray-800 rounded-lg p-6">
            {/* Loading State */}
            {sentimentLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">💭</span>
                  </div>
                </div>
                <p className="text-gray-400 mt-6 font-medium">Analyzing market sentiment...</p>
                <p className="text-gray-500 mt-2 text-xs">Checking social media, news, and community discussions</p>
              </div>
            )}

            {/* Error State */}
            {sentimentError && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xl">⚠</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-semibold mb-1">Sentiment Analysis Error</h3>
                    <p className="text-gray-400 text-sm mb-3">{sentimentError}</p>
                    <button
                      onClick={fetchSentimentAnalysis}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sentiment Results */}
            {!sentimentLoading && !sentimentError && sentimentData && (
              <div className="space-y-6">
                {/* Overall Signal */}
                <SentimentOverallSignal
                  overall={sentimentData.overall}
                  symbol={symbol.toUpperCase()}
                />

                {/* Metrics Section */}
                <SentimentMetricsSection metrics={sentimentData.metrics} />

                {/* Last Updated */}
                <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50">
                  Last updated: {new Date(sentimentData.lastUpdated).toLocaleString()}
                </div>
              </div>
            )}

            {/* Initial State - No Data Yet */}
            {!sentimentLoading && !sentimentError && !sentimentData && (
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">💭</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Sentiment Analysis</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                  Analyze market sentiment for {symbol.toUpperCase()} from social media, news, and community discussions.
                  Get insights into public opinion and market mood.
                </p>
                <button
                  onClick={fetchSentimentAnalysis}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Analyze Sentiment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
