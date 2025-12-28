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
```
