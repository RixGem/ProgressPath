-- ============================================================================
-- Daily Quotes Table Schema (Corrected Version)
-- ============================================================================
-- This schema is used by the daily-quotes cron job to store multilingual
-- motivational quotes that refresh daily.
--
-- Key Features:
-- - Multilingual support (English, Chinese, French, Spanish, etc.)
-- - Optional translations for non-English quotes
-- - day_id field for tracking which day quotes belong to
-- - Optimized indexes for fast queries
-- - Row Level Security (RLS) for public read access
-- ============================================================================

-- Drop existing table if you need to recreate (CAREFUL: This deletes all data!)
-- DROP TABLE IF EXISTS daily_quotes CASCADE;

-- Create the daily_quotes table with corrected schema
CREATE TABLE IF NOT EXISTS daily_quotes (
  -- Primary key (auto-generated UUID)
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Quote content and metadata
  quote TEXT NOT NULL,                    -- The quote text in original language
  author TEXT NOT NULL,                   -- Author name
  language TEXT NOT NULL DEFAULT 'en',    -- ISO 639-1 code (en, zh, fr, es, etc.)
  translation TEXT,                       -- Optional translation (null if not needed)
  
  -- Date tracking (THIS IS THE CORRECTED FIELD NAME)
  day_id TEXT NOT NULL,                   -- Format: YYYY-MM-DD
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT valid_language CHECK (length(language) >= 2),
  CONSTRAINT valid_day_id CHECK (day_id ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on day_id for fast filtering by date
CREATE INDEX IF NOT EXISTS idx_daily_quotes_day_id 
  ON daily_quotes(day_id);

-- Index on language for filtering by language
CREATE INDEX IF NOT EXISTS idx_daily_quotes_language 
  ON daily_quotes(language);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_daily_quotes_created_at 
  ON daily_quotes(created_at DESC);

-- Composite index for common query pattern (day_id + created_at)
CREATE INDEX IF NOT EXISTS idx_daily_quotes_day_created 
  ON daily_quotes(day_id, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all quotes
DROP POLICY IF EXISTS "Allow public read access" ON daily_quotes;
CREATE POLICY "Allow public read access"
  ON daily_quotes
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow service role full access (for cron job)
DROP POLICY IF EXISTS "Allow service role all operations" ON daily_quotes;
CREATE POLICY "Allow service role all operations"
  ON daily_quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS (OPTIONAL)
-- ============================================================================

-- Function to get today's quotes
CREATE OR REPLACE FUNCTION get_today_quotes()
RETURNS SETOF daily_quotes
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM daily_quotes 
  WHERE day_id = CURRENT_DATE::TEXT
  ORDER BY created_at;
$$;

-- Function to clean up old quotes (older than N days)
CREATE OR REPLACE FUNCTION cleanup_old_quotes(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM daily_quotes
  WHERE day_id < (CURRENT_DATE - days_to_keep)::TEXT;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get quote statistics
CREATE OR REPLACE FUNCTION get_quote_stats()
RETURNS TABLE(
  total_quotes BIGINT,
  unique_dates BIGINT,
  latest_date TEXT,
  language_breakdown JSON
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COUNT(*) as total_quotes,
    COUNT(DISTINCT day_id) as unique_dates,
    MAX(day_id) as latest_date,
    json_object_agg(language, lang_count) as language_breakdown
  FROM (
    SELECT 
      language,
      COUNT(*) as lang_count
    FROM daily_quotes
    WHERE day_id = CURRENT_DATE::TEXT
    GROUP BY language
  ) lang_stats;
$$;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get all quotes for today
-- SELECT * FROM daily_quotes WHERE day_id = CURRENT_DATE::TEXT;

-- Get all quotes for a specific date
-- SELECT * FROM daily_quotes WHERE day_id = '2025-12-24';

-- Get quotes by language
-- SELECT * FROM daily_quotes WHERE language = 'zh' AND day_id = CURRENT_DATE::TEXT;

-- Get quotes with translations
-- SELECT * FROM daily_quotes WHERE translation IS NOT NULL AND day_id = CURRENT_DATE::TEXT;

-- Count quotes by language for today
-- SELECT language, COUNT(*) as count 
-- FROM daily_quotes 
-- WHERE day_id = CURRENT_DATE::TEXT 
-- GROUP BY language 
-- ORDER BY count DESC;

-- Delete quotes older than today (what the cron job does)
-- DELETE FROM daily_quotes WHERE day_id != CURRENT_DATE::TEXT;

-- Get statistics using helper function
-- SELECT * FROM get_quote_stats();

-- Clean up quotes older than 7 days
-- SELECT cleanup_old_quotes(7);

-- ============================================================================
-- SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Uncomment to insert sample quotes for testing
/*
INSERT INTO daily_quotes (quote, author, language, translation, day_id) VALUES
  (
    'Education is the most powerful weapon which you can use to change the world',
    'Nelson Mandela',
    'en',
    NULL,
    CURRENT_DATE::TEXT
  ),
  (
    '学习之路没有尽头，只有新的起点',
    '林语堂',
    'zh',
    NULL,
    CURRENT_DATE::TEXT
  ),
  (
    'La vie est un mystère qu''il faut vivre, et non un problème à résoudre',
    'Gandhi',
    'fr',
    'Life is a mystery to be lived, not a problem to be solved',
    CURRENT_DATE::TEXT
  ),
  (
    'El conocimiento es poder',
    'Francis Bacon',
    'es',
    'Knowledge is power',
    CURRENT_DATE::TEXT
  ),
  (
    'Bildung ist die mächtigste Waffe',
    'Nelson Mandela',
    'de',
    'Education is the most powerful weapon',
    CURRENT_DATE::TEXT
  );
*/

-- ============================================================================
-- MIGRATION FROM OLD SCHEMA (IF NEEDED)
-- ============================================================================

-- If you have an old schema with different field names, use this migration:
/*
-- Rename columns if they exist with old names
DO $$ 
BEGIN
  -- Check and rename 'text' to 'quote'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'text'
  ) THEN
    ALTER TABLE daily_quotes RENAME COLUMN text TO quote;
  END IF;

  -- Check and rename 'created_date' to 'day_id'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'created_date'
  ) THEN
    ALTER TABLE daily_quotes RENAME COLUMN created_date TO day_id;
    ALTER TABLE daily_quotes ALTER COLUMN day_id TYPE TEXT;
  END IF;

  -- Add language column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'language'
  ) THEN
    ALTER TABLE daily_quotes ADD COLUMN language TEXT NOT NULL DEFAULT 'en';
  END IF;

  -- Add translation column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'translation'
  ) THEN
    ALTER TABLE daily_quotes ADD COLUMN translation TEXT;
  END IF;

  -- Remove old columns that are no longer needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE daily_quotes DROP COLUMN is_active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE daily_quotes DROP COLUMN order_index;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_quotes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE daily_quotes DROP COLUMN updated_at;
  END IF;

END $$;

-- Convert existing day_id values to proper format if needed
UPDATE daily_quotes 
SET day_id = TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE day_id IS NULL OR day_id = '';
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'daily_quotes'
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'daily_quotes';

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'daily_quotes';

-- Verify policies
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'daily_quotes';

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. This schema uses day_id (TEXT) instead of created_date (DATE)
--    This matches what the cron job expects and prevents schema mismatches
--
-- 2. The language field supports any ISO 639-1 code (2+ characters)
--
-- 3. Translation is optional and can be NULL
--
-- 4. Indexes are optimized for the most common query patterns:
--    - Fetching today's quotes (by day_id)
--    - Filtering by language
--    - Time-based ordering
--
-- 5. RLS ensures public users can only read quotes
--    Only the service role (used by cron job) can modify data
--
-- 6. Helper functions are included for common operations
--
-- ============================================================================
