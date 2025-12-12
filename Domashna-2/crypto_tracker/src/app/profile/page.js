"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const {
    favorites,
    loading: favLoading,
    toggleFavorite,
    refetch,
  } = useFavorites();
  const [activeTab, setActiveTab] = useState("favorites");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push("/login");
    }
  };

  const handleRemoveFavorite = async (coin) => {
    const confirmed = window.confirm(
      `Remove ${coin.name || coin.symbol} from favorites?`
    );
    if (confirmed) {
      await toggleFavorite(coin);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5 rounded-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  CryptoTracker Pro
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  User Profile
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-5 py-2 text-slate-300 hover:text-white font-medium transition-all"
              >
                ← Back to Marketss
              </Link>
              <button
                onClick={handleSignOut}
                className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {user.user_metadata?.full_name || "User"}
              </h2>
              <p className="text-slate-400 text-lg mb-3">{user.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-300">Active Account</span>
                </div>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Member since{" "}
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-slate-700/50 rounded-lg px-6 py-4">
                <div className="text-3xl font-bold text-cyan-400">
                  {favorites.length}
                </div>
                <div className="text-sm text-slate-400">Favorite Coins</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === "favorites"
                  ? "bg-slate-700 text-white border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill={activeTab === "favorites" ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                Favorite Coins ({favorites.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-slate-700 text-white border-b-2 border-cyan-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === "favorites" && (
              <div>
                {favLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Loading favorites...</p>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-16">
                    <svg
                      className="w-24 h-24 mx-auto mb-4 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <h3 className="text-2xl font-bold mb-2">
                      No Favorite Coins Yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Start adding coins to your favorites to track them here!
                    </p>
                    <Link
                      href="/"
                      className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg font-semibold transition-all shadow-lg"
                    >
                      Browse Coins
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="bg-slate-700/50 rounded-lg border border-slate-600 p-5 hover:bg-slate-700 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                              {favorite.coin_symbol?.charAt(0) || "?"}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">
                                {favorite.coin_name || favorite.coin_symbol}
                              </h3>
                              <p className="text-cyan-400 font-mono text-sm">
                                {favorite.coin_symbol}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveFavorite({
                                symbol: favorite.coin_symbol,
                                name: favorite.coin_name,
                              })
                            }
                            className="text-yellow-400 hover:text-red-400 transition-colors"
                            title="Remove from favorites"
                          >
                            <svg
                              className="w-6 h-6 fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Added{" "}
                          {new Date(favorite.created_at).toLocaleDateString()}
                        </div>

                        <Link
                          href={`/coin/${favorite.coin_symbol}`}
                          className="block w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-center transition-all"
                        >
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                  <h3 className="text-xl font-bold mb-4">
                    Account Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={user.user_metadata?.full_name || ""}
                        disabled
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-400 mb-2">
                        User ID
                      </label>
                      <input
                        type="text"
                        value={user.id || ""}
                        disabled
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-300 font-mono text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2 text-red-400">
                    Danger Zone
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                    onClick={() =>
                      alert("Account deletion is not yet implemented")
                    }
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
