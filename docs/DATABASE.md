# Database Documentation

This document consolidates the database schema definitions and migration guides for the ProgressPath application.

## 1. French Learning (`french_learning`)

### Schema
```sql
CREATE TABLE french_learning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_time INTEGER NOT NULL,        -- Primary field for calculations
  notes TEXT,
  date DATE NOT NULL,
  new_vocabulary TEXT[],              -- Array of vocabulary words
  practice_sentences TEXT[],          -- Array of practice sentences
  mood TEXT DEFAULT 'neutral'         -- 'good', 'neutral', 'difficult'
    CHECK (mood IN ('good', 'neutral', 'difficult')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### Migration: Add Enhanced Fields (Vocab, Mood, Sentences)
Run this to upgrade an older table version:
```sql
BEGIN;
-- Add new columns
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS new_vocabulary TEXT[],
ADD COLUMN IF NOT EXISTS practice_sentences TEXT[],
ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('good', 'neutral', 'difficult'));

-- Set defaults
ALTER TABLE french_learning ALTER COLUMN mood SET DEFAULT 'neutral';

-- Add total_time if missing
ALTER TABLE french_learning ADD COLUMN IF NOT EXISTS total_time INTEGER;

COMMIT;
```

### Migration: `total_time` Field
If you have records where `total_time` is missing but `duration_minutes` exists:
```sql
UPDATE french_learning 
SET total_time = duration_minutes 
WHERE total_time IS NULL;
```

---

## 2. Daily Quotes (`daily_quotes`)

### Schema
```sql
CREATE TABLE daily_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  translation TEXT,
  day_id TEXT NOT NULL,               -- Format: YYYY-MM-DD
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_day_id CHECK (day_id ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);

-- Indexes
CREATE INDEX idx_daily_quotes_day_id ON daily_quotes(day_id);
CREATE INDEX idx_daily_quotes_language ON daily_quotes(language);
```

### Policies (RLS)
```sql
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access" ON daily_quotes FOR SELECT TO public USING (true);

-- Service role full access
CREATE POLICY "Allow service role all operations" ON daily_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### Migration: Fix Schema Inconsistencies
If migrating from an older schema version (fixing `text` -> `quote` and `created_date` -> `day_id`):
```sql
ALTER TABLE daily_quotes RENAME COLUMN text TO quote;
ALTER TABLE daily_quotes RENAME COLUMN created_date TO day_id;
ALTER TABLE daily_quotes ALTER COLUMN day_id TYPE TEXT;
ALTER TABLE daily_quotes ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE daily_quotes ADD COLUMN IF NOT EXISTS translation TEXT;
```

---

## 3. User Profiles (`user_profiles`)

### Schema
```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  email_notifications BOOLEAN DEFAULT true,
  total_books_read INTEGER DEFAULT 0,
  total_pages_read INTEGER DEFAULT 0,
  french_streak_days INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT false,
  account_status TEXT DEFAULT 'active',
  extra_data JSONB DEFAULT '{}'
);
```

### Policies (RLS)
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

---

## 4. XP Tracking System

This system powers the gamification features, including XP, levels, and streaks.

### Schema (`xp_activities`)
Stores individual XP-earning events.
```sql
CREATE TABLE IF NOT EXISTS xp_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'lesson', 'practice', 'review', 'achievement', 'streak_bonus'
  xp_gained INTEGER NOT NULL CHECK (xp_gained >= 0),
  language TEXT NOT NULL CHECK (language IN ('french', 'german', 'all')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Indexes
CREATE INDEX idx_xp_activities_user_id ON xp_activities(user_id);
CREATE INDEX idx_xp_activities_user_language ON xp_activities(user_id, language);
```

### Schema (`user_xp_stats`)
Aggregated statistics per user/language (auto-updated via triggers).
```sql
CREATE TABLE IF NOT EXISTS user_xp_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('french', 'german', 'all')),
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_level_xp INTEGER DEFAULT 0,
  next_level_xp INTEGER DEFAULT 100,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_minutes INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language)
);
```

### Schema (`language_progress`)
Detailed progress tracking for specific languages.
```sql
CREATE TABLE IF NOT EXISTS language_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('french', 'german')),
  words_learned INTEGER DEFAULT 0,
  topics_completed INTEGER DEFAULT 0,
  vocabulary_accuracy DECIMAL(5,2) DEFAULT 0.0,
  daily_xp_goal INTEGER DEFAULT 50,
  weekly_xp_goal INTEGER DEFAULT 300,
  UNIQUE(user_id, language)
);
```

### Automation
*   **Triggers:** `trigger_update_user_xp_stats` automatically recalculates total XP and levels whenever a new activity is inserted into `xp_activities`.
*   **RLS Policies:** All tables have RLS enabled, restricting access to the data owner (`auth.uid() = user_id`).

```
