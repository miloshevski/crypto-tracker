-- ALTER script for existing crypto_metadata table
-- Adds index on last_sync_date for performance

-- last_sync_date column already exists, just add index
CREATE INDEX IF NOT EXISTS idx_metadata_last_sync_date
ON public.crypto_metadata USING btree (last_sync_date)
TABLESPACE pg_default;

-- Verify the column exists and has correct type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'crypto_metadata'
    AND column_name = 'last_sync_date'
    AND data_type = 'date'
  ) THEN
    RAISE NOTICE 'Column last_sync_date already exists with correct type';
  END IF;
END $$;

-- Optional: Clean up unused columns if you want (commented out for safety)
-- Uncomment only if you're sure you don't need these columns:

/*
ALTER TABLE public.crypto_metadata
  DROP COLUMN IF EXISTS exchange,
  DROP COLUMN IF EXISTS trading_pairs,
  DROP COLUMN IF EXISTS first_available_date,
  DROP COLUMN IF EXISTS data_completeness_percent,
  DROP COLUMN IF EXISTS is_delisted,
  DROP COLUMN IF EXISTS delisted_date,
  DROP COLUMN IF EXISTS coinmarketcap_id,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS website_url;
*/

-- Show current schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'crypto_metadata'
ORDER BY ordinal_position;

COMMENT ON COLUMN crypto_metadata.last_sync_date IS 'Last date for which we have OHLCV data in crypto_data table. Used for incremental daily updates.';
COMMENT ON COLUMN crypto_metadata.coingecko_id IS 'CoinGecko API ID (e.g., "bitcoin", "ethereum") - used for fallback API calls';
COMMENT ON COLUMN crypto_metadata.binance_symbol IS 'Binance trading pair symbol (e.g., "BTCUSDT", "ETHUSDT") - used for primary data source';
