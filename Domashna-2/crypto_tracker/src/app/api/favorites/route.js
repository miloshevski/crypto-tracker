import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch user's favorite coins
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error in GET /api/favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a coin to favorites
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { coin_symbol, coin_name } = body;

    if (!coin_symbol) {
      return NextResponse.json({ error: 'coin_symbol is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .insert([
        {
          user_id: user.id,
          coin_symbol: coin_symbol,
          coin_name: coin_name || coin_symbol,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ favorite: data });
  } catch (error) {
    console.error('Error in POST /api/favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a coin from favorites
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const coin_symbol = searchParams.get('symbol');

    if (!coin_symbol) {
      return NextResponse.json({ error: 'symbol parameter is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('coin_symbol', coin_symbol);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
