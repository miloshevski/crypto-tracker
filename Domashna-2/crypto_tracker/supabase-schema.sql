-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_symbol VARCHAR(20) NOT NULL,
  coin_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, coin_symbol)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_coin_symbol ON public.user_favorites(coin_symbol);

-- Disable Row Level Security (RLS)
ALTER TABLE public.user_favorites DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to all roles
GRANT ALL ON public.user_favorites TO anon;
GRANT ALL ON public.user_favorites TO authenticated;
GRANT ALL ON public.user_favorites TO service_role;
