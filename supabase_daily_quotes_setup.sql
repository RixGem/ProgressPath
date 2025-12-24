-- =====================================================
-- Supabase Daily Quotes Table Setup
-- =====================================================
-- This SQL script creates the daily_quotes table and
-- populates it with initial inspirational quotes
-- =====================================================

-- Create the daily_quotes table with language and translation support
CREATE TABLE IF NOT EXISTS daily_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  translation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  day_id TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_quotes_day_id ON daily_quotes(day_id);
CREATE INDEX IF NOT EXISTS idx_daily_quotes_language ON daily_quotes(language);

-- Enable Row Level Security
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON daily_quotes;
CREATE POLICY "Allow public read access"
  ON daily_quotes
  FOR SELECT
  USING (true);

-- Create policy for service role full access
DROP POLICY IF EXISTS "Allow service role all operations" ON daily_quotes;
CREATE POLICY "Allow service role all operations"
  ON daily_quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Insert Initial Quotes (Mixed Languages)
-- =====================================================

-- Clear existing quotes (optional, comment out if you want to keep existing)
-- TRUNCATE TABLE daily_quotes;

-- Get today's day_id
DO $$
DECLARE
  today_id TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
BEGIN
  -- Insert English quotes
  INSERT INTO daily_quotes (quote, author, language, translation, day_id) VALUES
    ('The only way to do great work is to love what you do.', 'Steve Jobs', 'en', NULL, today_id),
    ('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'en', NULL, today_id),
    ('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'en', NULL, today_id),
    ('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'en', NULL, today_id),
    ('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'en', NULL, today_id)
  ON CONFLICT DO NOTHING;

  -- Insert Chinese quotes with English translations
  INSERT INTO daily_quotes (quote, author, language, translation, day_id) VALUES
    ('学习之路没有尽头，只有新的起点', '林语堂', 'zh', NULL, today_id),
    ('千里之行，始于足下', '老子', 'zh', 'A journey of a thousand miles begins with a single step', today_id),
    ('温故而知新，可以为师矣', '孔子', 'zh', 'Reviewing what you have learned and learning anew, you are fit to be a teacher', today_id)
  ON CONFLICT DO NOTHING;

  -- Insert French quotes with translations
  INSERT INTO daily_quotes (quote, author, language, translation, day_id) VALUES
    ('La vie est un mystère qu''il faut vivre, et non un problème à résoudre', 'Gandhi', 'fr', '生活是一个需要体验的奥秘，而非一个需要解决的问题', today_id),
    ('Tout ce qui mérite d''être fait mérite d''être bien fait', 'Philip Stanhope', 'fr', 'Whatever is worth doing at all is worth doing well', today_id)
  ON CONFLICT DO NOTHING;

  -- Insert Spanish quotes
  INSERT INTO daily_quotes (quote, author, language, translation, day_id) VALUES
    ('El éxito es la suma de pequeños esfuerzos repetidos día tras día', 'Robert Collier', 'es', 'Success is the sum of small efforts repeated day in and day out', today_id),
    ('La educación es el arma más poderosa que puedes usar para cambiar el mundo', 'Nelson Mandela', 'es', 'Education is the most powerful weapon you can use to change the world', today_id)
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- Verify Installation
-- =====================================================

-- Count total quotes
SELECT COUNT(*) as total_quotes FROM daily_quotes;

-- Count quotes by language
SELECT language, COUNT(*) as count 
FROM daily_quotes 
GROUP BY language 
ORDER BY count DESC;

-- Display sample quotes
SELECT id, LEFT(quote, 50) || '...' as quote_preview, author, language, 
       CASE WHEN translation IS NOT NULL THEN 'Yes' ELSE 'No' END as has_translation
FROM daily_quotes 
ORDER BY language, id 
LIMIT 10;

-- =====================================================
-- Useful Queries for Management
-- =====================================================

-- Get a random quote
-- SELECT quote, author, language, translation FROM daily_quotes 
-- ORDER BY RANDOM() 
-- LIMIT 1;

-- Get quotes for today
-- SELECT quote, author, language, translation FROM daily_quotes 
-- WHERE day_id = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
-- ORDER BY created_at;

-- Get random quote by language
-- SELECT quote, author, language, translation FROM daily_quotes 
-- WHERE language = 'zh'
-- ORDER BY RANDOM() 
-- LIMIT 1;

-- Add a new quote
-- INSERT INTO daily_quotes (quote, author, language, translation, day_id) 
-- VALUES ('Your new quote here', 'Author Name', 'en', NULL, TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'));

-- Update a quote
-- UPDATE daily_quotes 
-- SET quote = 'Updated quote text', translation = 'Updated translation'
-- WHERE id = 'your-uuid-here';

-- Delete quotes for a specific day
-- DELETE FROM daily_quotes WHERE day_id = '2025-12-24';

-- =====================================================
-- Notes
-- =====================================================
-- 
-- 1. This script can be run in the Supabase SQL Editor
-- 2. The table uses UUID for primary keys
-- 3. Row Level Security ensures public read access
-- 4. day_id tracks which day the quotes belong to (format: YYYY-MM-DD)
-- 5. language field: 'en', 'zh', 'fr', 'es', etc.
-- 6. translation field: optional, can be in any language
-- 7. Service role has full access for automated operations
--
-- =====================================================
