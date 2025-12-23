# Database Migration - New French Learning Fields

## Date: December 23, 2025

This migration adds enhanced tracking fields to the `french_learning` table:
- `new_vocabulary` - Array of vocabulary words learned
- `practice_sentences` - Array of practice sentences
- `mood` - Learning session mood/difficulty indicator

## Migration Steps

### Step 1: Add New Columns

Run this SQL command in your Supabase SQL Editor:

```sql
-- Add new fields to french_learning table
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS new_vocabulary TEXT[],
ADD COLUMN IF NOT EXISTS practice_sentences TEXT[],
ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('good', 'neutral', 'difficult'));

-- Set default value for mood
ALTER TABLE french_learning 
ALTER COLUMN mood SET DEFAULT 'neutral';
```

### Step 2: Verify Schema

Check that the new columns were added successfully:

```sql
-- Verify table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'french_learning'
ORDER BY ordinal_position;
```

Expected output should include:
- `new_vocabulary` - ARRAY - YES - NULL
- `practice_sentences` - ARRAY - YES - NULL  
- `mood` - text - YES - 'neutral'::text

### Step 3: Test Insert

Test inserting a record with the new fields:

```sql
-- Test insert with new fields
INSERT INTO french_learning (
  activity_type,
  duration_minutes,
  total_time,
  notes,
  date,
  new_vocabulary,
  practice_sentences,
  mood
) VALUES (
  'vocabulary',
  30,
  30,
  'Test entry with new fields',
  CURRENT_DATE,
  ARRAY['bonjour', 'merci', 'au revoir'],
  ARRAY['Bonjour, comment allez-vous?', 'Merci beaucoup!'],
  'good'
);
```

### Step 4: Verify Data

Check that the test data was inserted correctly:

```sql
-- Verify the test insert
SELECT 
  id,
  activity_type,
  duration_minutes,
  date,
  new_vocabulary,
  array_length(new_vocabulary, 1) as vocab_count,
  practice_sentences,
  array_length(practice_sentences, 1) as sentence_count,
  mood
FROM french_learning
WHERE notes = 'Test entry with new fields';
```

### Step 5: Clean Up Test Data (Optional)

If you want to remove the test entry:

```sql
-- Remove test entry
DELETE FROM french_learning 
WHERE notes = 'Test entry with new fields';
```

## Complete Migration Script

Run all commands together in a transaction:

```sql
-- Complete migration script for new french_learning fields
BEGIN;

-- 1. Add new columns
ALTER TABLE french_learning 
ADD COLUMN IF NOT EXISTS new_vocabulary TEXT[],
ADD COLUMN IF NOT EXISTS practice_sentences TEXT[],
ADD COLUMN IF NOT EXISTS mood TEXT CHECK (mood IN ('good', 'neutral', 'difficult'));

-- 2. Set default for mood
ALTER TABLE french_learning 
ALTER COLUMN mood SET DEFAULT 'neutral';

-- 3. Verify changes
SELECT 
  'Migration Complete' as status,
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'french_learning'
  AND column_name IN ('new_vocabulary', 'practice_sentences', 'mood', 'total_time')
ORDER BY column_name;

COMMIT;
```

## Updated Table Schema

After migration, your `french_learning` table should have this structure:

```sql
CREATE TABLE french_learning (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_time INTEGER NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  new_vocabulary TEXT[],              -- NEW: Array of vocabulary words
  practice_sentences TEXT[],          -- NEW: Array of practice sentences
  mood TEXT DEFAULT 'neutral'         -- NEW: Learning session mood
    CHECK (mood IN ('good', 'neutral', 'difficult')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

## Field Details

### new_vocabulary (TEXT ARRAY)
- **Type**: Array of text strings
- **Nullable**: Yes (NULL if no vocabulary logged)
- **Purpose**: Track new vocabulary words learned in each session
- **Example**: `['bonjour', 'merci', 'au revoir']`
- **UI Display**: Green badges showing each word

### practice_sentences (TEXT ARRAY)
- **Type**: Array of text strings
- **Nullable**: Yes (NULL if no sentences logged)
- **Purpose**: Store practice sentences used during learning
- **Example**: `['Bonjour, comment allez-vous?', 'Merci beaucoup!']`
- **UI Display**: Bullet list with blue icon

### mood (TEXT)
- **Type**: Text with constraint
- **Nullable**: Yes (defaults to 'neutral')
- **Valid Values**: 'good', 'neutral', 'difficult'
- **Purpose**: Track how the learning session felt
- **UI Display**: Emoji indicator (😊 😐 😓)

## Features Enabled

After this migration, the French learning page will support:

1. ✅ **Vocabulary Tracking**
   - Enter comma-separated words in the form
   - View total vocabulary count in stats
   - See vocabulary badges on each activity

2. ✅ **Sentence Practice**
   - Log practice sentences for each session
   - View sentences in activity details

3. ✅ **Mood Tracking**
   - Select how the session went
   - Visual mood indicators
   - Track learning difficulty patterns

4. ✅ **Streak Calculation**
   - Automatic calculation of consecutive learning days
   - Streak counter in stats
   - Visual 7-day activity calendar

5. ✅ **Enhanced Stats Dashboard**
   - Total Hours (proper conversion)
   - Current Streak
   - Total Sessions
   - Total Vocabulary Words

## Data Migration Notes

### For Existing Records
- Existing records will have `NULL` values for the new fields
- This is expected and won't cause any issues
- The UI handles `NULL` values gracefully
- You can edit old activities to add vocabulary and mood if desired

### Array Field Handling
- Empty arrays are stored as `NULL` (more efficient)
- The app converts comma-separated input to arrays automatically
- Arrays are displayed as badges/lists in the UI

## Troubleshooting

### Issue: "column already exists"
**Solution**: The columns already exist. Skip the ALTER TABLE step.

### Issue: "check constraint violation"
**Solution**: Ensure mood values are exactly 'good', 'neutral', or 'difficult' (lowercase).

### Issue: Arrays not displaying
**Solution**: 
1. Check that data is stored as PostgreSQL array type
2. Verify with: `SELECT new_vocabulary FROM french_learning WHERE new_vocabulary IS NOT NULL LIMIT 1;`
3. Should show: `{word1,word2,word3}`

### Issue: Total Hours showing incorrect value
**Solution**: Ensure `total_time` field exists and is populated. See `DATABASE_MIGRATION.md` for total_time migration.

## Verification Queries

### Check all new fields are working:
```sql
SELECT 
  id,
  date,
  activity_type,
  mood,
  COALESCE(array_length(new_vocabulary, 1), 0) as vocab_count,
  COALESCE(array_length(practice_sentences, 1), 0) as sentence_count,
  total_time
FROM french_learning
ORDER BY date DESC
LIMIT 10;
```

### Get statistics:
```sql
SELECT 
  COUNT(*) as total_sessions,
  SUM(total_time) as total_minutes,
  ROUND(SUM(total_time)::numeric / 60, 1) as total_hours,
  SUM(COALESCE(array_length(new_vocabulary, 1), 0)) as total_vocabulary,
  COUNT(*) FILTER (WHERE mood = 'good') as good_sessions,
  COUNT(*) FILTER (WHERE mood = 'neutral') as neutral_sessions,
  COUNT(*) FILTER (WHERE mood = 'difficult') as difficult_sessions
FROM french_learning;
```

## Testing Checklist

After migration, test these features:

- [ ] Form accepts vocabulary input (comma-separated)
- [ ] Form accepts practice sentences (comma-separated)
- [ ] Form allows mood selection
- [ ] Total Hours displays correctly (minutes ÷ 60)
- [ ] Streak counter updates correctly
- [ ] Vocabulary count shows in stats
- [ ] Vocabulary badges appear on activities
- [ ] Practice sentences display as list
- [ ] Mood emojis show on activities
- [ ] 7-day visualization shows correct data
- [ ] Can log activity without vocabulary/sentences (optional fields)

## Next Steps

1. ✅ Run the migration script in Supabase
2. ✅ Verify all columns exist
3. ✅ Test inserting a new activity from the UI
4. ✅ Check that stats update correctly
5. ✅ Verify existing activities still display properly
6. 📊 Start tracking your enhanced French learning data!

---

**Migration Status**: Ready to apply  
**Breaking Changes**: No  
**Data Loss Risk**: None  
**Rollback**: Simply remove the new columns if needed

For questions or issues, please refer to the main `DATABASE_MIGRATION.md` or open an issue on GitHub.
