# 🗄️ Supabase Daily Quotes Setup Guide

## Overview

This guide will help you set up the `daily_quotes` table in your Supabase database to enable the new quote system.

## Prerequisites

- ✅ Supabase project already created
- ✅ Environment variables configured (`.env.local`)
- ✅ `@supabase/supabase-js` package installed

## Setup Steps

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (ProgressPath)
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run Setup Script

1. Open the file `supabase_daily_quotes_setup.sql` from this repository
2. Copy the **entire content** of the file
3. Paste it into the SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter`)

### Step 3: Verify Installation

The script includes verification queries at the end. You should see:

```
✓ Table created successfully
✓ Row Level Security enabled
✓ Public read policy created
✓ 50+ quotes inserted
✓ Indexes created
```

**Check results:**
```sql
-- See total quotes
SELECT COUNT(*) as total_quotes FROM daily_quotes;
-- Expected: 50+

-- See quotes by category
SELECT category, COUNT(*) as count 
FROM daily_quotes 
GROUP BY category;
-- Expected: 6 categories with various counts

-- View sample quotes
SELECT quote_text, author, category 
FROM daily_quotes 
LIMIT 5;
-- Should display 5 quotes with their authors
```

## What Gets Created

### Database Table
```sql
daily_quotes
├── id (SERIAL PRIMARY KEY)
├── quote_text (TEXT, NOT NULL)
├── author (VARCHAR(255), NOT NULL)
├── category (VARCHAR(100), optional)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Security Policies
- **Public Read Access**: Anyone can read quotes (required for frontend)
- **Protected Writes**: Only authenticated users can modify (optional)

### Initial Data
The script populates the table with **50+ quotes** across these categories:
- 🌱 Personal Growth (10 quotes)
- 📚 Learning (10 quotes)
- 💭 Philosophy (8 quotes)
- 🎯 Motivation (8 quotes)
- 🏆 Success (6 quotes)
- 🎨 Creativity (5 quotes)

### Performance Optimizations
- Index on `category` field for fast filtering
- Efficient random selection method
- Minimal data transfer (only 2 fields queried)

## Testing Your Setup

### Test 1: Manual Query
Run this in SQL Editor:
```sql
SELECT quote_text, author 
FROM daily_quotes 
ORDER BY RANDOM() 
LIMIT 1;
```
**Expected:** One random quote displayed

### Test 2: Count Query
```sql
SELECT COUNT(*) FROM daily_quotes;
```
**Expected:** Number ≥ 50

### Test 3: Frontend Test
1. Start your development server: `npm run dev`
2. Open the homepage
3. Look for a quote displayed
4. Check browser console for any errors

### Test 4: Session Caching
1. Refresh the page multiple times
2. The same quote should persist
3. Open a new tab
4. A different quote should appear

## Troubleshooting

### ❌ Error: "relation 'daily_quotes' does not exist"

**Problem:** Table not created  
**Solution:**
```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'daily_quotes';

-- If empty, run the setup script again
```

### ❌ Error: "permission denied for table daily_quotes"

**Problem:** RLS policy not configured correctly  
**Solution:**
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'daily_quotes';

-- Should show rowsecurity = true

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'daily_quotes';

-- Should show "Allow public read access" policy
```

### ❌ No quotes displayed on frontend

**Problem:** Empty table or query error  
**Solution:**
```sql
-- Verify data exists
SELECT COUNT(*) FROM daily_quotes;

-- If 0, run just the INSERT statements from the setup script
```

### ❌ "Same quote every time" issue

**Problem:** Session storage caching working correctly (this is expected!)  
**To get new quote:**
```javascript
// In browser console:
sessionStorage.removeItem('dailyQuote_cache')
sessionStorage.removeItem('dailyQuote_timestamp')
location.reload()

// Or just open a new browser tab
```

## Managing Quotes

### Add a New Quote
```sql
INSERT INTO daily_quotes (quote_text, author, category) 
VALUES (
  'Your inspirational quote here',
  'Author Name',
  'Category'
);
```

### Update a Quote
```sql
UPDATE daily_quotes 
SET 
  quote_text = 'Updated quote text',
  updated_at = NOW()
WHERE id = 1;
```

### Delete a Quote
```sql
DELETE FROM daily_quotes 
WHERE id = 1;
```

### View All Categories
```sql
SELECT DISTINCT category 
FROM daily_quotes 
ORDER BY category;
```

### Get Random Quote by Category
```sql
SELECT quote_text, author 
FROM daily_quotes 
WHERE category = 'Learning'
ORDER BY RANDOM() 
LIMIT 1;
```

## Using Supabase UI

You can also manage quotes through the Supabase Table Editor:

1. Go to **"Table Editor"** in Supabase Dashboard
2. Find `daily_quotes` table
3. Use the UI to:
   - View all quotes
   - Add new quotes (click "Insert row")
   - Edit existing quotes (click on any cell)
   - Delete quotes (click row, then "Delete")
   - Filter and search

## Advanced Configuration

### Enable Category Filtering (Future Enhancement)

If you want to add category-based filtering later:

```javascript
// In components/DailyQuote.js
const { data } = await supabase
  .from('daily_quotes')
  .select('quote_text, author')
  .eq('category', 'Learning')  // Filter by category
  .limit(1)
  .single()
```

### Add More Fields

To add additional metadata:

```sql
ALTER TABLE daily_quotes 
ADD COLUMN language VARCHAR(10) DEFAULT 'en',
ADD COLUMN tags TEXT[],
ADD COLUMN likes_count INTEGER DEFAULT 0;
```

### Backup Your Quotes

Export to CSV:
1. Go to Table Editor
2. Select `daily_quotes` table
3. Click export icon
4. Choose CSV format

Or use SQL:
```sql
COPY daily_quotes TO '/tmp/daily_quotes_backup.csv' 
WITH (FORMAT CSV, HEADER);
```

## Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** These should already be configured since your app uses Supabase for other features.

## Migration Complete! 🎉

Once the setup is complete:
- ✅ Quotes are served from your own database
- ✅ No external API dependency
- ✅ Faster load times
- ✅ Full control over content
- ✅ Easy to manage and update

## Next Steps

1. **Test the frontend** - Verify quotes display correctly
2. **Add more quotes** - Expand your collection
3. **Customize categories** - Tailor to your app's theme
4. **Monitor performance** - Check Supabase dashboard for query stats

## Need Help?

- 📖 See `SUPABASE_QUOTES_MIGRATION.md` for technical details
- 📝 Check `supabase_daily_quotes_setup.sql` for the complete SQL script
- 🐛 Open an issue if you encounter problems
- 💬 Consult [Supabase Documentation](https://supabase.com/docs)

---

**Happy Coding! 🚀**
