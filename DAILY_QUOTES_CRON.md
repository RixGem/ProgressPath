# Daily Quotes Cron Job - Comprehensive Documentation

## Overview

This feature implements automated daily quote generation using Vercel Cron Jobs, OpenRouter AI API, and Supabase database. Every day at midnight UTC, the system automatically generates 30 fresh motivational quotes in multiple languages and updates the database.

## Architecture

### Components

1. **Cron Job Endpoint** (`/app/api/cron/daily-quotes/route.js`)
   - Main automated endpoint triggered by Vercel Cron
   - Runs daily at midnight (0 0 * * *)
   - Handles multilingual quote generation, deletion, and insertion

2. **Test Endpoint** (`/app/api/test/daily-quotes/route.js`)
   - Manual testing and verification endpoint
   - GET: View current quotes in database
   - POST: Manually trigger quote generation

3. **Database Table** (`daily_quotes`)
   - Stores generated quotes with multilingual support
   - Tracks language and optional translations

## Database Schema

```sql
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  translation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  day_id TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_daily_quotes_day_id ON daily_quotes(day_id);
CREATE INDEX idx_daily_quotes_language ON daily_quotes(language);
```

### Field Descriptions

- **id**: Unique UUID identifier
- **quote**: The quote text in its original language
- **author**: The author's name
- **language**: ISO 639-1 language code (en, zh, fr, es, etc.)
- **translation**: Optional translation (typically to English or Chinese)
- **created_at**: Timestamp when the quote was created
- **day_id**: Date identifier (YYYY-MM-DD format) to track which day the quotes belong to

## Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for admin operations

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-your-api-key  # Get from https://openrouter.ai/keys

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Security
CRON_SECRET=your-secure-random-string  # Generate with: openssl rand -base64 32
```

### Optional Variables

```env
TEST_SECRET=your-test-secret  # Defaults to CRON_SECRET if not set
```

## Setup Instructions

### 1. Database Setup

**Create the table in Supabase:**

```sql
-- Create the daily_quotes table with multilingual support
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  translation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  day_id TEXT NOT NULL
);

-- Add indexes
CREATE INDEX idx_daily_quotes_day_id ON daily_quotes(day_id);
CREATE INDEX idx_daily_quotes_language ON daily_quotes(language);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON daily_quotes
  FOR SELECT
  TO public
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role all operations"
  ON daily_quotes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. OpenRouter API Setup

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add the key to your environment variables

**Free Tier Information:**
- Model: `meta-llama/llama-3.1-8b-instruct:free`
- Cost: Free
- Rate Limits: Reasonable for daily use

### 3. Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables
4. Make sure to add them for Production, Preview, and Development environments

### 4. Generate Secure Secrets

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Deploy to Vercel

The `vercel.json` configuration automatically sets up the cron job.

## Quote Generation

### Output Format

The OpenRouter API generates quotes in the following JSON format:

```json
[
  {
    "quote": "学习之路没有尽头，只有新的起点",
    "author": "林语堂",
    "language": "zh",
    "translation": null
  },
  {
    "quote": "La vie est un mystère qu'il faut vivre, et non un problème à résoudre",
    "author": "Gandhi",
    "language": "fr",
    "translation": "生活是一个需要体验的奥秘，而非一个需要解决的问题"
  },
  {
    "quote": "Education is the most powerful weapon which you can use to change the world",
    "author": "Nelson Mandela",
    "language": "en",
    "translation": null
  }
]
```

### Language Distribution

The system generates a diverse mix of quotes:
- ~60% English (en)
- ~15% Chinese (zh)
- ~15% French (fr)
- ~10% Other languages (es, de, ja, etc.)

### Translation Logic

- English quotes: `translation` is `null`
- Non-English quotes: `translation` may contain an English or Chinese translation
- The frontend displays the translation when available

## Usage

### Automatic Execution

The cron job runs automatically every day at **00:00 UTC (midnight)**.

**What it does:**
1. Generates 30 new multilingual quotes using OpenRouter AI
2. Deletes previous day's quotes from database
3. Inserts new quotes with today's date
4. Logs execution details

### Manual Testing

#### View Current Quotes

```bash
curl https://your-app.vercel.app/api/test/daily-quotes
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-12-24T14:50:00.000Z",
  "today": "2025-12-24",
  "todayQuotesCount": 30,
  "otherQuotesCount": 0,
  "totalQuotes": 30,
  "todayQuotes": [
    {
      "id": "uuid",
      "quote": "学习之路没有尽头，只有新的起点",
      "author": "林语堂",
      "language": "zh",
      "translation": null,
      "day_id": "2025-12-24"
    }
    // ... more quotes
  ]
}
```

#### Manually Trigger Quote Generation

```bash
curl -X POST https://your-app.vercel.app/api/test/daily-quotes \
  -H "Authorization: Bearer YOUR_TEST_SECRET"
```

## Frontend Integration

### Displaying Quotes

The `DailyQuote` component automatically handles multilingual quotes:

```javascript
// Quote object structure
{
  quote: "La vie est un mystère qu'il faut vivre",
  author: "Gandhi",
  language: "fr",
  translation: "Life is a mystery to be lived, not a problem to be solved"
}
```

**Display Features:**
- Shows the quote in its original language
- Displays the language code for non-English quotes
- Shows translation below the quote when available
- Responsive design with proper styling

### Example Display

```
"La vie est un mystère qu'il faut vivre, et non un problème à résoudre"
—— Gandhi
Language: FR
Translation: "Life is a mystery to be lived, not a problem to be solved"
```

## Security Features

### 1. Authorization Checks

**Cron Endpoint:**
- Requires `Authorization: Bearer {CRON_SECRET}` header
- Vercel automatically includes this header when triggering cron jobs
- Prevents unauthorized manual execution

**Test Endpoint:**
- POST requests require `Authorization: Bearer {TEST_SECRET}` header
- Protects against unauthorized testing

### 2. Database Security

- Uses Supabase Service Role Key for admin operations
- Row Level Security (RLS) enabled on table
- Public can only read quotes
- Only service role can insert/update/delete

### 3. API Security

- OpenRouter API key stored securely in environment variables
- API requests include proper headers
- Rate limiting handled by OpenRouter

## Monitoring

### Vercel Dashboard

1. Navigate to your project in Vercel
2. Go to "Cron Jobs" tab
3. View execution history and logs
4. Check for failures or errors

### Supabase Dashboard

1. Navigate to Table Editor
2. Open `daily_quotes` table
3. Verify quotes are being updated daily
4. Check `day_id` column

### Manual Health Check

```bash
# Check if today's quotes exist
curl https://your-app.vercel.app/api/test/daily-quotes | jq '.todayQuotesCount'
# Expected: 30

# Check language distribution
curl https://your-app.vercel.app/api/test/daily-quotes | jq '.todayQuotes | group_by(.language) | map({language: .[0].language, count: length})'
```

## Troubleshooting

### Issue: Quotes not generating with correct format

**Check:**
1. Verify OpenRouter API response includes all required fields
2. Check the prompt in the cron job
3. Review logs for JSON parsing errors

**Solution:**
The system validates that each quote has `quote`, `author`, and `language` fields. If validation fails, the entire batch is rejected.

### Issue: Translations missing

**Expected behavior:**
- English quotes: `translation` should be `null`
- Non-English quotes: `translation` may or may not be present
- Frontend gracefully handles missing translations

### Issue: Database schema mismatch

**Check:**
```sql
-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_quotes';

-- Should show: id, quote, author, language, translation, created_at, day_id
```

**Solution:**
Drop and recreate the table, or alter it to match the new schema:

```sql
-- If migrating from old schema
ALTER TABLE daily_quotes 
  RENAME COLUMN text TO quote;

ALTER TABLE daily_quotes
  ADD COLUMN language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN translation TEXT,
  ADD COLUMN day_id TEXT;

-- Update existing records
UPDATE daily_quotes 
SET day_id = TO_CHAR(created_at, 'YYYY-MM-DD')
WHERE day_id IS NULL;

-- Make day_id NOT NULL after backfilling
ALTER TABLE daily_quotes ALTER COLUMN day_id SET NOT NULL;
```

## Performance Considerations

### Language Distribution Impact

With multiple languages:
- Database size slightly larger due to Unicode characters
- No performance impact on queries
- Indexes work efficiently with all languages

### Caching Strategy

Frontend component caches quotes in `sessionStorage`:
- Same quote displayed throughout a browser session
- New quote on new session/tab
- Reduces database queries

## Cost Analysis

**Using 100% free tiers:**

| Service | Tier | Cost |
|---------|------|------|
| OpenRouter API | Free (llama-3.1-8b) | $0/month |
| Vercel Cron Jobs | Free on all plans | $0/month |
| Supabase Database | Free tier (500 MB) | $0/month |
| **Total** | | **$0/month** |

## Future Enhancements

1. **User Language Preferences**: Filter quotes by preferred language
2. **Category Tags**: Tag quotes by theme (motivation, learning, wisdom)
3. **Quote Ratings**: Let users rate quotes
4. **Translation Improvements**: Add translations in multiple languages
5. **Voice Playback**: Add audio reading of quotes
6. **Social Sharing**: Share quotes with translations
7. **Historical Archive**: Keep all quotes in archive table
8. **Analytics**: Track popular languages and quotes

---

**Version**: 2.0.0 (Multilingual Update)  
**Last Updated**: December 24, 2025  
**Author**: Chris (RixGem)  
**Status**: Production Ready ✅
