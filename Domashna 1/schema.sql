-- =====================================================
-- CRYPTO EXCHANGE ANALYZER - DATABASE SCHEMA
-- =====================================================
-- Project: Crypto Exchange Analyzer
-- Course: Software Design and Architecture - FINKI UKIM
-- Architecture: Pipe and Filter Pattern
-- Database: PostgreSQL (Supabase)
-- =====================================================

-- =====================================================
-- TABLE 1: crypto_data
-- Main table for storing OHLCV data and market metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS crypto_data (
  id BIGSERIAL PRIMARY KEY,

  -- Symbol Information
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),

  -- Date
  date DATE NOT NULL,

  -- OHLCV Data (Open, High, Low, Close, Volume)
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,

  -- 24H Metrics
  last_price_24h DECIMAL(20, 8),
  volume_24h DECIMAL(20, 8),
  high_24h DECIMAL(20, 8),
  low_24h DECIMAL(20, 8),
  change_24h_percent DECIMAL(10, 4),

  -- Market Data
  market_cap DECIMAL(25, 2),
  liquidity DECIMAL(20, 8),
  rank INTEGER,

  -- Metadata
  exchange VARCHAR(50) DEFAULT 'binance',
  quote_currency VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one record per symbol per date per exchange
  UNIQUE(symbol, date, exchange)
);

-- Indexes for crypto_data table (Performance optimization)
CREATE INDEX IF NOT EXISTS idx_crypto_symbol ON crypto_data(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_date ON crypto_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_symbol_date ON crypto_data(symbol, date DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_rank ON crypto_data(rank) WHERE rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crypto_is_active ON crypto_data(is_active);

-- Comment on table
COMMENT ON TABLE crypto_data IS 'Main table storing daily OHLCV data and market metrics for cryptocurrencies';


-- =====================================================
-- TABLE 2: crypto_metadata
-- Symbol information and sync status tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS crypto_metadata (
  id BIGSERIAL PRIMARY KEY,

  -- Symbol Information
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  rank INTEGER,

  -- Exchange Information
  exchange VARCHAR(50),
  trading_pairs TEXT[], -- Array of available trading pairs (e.g., ['BTC/USDT', 'BTC/USD'])

  -- Data Sync Status
  last_sync_date DATE,
  first_available_date DATE,
  data_completeness_percent DECIMAL(5, 2), -- Percentage of days with data
  total_records INTEGER DEFAULT 0,

  -- Status Flags
  is_active BOOLEAN DEFAULT true,
  is_delisted BOOLEAN DEFAULT false,
  delisted_date DATE,

  -- API Identifiers (for different data sources)
  coingecko_id VARCHAR(100),
  binance_symbol VARCHAR(20),
  coinmarketcap_id INTEGER,

  -- Additional Info
  description TEXT,
  website_url VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for crypto_metadata table
CREATE INDEX IF NOT EXISTS idx_metadata_symbol ON crypto_metadata(symbol);
CREATE INDEX IF NOT EXISTS idx_metadata_rank ON crypto_metadata(rank);
CREATE INDEX IF NOT EXISTS idx_metadata_is_active ON crypto_metadata(is_active);
CREATE INDEX IF NOT EXISTS idx_metadata_coingecko_id ON crypto_metadata(coingecko_id);

-- Comment on table
COMMENT ON TABLE crypto_metadata IS 'Metadata and sync status for each cryptocurrency symbol';


-- =====================================================
-- TABLE 3: pipeline_logs
-- Track pipeline execution and performance
-- =====================================================
CREATE TABLE IF NOT EXISTS pipeline_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Run Identification
  run_id UUID DEFAULT gen_random_uuid(),
  filter_name VARCHAR(50), -- 'filter1', 'filter2', 'filter3', 'full_pipeline'
  status VARCHAR(20) CHECK (status IN ('running', 'success', 'failed', 'partial')),

  -- Statistics
  symbols_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,

  -- Performance Metrics
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Details
  error_message TEXT,
  metadata JSONB, -- Additional information in JSON format

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pipeline_logs table
CREATE INDEX IF NOT EXISTS idx_pipeline_run_id ON pipeline_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_created ON pipeline_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_logs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_filter_name ON pipeline_logs(filter_name);

-- Comment on table
COMMENT ON TABLE pipeline_logs IS 'Logs for pipeline execution, performance tracking, and debugging';


-- =====================================================
-- TABLE 4: user_watchlist (Optional - Future Feature)
-- User's favorite cryptocurrencies
-- =====================================================
CREATE TABLE IF NOT EXISTS user_watchlist (
  id BIGSERIAL PRIMARY KEY,

  -- User reference (assumes Supabase Auth)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cryptocurrency
  symbol VARCHAR(20) NOT NULL,

  -- Metadata
  notes TEXT,
  alert_price DECIMAL(20, 8), -- Optional price alert

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: user can't add same symbol twice
  UNIQUE(user_id, symbol)
);

-- Indexes for user_watchlist table
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON user_watchlist(symbol);

-- Comment on table
COMMENT ON TABLE user_watchlist IS 'User watchlist for tracking favorite cryptocurrencies';


-- =====================================================
-- TABLE 5: data_quality_checks (Optional - Data Validation)
-- Track data quality issues and anomalies
-- =====================================================
CREATE TABLE IF NOT EXISTS data_quality_checks (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  symbol VARCHAR(20) NOT NULL,
  date DATE NOT NULL,

  -- Issue Details
  issue_type VARCHAR(50), -- 'missing_data', 'zero_volume', 'price_spike', 'negative_value'
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for data_quality_checks table
CREATE INDEX IF NOT EXISTS idx_quality_symbol ON data_quality_checks(symbol);
CREATE INDEX IF NOT EXISTS idx_quality_date ON data_quality_checks(date);
CREATE INDEX IF NOT EXISTS idx_quality_resolved ON data_quality_checks(is_resolved);

-- Comment on table
COMMENT ON TABLE data_quality_checks IS 'Track data quality issues and anomalies for validation';


-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for crypto_data table
CREATE TRIGGER update_crypto_data_updated_at
  BEFORE UPDATE ON crypto_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for crypto_metadata table
CREATE TRIGGER update_crypto_metadata_updated_at
  BEFORE UPDATE ON crypto_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- Function to calculate pipeline duration
CREATE OR REPLACE FUNCTION calculate_pipeline_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pipeline_logs table
CREATE TRIGGER calculate_duration_trigger
  BEFORE INSERT OR UPDATE ON pipeline_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_pipeline_duration();


-- =====================================================
-- VIEWS (Helpful queries)
-- =====================================================

-- View: Latest price for each cryptocurrency
CREATE OR REPLACE VIEW latest_crypto_prices AS
SELECT DISTINCT ON (symbol)
  symbol,
  name,
  date,
  close AS current_price,
  volume,
  market_cap,
  rank,
  change_24h_percent
FROM crypto_data
WHERE is_active = true
ORDER BY symbol, date DESC;

-- Comment on view
COMMENT ON VIEW latest_crypto_prices IS 'Latest price and metrics for each active cryptocurrency';


-- View: Pipeline execution summary
CREATE OR REPLACE VIEW pipeline_execution_summary AS
SELECT
  run_id,
  filter_name,
  status,
  symbols_processed,
  records_inserted,
  records_updated,
  errors_count,
  duration_seconds,
  TO_CHAR(duration_seconds * INTERVAL '1 second', 'HH24:MI:SS') AS duration_formatted,
  start_time,
  end_time
FROM pipeline_logs
ORDER BY created_at DESC;

-- Comment on view
COMMENT ON VIEW pipeline_execution_summary IS 'Summary of pipeline executions with formatted durations';


-- View: Data completeness report
CREATE OR REPLACE VIEW data_completeness_report AS
SELECT
  m.symbol,
  m.name,
  m.rank,
  m.first_available_date,
  m.last_sync_date,
  m.total_records,
  m.data_completeness_percent,
  COUNT(cd.id) AS actual_records,
  m.is_active
FROM crypto_metadata m
LEFT JOIN crypto_data cd ON m.symbol = cd.symbol
GROUP BY m.id, m.symbol, m.name, m.rank, m.first_available_date,
         m.last_sync_date, m.total_records, m.data_completeness_percent, m.is_active
ORDER BY m.rank;

-- Comment on view
COMMENT ON VIEW data_completeness_report IS 'Report showing data completeness for each cryptocurrency';


-- =====================================================
-- SAMPLE QUERIES (For Testing)
-- =====================================================

-- Check if schema is created successfully
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Get count of records per table
-- SELECT 'crypto_data' as table_name, COUNT(*) as count FROM crypto_data
-- UNION ALL
-- SELECT 'crypto_metadata', COUNT(*) FROM crypto_metadata
-- UNION ALL
-- SELECT 'pipeline_logs', COUNT(*) FROM pipeline_logs
-- UNION ALL
-- SELECT 'user_watchlist', COUNT(*) FROM user_watchlist
-- UNION ALL
-- SELECT 'data_quality_checks', COUNT(*) FROM data_quality_checks;


-- =====================================================
-- NO ROW LEVEL SECURITY - Simple homework version
-- =====================================================
-- RLS is disabled for simplicity in homework environment
-- All tables have public access for read/write operations


-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Crypto Exchange Analyzer schema created successfully!';
  RAISE NOTICE '📊 Tables created: crypto_data, crypto_metadata, pipeline_logs, user_watchlist, data_quality_checks';
  RAISE NOTICE '🔍 Views created: latest_crypto_prices, pipeline_execution_summary, data_completeness_report';
  RAISE NOTICE '🚀 You can now start implementing the Pipe and Filter pipeline!';
END $$;
