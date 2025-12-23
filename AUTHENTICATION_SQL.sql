-- ============================================
-- PROGRESSPATH AUTHENTICATION SETUP
-- Complete SQL script for database setup
-- ============================================

-- Step 1: Add user_id columns to existing tables
-- ============================================

-- Add user_id to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to french_learning table
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS books_user_id_idx ON books(user_id);
CREATE INDEX IF NOT EXISTS french_learning_user_id_idx ON french_learning(user_id);
CREATE INDEX IF NOT EXISTS books_created_at_idx ON books(created_at);
CREATE INDEX IF NOT EXISTS french_learning_date_idx ON french_learning(date);

-- Step 3: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE french_learning ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (for clean reinstall)
-- ============================================

DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;

DROP POLICY IF EXISTS "Users can view own activities" ON french_learning;
DROP POLICY IF EXISTS "Users can insert own activities" ON french_learning;
DROP POLICY IF EXISTS "Users can update own activities" ON french_learning;
DROP POLICY IF EXISTS "Users can delete own activities" ON french_learning;

-- Step 5: Create RLS Policies for books table
-- ============================================

-- SELECT: Users can only view their own books
CREATE POLICY "Users can view own books"
ON books FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only insert books with their own user_id
CREATE POLICY "Users can insert own books"
ON books FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own books
CREATE POLICY "Users can update own books"
ON books FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own books
CREATE POLICY "Users can delete own books"
ON books FOR DELETE
USING (auth.uid() = user_id);

-- Step 6: Create RLS Policies for french_learning table
-- ============================================

-- SELECT: Users can only view their own activities
CREATE POLICY "Users can view own activities"
ON french_learning FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only insert activities with their own user_id
CREATE POLICY "Users can insert own activities"
ON french_learning FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own activities
CREATE POLICY "Users can update own activities"
ON french_learning FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own activities
CREATE POLICY "Users can delete own activities"
ON french_learning FOR DELETE
USING (auth.uid() = user_id);

-- Step 7: Optional - Migrate existing data to a specific user
-- ============================================
-- IMPORTANT: Replace 'YOUR-USER-UUID-HERE' with an actual user UUID
-- You can get this from the Supabase Auth dashboard or by signing up a user

-- Uncomment and run these if you have existing data:
-- UPDATE books SET user_id = 'YOUR-USER-UUID-HERE' WHERE user_id IS NULL;
-- UPDATE french_learning SET user_id = 'YOUR-USER-UUID-HERE' WHERE user_id IS NULL;

-- Or delete existing data without user_id:
-- DELETE FROM books WHERE user_id IS NULL;
-- DELETE FROM french_learning WHERE user_id IS NULL;

-- Step 8: Verify setup
-- ============================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('books', 'french_learning');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('books', 'french_learning')
ORDER BY tablename, policyname;

-- Check indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('books', 'french_learning')
ORDER BY tablename, indexname;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- 
-- Next steps:
-- 1. Configure authentication settings in Supabase Dashboard
-- 2. Test sign up and login functionality
-- 3. Verify that users can only see their own data
-- 4. Check the AUTHENTICATION_SETUP.md file for more details
