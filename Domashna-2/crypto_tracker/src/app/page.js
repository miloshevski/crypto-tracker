'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    exchange: 'all',
    dataStatus: 'all',
    activity: 'all',
    trend: 'all',
  });
  const router = useRouter();

  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    try {
      const response = await fetch('/api/coins');
      const data = await response.json();
      setCoins(data.coins || []);
    } catch (error) {
      console.error('Error fetching coins:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock trend data for visualization
  const getTrendData = (symbol) => {
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const points = 12;
    const data = [];
    let value = 50 + (seed % 30);

    for (let i = 0; i < points; i++) {
      value += (Math.sin(seed + i) * 10) + ((seed % 3) - 1) * 2;
      value = Math.max(20, Math.min(80, value));
      data.push(value);
    }
    return data;
  };

  const getExchanges = (coin) => {
    // Determine which exchanges have this coin based on has_data
    const allExchanges = ['Binance', 'Coinbase', 'Kraken'];
    if (!coin.has_data) return [];

    const seed = coin.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = (seed % 3) + 1;
    return allExchanges.slice(0, count);
  };

  const getActivityLevel = (rank) => {
    if (!rank) return { level: 'Low', color: 'text-slate-500', bg: 'bg-slate-700' };
    if (rank <= 20) return { level: 'Very High', color: 'text-green-400', bg: 'bg-green-900/30' };
    if (rank <= 100) return { level: 'High', color: 'text-blue-400', bg: 'bg-blue-900/30' };
    if (rank <= 300) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
    return { level: 'Low', color: 'text-slate-400', bg: 'bg-slate-700/30' };
  };

  const filteredCoins = coins
    .filter(coin => {
      // Search filter
      const matchesSearch = coin.symbol?.toLowerCase().includes(search.toLowerCase()) ||
                           coin.name?.toLowerCase().includes(search.toLowerCase());

      // Exchange filter
      const exchanges = getExchanges(coin);
      const matchesExchange = filters.exchange === 'all' ||
                             exchanges.includes(filters.exchange);

      // Data status filter
      const matchesDataStatus = filters.dataStatus === 'all' ||
                                (filters.dataStatus === 'available' && coin.has_data) ||
                                (filters.dataStatus === 'unavailable' && !coin.has_data);

      // Activity filter
      const activity = getActivityLevel(coin.rank);
      const matchesActivity = filters.activity === 'all' ||
                             activity.level === filters.activity;

      // Trend filter
      const trendData = getTrendData(coin.symbol);
      const isPositive = trendData[trendData.length - 1] > trendData[0];
      const matchesTrend = filters.trend === 'all' ||
                          (filters.trend === 'up' && isPositive) ||
                          (filters.trend === 'down' && !isPositive);

      return matchesSearch && matchesExchange && matchesDataStatus && matchesActivity && matchesTrend;
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleCoinSelection = (coin) => {
    setSelectedCoins(prev => {
      const isSelected = prev.some(c => c.symbol === coin.symbol);
      if (isSelected) {
        return prev.filter(c => c.symbol !== coin.symbol);
      } else {
        // Limit to 5 coins
        if (prev.length >= 5) {
          alert('Maximum 5 coins can be selected for comparison');
          return prev;
        }
        return [...prev, coin];
      }
    });
  };

  const handleCompare = () => {
    if (selectedCoins.length < 2) {
      alert('Please select at least 2 coins to compare');
      return;
    }
    const symbols = selectedCoins.map(c => c.symbol).join(',');
    router.push(`/compare?coins=${symbols}`);
  };

  const toggleFavorite = (coin) => {
    setFavorites(prev => {
      const isFavorite = prev.some(c => c.symbol === coin.symbol);
      if (isFavorite) {
        return prev.filter(c => c.symbol !== coin.symbol);
      } else {
        return [...prev, coin];
      }
    });
  };

  const toggleRowExpansion = (coinSymbol) => {
    setExpandedRow(prev => prev === coinSymbol ? null : coinSymbol);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading cryptocurrencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-6">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between py-4">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  CryptoTracker Pro
                </h1>
                <p className="text-xs text-slate-400 font-medium">Real-time Market Analytics</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
              <Link
                href="/"
                className="px-4 py-2 bg-slate-700 rounded-md text-white font-medium transition-all"
              >
                Markets
              </Link>
              <Link
                href="/compare"
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md font-medium transition-all"
              >
                Compare
              </Link>
              <Link
                href="#"
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md font-medium transition-all"
              >
                Portfolio
              </Link>
              <Link
                href="#"
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md font-medium transition-all"
              >
                Favorites
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 text-slate-300 hover:text-white font-medium transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-slate-700/50 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-400">Live Data</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Total Assets:</span>
                  <span className="ml-2 text-white font-bold">{coins.length}</span>
                </div>
                {coins.length > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Showing:</span>
                    <span className="ml-2 text-blue-400 font-bold">{filteredCoins.length}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Powered by</span>
                  <span className="font-semibold text-slate-300">Binance</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-semibold text-slate-300">Coinbase</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-semibold text-slate-300">Kraken</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-4 border border-slate-700/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
            />
          </div>
        </div>

        {/* Filter Dashboard */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-slate-600/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-lg font-bold text-white">Filters</h3>
            </div>
            <button
              onClick={() => setFilters({ exchange: 'all', dataStatus: 'all', activity: 'all', trend: 'all' })}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Exchange Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Exchange
              </label>
              <select
                value={filters.exchange}
                onChange={(e) => setFilters({ ...filters, exchange: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">All Exchanges</option>
                <option value="Binance">Binance</option>
                <option value="Coinbase">Coinbase</option>
                <option value="Kraken">Kraken</option>
              </select>
            </div>

            {/* Data Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Data Status
              </label>
              <select
                value={filters.dataStatus}
                onChange={(e) => setFilters({ ...filters, dataStatus: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">All</option>
                <option value="available">Data Available</option>
                <option value="unavailable">No Data</option>
              </select>
            </div>

            {/* Activity Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Activity Level
              </label>
              <select
                value={filters.activity}
                onChange={(e) => setFilters({ ...filters, activity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">All Levels</option>
                <option value="Very High">Very High</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Trend Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Trend Direction
              </label>
              <select
                value={filters.trend}
                onChange={(e) => setFilters({ ...filters, trend: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="all">All Trends</option>
                <option value="up">Up Trend</option>
                <option value="down">Down Trend</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(filters.exchange !== 'all' || filters.dataStatus !== 'all' || filters.activity !== 'all' || filters.trend !== 'all') && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-400">Active filters:</span>
                {filters.exchange !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-300 rounded-md text-xs border border-blue-700/50">
                    Exchange: {filters.exchange}
                    <button onClick={() => setFilters({ ...filters, exchange: 'all' })} className="hover:text-blue-100">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.dataStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-300 rounded-md text-xs border border-green-700/50">
                    Data: {filters.dataStatus === 'available' ? 'Available' : 'Unavailable'}
                    <button onClick={() => setFilters({ ...filters, dataStatus: 'all' })} className="hover:text-green-100">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.activity !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 text-purple-300 rounded-md text-xs border border-purple-700/50">
                    Activity: {filters.activity}
                    <button onClick={() => setFilters({ ...filters, activity: 'all' })} className="hover:text-purple-100">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.trend !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded-md text-xs border border-yellow-700/50">
                    Trend: {filters.trend === 'up' ? 'Up' : 'Down'}
                    <button onClick={() => setFilters({ ...filters, trend: 'all' })} className="hover:text-yellow-100">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coins Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <p className="text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Click on any row to view detailed information and quick actions
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-4 text-left">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Exchanges
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredCoins.map((coin, index) => {
                  const isSelected = selectedCoins.some(c => c.symbol === coin.symbol);
                  const isFavorite = favorites.some(c => c.symbol === coin.symbol);
                  const isExpanded = expandedRow === coin.symbol;
                  const trendData = getTrendData(coin.symbol);
                  const exchanges = getExchanges(coin);
                  const activity = getActivityLevel(coin.rank);
                  const isPositiveTrend = trendData[trendData.length - 1] > trendData[0];
                  return (
                    <React.Fragment key={`${coin.symbol}-${index}`}>
                      <tr
                        className={`transition-all hover:bg-slate-700/30 cursor-pointer ${
                          isSelected ? 'bg-purple-900/20 border-l-4 border-purple-500' : 'border-l-4 border-transparent'
                        } ${isExpanded ? 'bg-slate-700/50' : ''}`}
                        onClick={() => toggleRowExpansion(coin.symbol)}
                      >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(coin)}
                          className="group transition-all hover:scale-110"
                        >
                          {isFavorite ? (
                            <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-600 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {coin.symbol?.charAt(0) || '?'}
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="text-white font-medium">
                            {coin.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-blue-400 font-bold font-mono">
                          {coin.symbol}
                        </span>
                      </td>

                      {/* Exchanges Column */}
                      <td className="px-4 py-4">
                        {exchanges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {exchanges.map(exchange => (
                              <span
                                key={exchange}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                  exchange === 'Binance' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50' :
                                  exchange === 'Coinbase' ? 'bg-blue-900/30 text-blue-300 border-blue-700/50' :
                                  'bg-purple-900/30 text-purple-300 border-purple-700/50'
                                }`}
                              >
                                {exchange}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">N/A</span>
                        )}
                      </td>

                      {/* Trend Column */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block text-sm font-semibold ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositiveTrend ? '↗ Up' : '↘ Down'}
                        </span>
                      </td>

                      {/* Activity Column */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block text-sm font-medium ${activity.color} whitespace-nowrap`}>
                          {activity.level}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-4 text-center">
                        {coin.has_data ? (
                          <span className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 text-xs px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Data
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-900/30 text-red-400 text-xs px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            No Data
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isSelected ? (
                            <button
                              onClick={() => toggleCoinSelection(coin)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Selected
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleCoinSelection(coin)}
                              disabled={selectedCoins.length >= 5}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-700 disabled:hover:text-slate-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Compare
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(coin.symbol);
                            }}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Content */}
                    {isExpanded && (
                      <tr className="bg-slate-800/80">
                        <td colSpan="8" className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Quick Stats */}
                            <div className="md:col-span-2 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">
                                  {coin.name} ({coin.symbol})
                                </h3>
                                {coin.rank && (
                                  <span className="text-sm text-slate-400">
                                    Rank #{coin.rank}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-700/50 rounded-lg p-4">
                                  <div className="text-xs text-slate-400 mb-1">Data Status</div>
                                  <div className="flex items-center gap-2">
                                    {coin.has_data ? (
                                      <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-semibold text-green-400">Available</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-sm font-semibold text-red-400">Unavailable</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2">
                                    {coin.has_data ? 'Historical OHLCV data available' : 'No trading data found'}
                                  </p>
                                </div>

                                <div className="bg-slate-700/50 rounded-lg p-4">
                                  <div className="text-xs text-slate-400 mb-1">Trading Activity</div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <div
                                          key={i}
                                          className={`w-1.5 h-4 rounded-sm ${
                                            i < (activity.level === 'Very High' ? 5 : activity.level === 'High' ? 4 : activity.level === 'Medium' ? 3 : 1)
                                              ? activity.color.replace('text-', 'bg-')
                                              : 'bg-slate-700'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className={`text-sm font-semibold ${activity.color}`}>
                                      {activity.level}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2">Market activity level</p>
                                </div>
                              </div>

                              <div className="bg-slate-700/50 rounded-lg p-4">
                                <div className="text-xs text-slate-400 mb-2">Available Exchanges</div>
                                {exchanges.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {exchanges.map(exchange => (
                                      <span
                                        key={exchange}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border ${
                                          exchange === 'Binance' ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50' :
                                          exchange === 'Coinbase' ? 'bg-blue-900/40 text-blue-300 border-blue-700/50' :
                                          'bg-purple-900/40 text-purple-300 border-purple-700/50'
                                        }`}
                                      >
                                        {exchange}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500">No exchange data available</p>
                                )}
                              </div>

                              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-blue-300 mb-1">Market Information</div>
                                    <p className="text-xs text-slate-400">
                                      This cryptocurrency is tracked across multiple exchanges including Binance, Coinbase, and Kraken.
                                      {coin.has_data ? ' Click "View Full Analysis" to see detailed charts and historical data.' : ' Historical data currently unavailable.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quick Actions</h4>

                              <Link
                                href={`/coin/${coin.symbol}`}
                                className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-center transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  View Full Analysis
                                </div>
                              </Link>

                              {isSelected ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCoinSelection(coin);
                                  }}
                                  className="block w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-center transition-all"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Remove from Compare
                                  </div>
                                </button>
                              ) : selectedCoins.length < 5 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCoinSelection(coin);
                                  }}
                                  className="block w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-center transition-all"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add to Compare
                                  </div>
                                </button>
                              ) : (
                                <div className="block w-full px-4 py-3 bg-slate-800 text-slate-500 rounded-lg font-semibold text-center border border-slate-700">
                                  <div className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Compare Limit Reached (5/5)
                                  </div>
                                </div>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(coin);
                                }}
                                className={`block w-full px-4 py-3 rounded-lg font-semibold text-center transition-all ${
                                  isFavorite
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                </div>
                              </button>

                              <div className="pt-3 border-t border-slate-700">
                                <div className="text-xs text-slate-500 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Selected for compare:</span>
                                    <span className={isSelected ? 'text-purple-400 font-semibold' : 'text-slate-400'}>
                                      {isSelected ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Favorited:</span>
                                    <span className={isFavorite ? 'text-yellow-400 font-semibold' : 'text-slate-400'}>
                                      {isFavorite ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredCoins.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/30">
              <div className="flex items-center justify-between text-sm">
                <div className="text-slate-400">
                  Showing <span className="text-white font-semibold">{filteredCoins.length}</span> of{' '}
                  <span className="text-white font-semibold">{coins.length}</span> cryptocurrencies
                </div>
                <div className="flex items-center gap-4">
                  {favorites.length > 0 && (
                    <div className="flex items-center gap-1.5 text-yellow-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="font-semibold">{favorites.length} favorited</span>
                    </div>
                  )}
                  <span className={`font-semibold ${
                    selectedCoins.length >= 5 ? 'text-yellow-400' :
                    selectedCoins.length > 0 ? 'text-purple-400' : 'text-slate-400'
                  }`}>
                    {selectedCoins.length}/5 selected
                  </span>
                  {selectedCoins.length >= 5 && (
                    <span className="text-xs text-yellow-400">(max reached)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredCoins.length === 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
            <svg className="w-20 h-20 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-xl text-gray-400 mb-2">No cryptocurrencies found</p>
            <p className="text-sm text-gray-500 mb-6">No results matching "{search}"</p>
            <button
              onClick={() => setSearch('')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-500/20"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Floating Compare Button */}
      {selectedCoins.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-2xl shadow-purple-500/50 p-5 border border-purple-400/20">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="font-bold">{selectedCoins.length} coin{selectedCoins.length !== 1 ? 's' : ''} selected</p>
                <p className="text-purple-100 text-xs">
                  {selectedCoins.map(c => c.symbol).join(', ')}
                </p>
              </div>
              <button
                onClick={handleCompare}
                className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Compare</span>
              </button>
              <button
                onClick={() => setSelectedCoins([])}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                title="Clear selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400">
          <p>Data sourced from Binance, Coinbase, and Kraken via Pipe and Filter Architecture</p>
          <p className="text-sm mt-2">Software Design and Architecture - FINKI UKIM 2024/2025</p>
        </div>
      </footer>
    </div>
  );
}
