-- =====================================================
-- Supabase Daily Quotes Table Setup
-- =====================================================
-- This SQL script creates the daily_quotes table and
-- populates it with initial inspirational quotes
-- =====================================================

-- Create the daily_quotes table
CREATE TABLE IF NOT EXISTS daily_quotes (
  id SERIAL PRIMARY KEY,
  quote_text TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_quotes_category ON daily_quotes(category);

-- Enable Row Level Security
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON daily_quotes;
CREATE POLICY "Allow public read access"
  ON daily_quotes
  FOR SELECT
  USING (true);

-- Optional: Create policy for authenticated users to insert/update
-- DROP POLICY IF EXISTS "Allow authenticated insert" ON daily_quotes;
-- CREATE POLICY "Allow authenticated insert"
--   ON daily_quotes
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- =====================================================
-- Insert Initial Quotes
-- =====================================================

-- Clear existing quotes (optional, comment out if you want to keep existing)
-- TRUNCATE TABLE daily_quotes RESTART IDENTITY;

-- Insert Personal Growth Quotes
INSERT INTO daily_quotes (quote_text, author, category) VALUES
  ('The only way to do great work is to love what you do.', 'Steve Jobs', 'Personal Growth'),
  ('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'Personal Growth'),
  ('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'Personal Growth'),
  ('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', 'Personal Growth'),
  ('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'Personal Growth'),
  ('Everything you''ve ever wanted is on the other side of fear.', 'George Addair', 'Personal Growth'),
  ('The only impossible journey is the one you never begin.', 'Tony Robbins', 'Personal Growth'),
  ('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', 'Personal Growth'),
  ('The secret of getting ahead is getting started.', 'Mark Twain', 'Personal Growth'),
  ('Believe in yourself and all that you are.', 'Christian D. Larson', 'Personal Growth')
ON CONFLICT DO NOTHING;

-- Insert Learning Quotes
INSERT INTO daily_quotes (quote_text, author, category) VALUES
  ('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela', 'Learning'),
  ('The beautiful thing about learning is that no one can take it away from you.', 'B.B. King', 'Learning'),
  ('Live as if you were to die tomorrow. Learn as if you were to live forever.', 'Mahatma Gandhi', 'Learning'),
  ('The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', 'Brian Herbert', 'Learning'),
  ('Learning never exhausts the mind.', 'Leonardo da Vinci', 'Learning'),
  ('An investment in knowledge pays the best interest.', 'Benjamin Franklin', 'Learning'),
  ('The expert in anything was once a beginner.', 'Helen Hayes', 'Learning'),
  ('The more that you read, the more things you will know. The more that you learn, the more places you''ll go.', 'Dr. Seuss', 'Learning'),
  ('Develop a passion for learning. If you do, you will never cease to grow.', 'Anthony J. D''Angelo', 'Learning'),
  ('Education is not the filling of a pail, but the lighting of a fire.', 'William Butler Yeats', 'Learning')
ON CONFLICT DO NOTHING;

-- Insert Philosophy Quotes
INSERT INTO daily_quotes (quote_text, author, category) VALUES
  ('The unexamined life is not worth living.', 'Socrates', 'Philosophy'),
  ('I think, therefore I am.', 'René Descartes', 'Philosophy'),
  ('He who has a why to live can bear almost any how.', 'Friedrich Nietzsche', 'Philosophy'),
  ('The only true wisdom is in knowing you know nothing.', 'Socrates', 'Philosophy'),
  ('To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.', 'Ralph Waldo Emerson', 'Philosophy'),
  ('We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Aristotle', 'Philosophy'),
  ('The mind is everything. What you think you become.', 'Buddha', 'Philosophy'),
  ('Life is what happens when you''re busy making other plans.', 'John Lennon', 'Philosophy')
ON CONFLICT DO NOTHING;

-- Insert Motivation Quotes
INSERT INTO daily_quotes (quote_text, author, category) VALUES
  ('The way to get started is to quit talking and begin doing.', 'Walt Disney', 'Motivation'),
  ('Don''t let yesterday take up too much of today.', 'Will Rogers', 'Motivation'),
  ('You learn more from failure than from success. Don''t let it stop you. Failure builds character.', 'Unknown', 'Motivation'),
  ('It''s not whether you get knocked down, it''s whether you get up.', 'Vince Lombardi', 'Motivation'),
  ('If you are working on something that you really care about, you don''t have to be pushed. The vision pulls you.', 'Steve Jobs', 'Motivation'),
  ('People who are crazy enough to think they can change the world, are the ones who do.', 'Rob Siltanen', 'Motivation'),
  ('Failure will never overtake me if my determination to succeed is strong enough.', 'Og Mandino', 'Motivation'),
  ('We may encounter many defeats but we must not be defeated.', 'Maya Angelou', 'Motivation')
ON CONFLICT DO NOTHING;

-- Insert Success Quotes
INSERT INTO daily_quotes (quote_text, author, category) VALUES
  ('Success is not the key to happiness. Happiness is the key to success.', 'Albert Schweitzer', 'Success'),
  ('Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau', 'Success'),
  ('The road to success and the road to failure are almost exactly the same.', 'Colin R. Davis', 'Success'),
  ('Success is walking from failure to failure with no loss of enthusiasm.', 'Winston Churchill', 'Success'),
  ('The only place where success comes before work is in the dictionary.', 'Vidal Sassoon', 'Success'),
  ('Don''t be afraid to give up the good to go for the great.', 'John D. Rockefeller', 'Success')
ON CONFLICT DO NOTHING;

-- Insert Creativity Quotes
INSERT INTO daily_quotes (quote_text, author, category) VALUES
  ('Creativity is intelligence having fun.', 'Albert Einstein', 'Creativity'),
  ('The desire to create is one of the deepest yearnings of the human soul.', 'Dieter F. Uchtdorf', 'Creativity'),
  ('Creativity takes courage.', 'Henri Matisse', 'Creativity'),
  ('The chief enemy of creativity is good sense.', 'Pablo Picasso', 'Creativity'),
  ('Every artist was first an amateur.', 'Ralph Waldo Emerson', 'Creativity')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verify Installation
-- =====================================================

-- Count total quotes
SELECT COUNT(*) as total_quotes FROM daily_quotes;

-- Count quotes by category
SELECT category, COUNT(*) as count 
FROM daily_quotes 
GROUP BY category 
ORDER BY count DESC;

-- Display sample quotes
SELECT id, LEFT(quote_text, 50) || '...' as quote_preview, author, category 
FROM daily_quotes 
ORDER BY category, id 
LIMIT 10;

-- =====================================================
-- Useful Queries for Management
-- =====================================================

-- Get a random quote (same method used by the component)
-- SELECT quote_text, author FROM daily_quotes 
-- ORDER BY RANDOM() 
-- LIMIT 1;

-- Get random quote by category
-- SELECT quote_text, author FROM daily_quotes 
-- WHERE category = 'Learning'
-- ORDER BY RANDOM() 
-- LIMIT 1;

-- Add a new quote
-- INSERT INTO daily_quotes (quote_text, author, category) 
-- VALUES ('Your new quote here', 'Author Name', 'Category');

-- Update a quote
-- UPDATE daily_quotes 
-- SET quote_text = 'Updated quote text', updated_at = NOW()
-- WHERE id = 1;

-- Delete a quote
-- DELETE FROM daily_quotes WHERE id = 1;

-- =====================================================
-- Notes
-- =====================================================
-- 
-- 1. This script can be run in the Supabase SQL Editor
-- 2. The table will be created with ~50 initial quotes
-- 3. Row Level Security ensures public read access
-- 4. Categories are optional but helpful for future filtering
-- 5. Add more quotes anytime via INSERT statements or Supabase UI
--
-- =====================================================
