'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCoins, setSelectedCoins] = useState([]);
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

  const filteredCoins = coins
    .filter(coin =>
      coin.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      coin.name?.toLowerCase().includes(search.toLowerCase())
    )
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
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🚀 Crypto Exchange Analyzer</h1>
              <p className="text-gray-400">Top 1000 Cryptocurrencies - Live Data from Supabase</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg font-semibold transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all"
              >
                Sign Up
              </Link>
            </div>
          </div>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-300 font-semibold">
              Total Coins: <span className="text-white text-xl">{coins.length}</span>
              {coins.length > 0 && (
                <span className="ml-4 text-gray-400">
                  (Showing {filteredCoins.length} after search)
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <input
            type="text"
            placeholder="🔍 Search by name or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>

        {/* Coins List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoins.map((coin, index) => {
            const isSelected = selectedCoins.some(c => c.symbol === coin.symbol);
            return (
              <div
                key={`${coin.symbol}-${index}`}
                className={`bg-gray-800 border rounded-lg p-5 transition-all hover:shadow-lg ${
                  isSelected
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700 hover:border-blue-500 hover:shadow-blue-500/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCoinSelection(coin)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold font-mono text-blue-400">{coin.symbol}</span>
                        {coin.rank && (
                          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                            #{coin.rank}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{coin.name || 'Unknown'}</p>
                    </div>
                  </div>
                  {coin.has_data ? (
                    <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded">
                      ✓ Data
                    </span>
                  ) : (
                    <span className="bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded">
                      No Data
                    </span>
                  )}
                </div>

                <div className="mb-4 text-sm text-gray-500">
                  Click button below to view historical OHLCV chart
                </div>

                <Link
                  href={`/coin/${coin.symbol}`}
                  className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg font-bold transition-all transform hover:scale-105"
                >
                  📊 Show Graph
                </Link>
              </div>
            );
          })}
        </div>

        {filteredCoins.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-400">No cryptocurrencies found matching "{search}"</p>
            <button
              onClick={() => setSearch('')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Floating Compare Button */}
      {selectedCoins.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="bg-purple-600 text-white rounded-full shadow-2xl shadow-purple-500/50 p-4">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="font-bold">{selectedCoins.length} coin{selectedCoins.length !== 1 ? 's' : ''} selected</p>
                <p className="text-purple-200 text-xs">
                  {selectedCoins.map(c => c.symbol).join(', ')}
                </p>
              </div>
              <button
                onClick={handleCompare}
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-purple-50 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <span>⚖️ Compare</span>
              </button>
              <button
                onClick={() => setSelectedCoins([])}
                className="bg-purple-700 hover:bg-purple-800 p-2 rounded-full transition-colors"
                title="Clear selection"
              >
                ✕
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
