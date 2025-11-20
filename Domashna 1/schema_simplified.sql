-- Simplified crypto_metadata schema
-- Only essential columns for daily updates

CREATE TABLE IF NOT EXISTS public.crypto_metadata (
  id BIGSERIAL NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  rank INTEGER NULL,
  coingecko_id VARCHAR(100) NULL,
  binance_symbol VARCHAR(20) NULL,
  last_sync_date DATE NULL,
  total_records INTEGER NULL DEFAULT 0,
  is_active BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT crypto_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT crypto_metadata_symbol_key UNIQUE (symbol)
) TABLESPACE pg_default;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_metadata_symbol ON public.crypto_metadata USING btree (symbol) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_metadata_rank ON public.crypto_metadata USING btree (rank) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_metadata_is_active ON public.crypto_metadata USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_metadata_coingecko_id ON public.crypto_metadata USING btree (coingecko_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_metadata_last_sync_date ON public.crypto_metadata USING btree (last_sync_date) TABLESPACE pg_default;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_crypto_metadata_updated_at ON crypto_metadata;
CREATE TRIGGER update_crypto_metadata_updated_at
  BEFORE UPDATE ON crypto_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN crypto_metadata.last_sync_date IS 'Last date for which we have data in crypto_data table';
COMMENT ON COLUMN crypto_metadata.coingecko_id IS 'CoinGecko ID (e.g., "bitcoin", "ethereum")';
COMMENT ON COLUMN crypto_metadata.binance_symbol IS 'Binance trading pair (e.g., "BTCUSDT", "ETHUSDT")';
