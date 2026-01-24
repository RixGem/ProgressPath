-- ============================================================================
-- XP Tracking Database Schema
-- ============================================================================
-- This schema supports the XP chart components and dashboard functionality
-- Run this in your Supabase SQL Editor to enable real XP tracking
--
-- Related files:
-- - components/XPChart.tsx
-- - hooks/useDashboardData.ts
-- - lib/db/queries.ts
-- ============================================================================

-- ============================================================================
-- 1. XP Activities Table
-- ============================================================================
-- Stores individual XP-earning events for activity tracking and chart data
--
CREATE TABLE IF NOT EXISTS xp_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'lesson', 'practice', 'review', 'achievement', 'streak_bonus'
  xp_gained INTEGER NOT NULL CHECK (xp_gained >= 0),
  language TEXT NOT NULL CHECK (language IN ('french', 'german', 'all')),
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Extra data like lesson_id, quiz_score, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Indexes will be created below
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN ('lesson', 'practice', 'review', 'achievement', 'streak_bonus', 'milestone')
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_activities_user_id ON xp_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_activities_user_language ON xp_activities(user_id, language);
CREATE INDEX IF NOT EXISTS idx_xp_activities_date ON xp_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_xp_activities_user_date ON xp_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_xp_activities_created ON xp_activities(created_at DESC);

-- Row Level Security
ALTER TABLE xp_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP activities" 
  ON xp_activities FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP activities" 
  ON xp_activities FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own XP activities" 
  ON xp_activities FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. User XP Stats Table (Aggregated)
-- ============================================================================
-- Cached aggregated XP statistics per user and language for fast dashboard loading
--
CREATE TABLE IF NOT EXISTS user_xp_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('french', 'german', 'all')),
  
  -- XP Statistics
  total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
  current_level_xp INTEGER DEFAULT 0,
  next_level_xp INTEGER DEFAULT 100,
  
  -- Progress tracking
  lessons_completed INTEGER DEFAULT 0,
  practices_completed INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Time tracking
  total_minutes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per language
  UNIQUE(user_id, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_xp_stats_user_id ON user_xp_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_stats_user_language ON user_xp_stats(user_id, language);

-- Row Level Security
ALTER TABLE user_xp_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP stats" 
  ON user_xp_stats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP stats" 
  ON user_xp_stats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own XP stats" 
  ON user_xp_stats FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Language Progress Table
-- ============================================================================
-- Detailed progress tracking for each language
--
CREATE TABLE IF NOT EXISTS language_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('french', 'german')),
  
  -- Vocabulary
  words_learned INTEGER DEFAULT 0,
  words_mastered INTEGER DEFAULT 0,
  vocabulary_accuracy DECIMAL(5,2) DEFAULT 0.0 CHECK (vocabulary_accuracy >= 0 AND vocabulary_accuracy <= 100),
  
  -- Topics and lessons
  topics_completed INTEGER DEFAULT 0,
  topics_mastered INTEGER DEFAULT 0,
  current_topic TEXT,
  
  -- Skills
  reading_level INTEGER DEFAULT 1,
  writing_level INTEGER DEFAULT 1,
  listening_level INTEGER DEFAULT 1,
  speaking_level INTEGER DEFAULT 1,
  
  -- Goals
  daily_xp_goal INTEGER DEFAULT 50,
  weekly_xp_goal INTEGER DEFAULT 300,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One record per user per language
  UNIQUE(user_id, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_language_progress_user_id ON language_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_language_progress_user_language ON language_progress(user_id, language);

-- Row Level Security
ALTER TABLE language_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own language progress" 
  ON language_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own language progress" 
  ON language_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own language progress" 
  ON language_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Functions and Triggers
-- ============================================================================

-- Function to update user_xp_stats when xp_activity is inserted
CREATE OR REPLACE FUNCTION update_user_xp_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_total_xp INTEGER;
  new_level INTEGER;
  current_level_start INTEGER;
  next_level_start INTEGER;
BEGIN
  -- Calculate new total XP
  SELECT COALESCE(SUM(xp_gained), 0) INTO new_total_xp
  FROM xp_activities
  WHERE user_id = NEW.user_id AND language = NEW.language;
  
  -- Calculate level (simple formula: level = floor(sqrt(total_xp / 100)))
  new_level := GREATEST(1, FLOOR(SQRT(new_total_xp / 100.0))::INTEGER + 1);
  
  -- Calculate XP ranges for current level
  current_level_start := (new_level - 1) * (new_level - 1) * 100;
  next_level_start := new_level * new_level * 100;
  
  -- Update or insert user_xp_stats
  INSERT INTO user_xp_stats (
    user_id, 
    language, 
    total_xp, 
    current_level,
    current_level_xp,
    next_level_xp,
    last_activity_date,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.language,
    new_total_xp,
    new_level,
    current_level_start,
    next_level_start,
    NEW.activity_date,
    NOW()
  )
  ON CONFLICT (user_id, language) 
  DO UPDATE SET
    total_xp = new_total_xp,
    current_level = new_level,
    current_level_xp = current_level_start,
    next_level_xp = next_level_start,
    last_activity_date = NEW.activity_date,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update stats
DROP TRIGGER IF EXISTS trigger_update_user_xp_stats ON xp_activities;
CREATE TRIGGER trigger_update_user_xp_stats
  AFTER INSERT ON xp_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_xp_stats();

-- Function to update streak data
CREATE OR REPLACE FUNCTION update_streak_data()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  streak INTEGER;
BEGIN
  -- Get last activity date for this user and language
  SELECT last_activity_date INTO last_date
  FROM user_xp_stats
  WHERE user_id = NEW.user_id AND language = NEW.language;
  
  -- Calculate streak
  IF last_date IS NULL THEN
    streak := 1;
  ELSIF last_date = NEW.activity_date THEN
    -- Same day, don't change streak
    RETURN NEW;
  ELSIF last_date = NEW.activity_date - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    SELECT current_streak + 1 INTO streak
    FROM user_xp_stats
    WHERE user_id = NEW.user_id AND language = NEW.language;
  ELSE
    -- Streak broken
    streak := 1;
  END IF;
  
  -- Update streak in user_xp_stats
  UPDATE user_xp_stats
  SET 
    current_streak = streak,
    longest_streak = GREATEST(longest_streak, streak)
  WHERE user_id = NEW.user_id AND language = NEW.language;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for streak updates
DROP TRIGGER IF EXISTS trigger_update_streak ON xp_activities;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON xp_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_data();

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Get XP summary for user
CREATE OR REPLACE FUNCTION get_user_xp_summary(p_user_id UUID)
RETURNS TABLE (
  language TEXT,
  total_xp INTEGER,
  current_level INTEGER,
  current_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.language,
    s.total_xp,
    s.current_level,
    s.current_streak
  FROM user_xp_stats s
  WHERE s.user_id = p_user_id
  ORDER BY s.language;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get XP activity history for charts
CREATE OR REPLACE FUNCTION get_xp_history(
  p_user_id UUID,
  p_language TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  activity_date DATE,
  daily_xp INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.activity_date,
    SUM(a.xp_gained)::INTEGER as daily_xp
  FROM xp_activities a
  WHERE 
    a.user_id = p_user_id
    AND (p_language = 'all' OR a.language = p_language)
    AND a.activity_date >= CURRENT_DATE - p_days
  GROUP BY a.activity_date
  ORDER BY a.activity_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Sample Data (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data for testing

/*
-- Insert sample XP activities for testing
INSERT INTO xp_activities (user_id, activity_type, xp_gained, language, title, description, activity_date)
SELECT 
  auth.uid(),
  'lesson',
  50 + (random() * 50)::INTEGER,
  CASE WHEN random() < 0.5 THEN 'french' ELSE 'german' END,
  'Sample Lesson',
  'Test lesson completion',
  CURRENT_DATE - (random() * 30)::INTEGER
FROM generate_series(1, 20);

-- Initialize language progress
INSERT INTO language_progress (user_id, language, words_learned, topics_completed)
VALUES 
  (auth.uid(), 'french', 100, 5),
  (auth.uid(), 'german', 75, 3)
ON CONFLICT (user_id, language) DO NOTHING;
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- After running this schema:
-- 1. Update lib/db/queries.ts to use real Supabase queries
-- 2. Connect activity tracking in your learning pages
-- 3. Test with sample data
-- 4. The XP charts will display real progress!
-- ============================================================================
