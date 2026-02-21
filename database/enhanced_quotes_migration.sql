-- =====================================================
-- Enhanced Daily Quotes Database Schema
-- =====================================================
-- This migration adds category support and optimizes
-- the quotes table for better performance
-- =====================================================

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_quotes' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE daily_quotes ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
END $$;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_daily_quotes_category ON daily_quotes(category);

-- Create composite index for language + category queries
CREATE INDEX IF NOT EXISTS idx_daily_quotes_lang_category ON daily_quotes(language, category);

-- Update existing quotes with categories (if they don't have one)
UPDATE daily_quotes 
SET category = 'motivation'
WHERE category IS NULL OR category = 'general'
AND (quote ILIKE '%success%' OR quote ILIKE '%achieve%' OR quote ILIKE '%persever%');

UPDATE daily_quotes 
SET category = 'learning'
WHERE category IS NULL OR category = 'general'
AND (quote ILIKE '%learn%' OR quote ILIKE '%educat%' OR quote ILIKE '%knowledge%');

UPDATE daily_quotes 
SET category = 'wisdom'
WHERE category IS NULL OR category = 'general'
AND (quote ILIKE '%wisdom%' OR quote ILIKE '%philosoph%' OR quote ILIKE '%life%');

-- Set remaining quotes to general category
UPDATE daily_quotes 
SET category = 'general'
WHERE category IS NULL;

-- Make category NOT NULL now that all records have values
ALTER TABLE daily_quotes ALTER COLUMN category SET NOT NULL;

-- =====================================================
-- Enhanced View for Quote Analytics
-- =====================================================

-- Create a view for quote statistics
CREATE OR REPLACE VIEW quote_stats AS
SELECT 
    day_id,
    category,
    language,
    COUNT(*) as quote_count,
    COUNT(CASE WHEN translation IS NOT NULL THEN 1 END) as translated_count
FROM daily_quotes
GROUP BY day_id, category, language
ORDER BY day_id DESC, category, language;

-- =====================================================
-- Useful Functions
-- =====================================================

-- Function to get a random quote with filters
CREATE OR REPLACE FUNCTION get_random_quote(
    p_language TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    quote TEXT,
    author TEXT,
    language TEXT,
    translation TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dq.quote,
        dq.author,
        dq.language,
        dq.translation,
        dq.category
    FROM daily_quotes dq
    WHERE 
        (p_language IS NULL OR dq.language = p_language)
        AND (p_category IS NULL OR dq.category = p_category)
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get quote distribution
CREATE OR REPLACE FUNCTION get_quote_distribution()
RETURNS TABLE (
    metric TEXT,
    value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total Quotes'::TEXT, COUNT(*)::BIGINT FROM daily_quotes
    UNION ALL
    SELECT 'French Quotes'::TEXT, COUNT(*)::BIGINT FROM daily_quotes WHERE language = 'fr'
    UNION ALL
    SELECT 'English Quotes'::TEXT, COUNT(*)::BIGINT FROM daily_quotes WHERE language = 'en'
    UNION ALL
    SELECT 'With Translations'::TEXT, COUNT(*)::BIGINT FROM daily_quotes WHERE translation IS NOT NULL
    UNION ALL
    SELECT 'Categories'::TEXT, COUNT(DISTINCT category)::BIGINT FROM daily_quotes;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Sample Queries for Testing
-- =====================================================

-- Test the random quote function
-- SELECT * FROM get_random_quote('fr', 'motivation');

-- View quote distribution
-- SELECT * FROM get_quote_distribution();

-- View category statistics
-- SELECT * FROM quote_stats WHERE day_id = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');

-- Get counts by category and language
-- SELECT category, language, COUNT(*) as count
-- FROM daily_quotes
-- WHERE day_id = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
-- GROUP BY category, language
-- ORDER BY category, language;

-- =====================================================
-- Cleanup Commands (if needed)
-- =====================================================

-- Drop the view
-- DROP VIEW IF EXISTS quote_stats;

-- Drop the functions
-- DROP FUNCTION IF EXISTS get_random_quote(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS get_quote_distribution();

-- Remove category column
-- ALTER TABLE daily_quotes DROP COLUMN IF EXISTS category;

-- =====================================================
-- Notes
-- =====================================================
-- 
-- 1. Run this migration after the basic daily_quotes table exists
-- 2. The migration is idempotent - safe to run multiple times
-- 3. Indexes improve query performance for filtered searches
-- 4. The view provides easy access to statistics
-- 5. Functions simplify common query patterns
--
-- =====================================================
