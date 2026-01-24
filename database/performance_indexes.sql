-- Performance Optimization Indexes
-- Run this in your Supabase SQL Editor to improve query performance

-- 1. Index for Books Page
-- Optimizes: .from('books').select('*').eq('user_id', ...).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_books_user_created_at 
ON books (user_id, created_at DESC);

-- 2. Index for French Learning Page
-- Optimizes: .from('french_learning').select('*').eq('user_id', ...).order('date', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_french_user_date 
ON french_learning (user_id, date DESC);

-- 3. Index for French Learning Total Time Calculation
-- Optimizes: .from('french_learning').select('total_time...').eq('user_id', ...)
-- A simple index on user_id is sufficient for the aggregation query if not using the composite one above
CREATE INDEX IF NOT EXISTS idx_french_user_id 
ON french_learning (user_id);

-- 4. Verify Daily Quotes Index (Just in case)
CREATE INDEX IF NOT EXISTS idx_daily_quotes_day_id 
ON daily_quotes (day_id);
