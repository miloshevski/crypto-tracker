import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get unique symbols from crypto_data
    const { data: symbolsData, error: symbolsError } = await supabase
      .rpc('get_unique_symbols');

    // If RPC doesn't exist, fallback to direct query
    if (symbolsError) {
      const { data: coins, error } = await supabase
        .from('crypto_metadata')
        .select('symbol, name, rank')
        .limit(1000);

      if (error) throw error;

      const formattedCoins = (coins || []).map(coin => ({
        symbol: coin.symbol,
        name: coin.name || coin.symbol,
        rank: coin.rank || 0,
        has_data: true
      }));

      return NextResponse.json({
        coins: formattedCoins,
        total: formattedCoins.length
      });
    }

    // Format symbols from RPC
    const formattedCoins = (symbolsData || []).map((item, index) => ({
      symbol: item.symbol,
      name: item.name || item.symbol,
      rank: item.rank || index + 1,
      has_data: true
    }));

    return NextResponse.json({
      coins: formattedCoins,
      total: formattedCoins.length
    });
  } catch (error) {
    console.error('Error fetching coins:', error);
    return NextResponse.json({
      error: error.message,
      coins: [],
      total: 0
    }, { status: 500 });
  }
}
