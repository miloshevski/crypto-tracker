'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const isFavorite = (coinSymbol) => {
    return favorites.some(fav => fav.coin_symbol === coinSymbol);
  };

  const toggleFavorite = async (coin) => {
    if (!user) {
      return false; // Return false to indicate action was blocked
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return false;
      }

      const favorite = isFavorite(coin.symbol);

      if (favorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?symbol=${coin.symbol}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          setFavorites(prev => prev.filter(fav => fav.coin_symbol !== coin.symbol));
          return true;
        } else {
          throw new Error('Failed to remove favorite');
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            coin_symbol: coin.symbol,
            coin_name: coin.name,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setFavorites(prev => [...prev, data.favorite]);
          return true;
        } else {
          throw new Error('Failed to add favorite');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites. Please try again.');
      return false;
    }
  };

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
};
