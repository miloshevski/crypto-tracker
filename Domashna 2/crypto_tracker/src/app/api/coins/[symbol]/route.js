import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get('interval') || 'max';

    // First, get the latest date available for this symbol
    const { data: latestData, error: latestError } = await supabase
      .from('crypto_data')
      .select('date')
      .eq('symbol', symbol.toUpperCase())
      .order('date', { ascending: false })
      .limit(1);

    if (latestError) throw latestError;

    if (!latestData || latestData.length === 0) {
      return NextResponse.json({ data: [], message: 'No data available for this symbol' });
    }

    const latestDate = new Date(latestData[0].date);

    // Calculate date range based on interval FROM the latest date
    let dateFilter = null;

    switch (interval) {
      case 'week':
        const weekAgo = new Date(latestDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(latestDate);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(latestDate);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        dateFilter = yearAgo.toISOString().split('T')[0];
        break;
      case '5years':
        const fiveYearsAgo = new Date(latestDate);
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        dateFilter = fiveYearsAgo.toISOString().split('T')[0];
        break;
      case 'max':
      default:
        dateFilter = null; // Show all available data
    }

    // Build query to get data up to the latest date
    // Strategy: For all intervals, query in DESCENDING order (newest first),
    // apply a generous limit, then reverse to get chronological order
    // This ensures we always get data UP TO the latest date

    let limit;
    switch (interval) {
      case 'week':
        limit = 50; // More than enough for 7 days
        break;
      case 'month':
        limit = 100; // More than enough for 30 days
        break;
      case 'year':
        limit = 500; // More than enough for 365 days
        break;
      case '5years':
        limit = 3000; // More than enough for ~1825 days
        break;
      case 'max':
      default:
        limit = 10000; // All available data (covers ~27 years of daily data)
    }

    // Query in DESCENDING order (newest first)
    let query = supabase
      .from('crypto_data')
      .select('date, open, high, low, close, volume, symbol, exchange')
      .eq('symbol', symbol.toUpperCase())
      .order('date', { ascending: false })
      .limit(limit);

    // For filtered intervals, still apply the date filter
    // This gets the most recent data within the range
    if (dateFilter) {
      query = query.gte('date', dateFilter);
    }

    const { data: descendingData, error } = await query;

    if (error) throw error;

    // Reverse to get chronological order (oldest to newest)
    const data = descendingData ? descendingData.reverse() : [];

    return NextResponse.json({
      data: data,
      latestDate: latestData[0].date,
      totalPoints: data.length
    });
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return NextResponse.json({ error: error.message, data: [] }, { status: 500 });
  }
}
