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
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free  # AI model to use for quote generation
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

### 3. AI Model Configuration (OPENROUTER_MODEL_ID)

The `OPENROUTER_MODEL_ID` environment variable allows you to customize which AI model is used for generating daily quotes. This gives you flexibility to balance between cost, quality, and performance.

#### What is OPENROUTER_MODEL_ID?

This variable specifies the exact AI model that OpenRouter will use to generate quotes. Different models have different:
- **Capabilities**: Some models are better at creative writing, multilingual content, or following instructions
- **Costs**: Models range from free to premium pricing
- **Speed**: Response times vary by model complexity
- **Quality**: More advanced models typically produce higher quality outputs

#### Default Model

If you don't set this variable, the system uses:
```env
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
```

This is a free, high-quality model that works well for generating motivational quotes.

#### How to Change Models

To use a different model:

1. **Browse Available Models**: Visit [OpenRouter Models](https://openrouter.ai/models)
2. **Choose a Model**: Select based on your needs (see recommendations below)
3. **Copy Model ID**: Each model has a unique identifier (e.g., `openai/gpt-4o`)
4. **Update Environment Variable**: In Vercel or your `.env.local`:
   ```env
   OPENROUTER_MODEL_ID=openai/gpt-4o
   ```
5. **Redeploy**: Changes take effect on next deployment

#### Recommended Models

**For Best Quality (Paid):**

| Model | ID | Cost | Best For |
|-------|-----|------|----------|
| GPT-4o | `openai/gpt-4o` | ~$0.005/request | Highest quality, best multilingual support |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | ~$0.003/request | Thoughtful, nuanced quotes |
| GPT-4 Turbo | `openai/gpt-4-turbo` | ~$0.010/request | Premium quality, excellent reasoning |

**For Free Tier:**

| Model | ID | Cost | Best For |
|-------|-----|------|----------|
| Llama 3.1 8B | `meta-llama/llama-3.1-8b-instruct:free` | Free | Default choice, balanced performance |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct:free` | Free | Better quality than 8B, slightly slower |
| Mistral 7B | `mistralai/mistral-7b-instruct:free` | Free | Fast, good for simple quotes |

**For Budget-Conscious (Low-Cost):**

| Model | ID | Cost | Best For |
|-------|-----|------|----------|
| GPT-3.5 Turbo | `openai/gpt-3.5-turbo` | ~$0.0005/request | Great balance of cost and quality |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` | ~$0.0008/request | High quality at low cost |
| Mixtral 8x7B | `mistralai/mixtral-8x7b-instruct` | ~$0.0007/request | Excellent value for money |

#### Model Selection Guide

**Choose based on your priorities:**

1. **Free Forever**: Stick with `meta-llama/llama-3.1-8b-instruct:free`
   - Good quality
   - No cost
   - Sufficient for daily quotes

2. **Best Quality, Cost No Object**: Use `openai/gpt-4o`
   - Premium quality quotes
   - Excellent multilingual support
   - ~$0.15/month for daily generation

3. **Budget-Friendly Premium**: Use `openai/gpt-3.5-turbo`
   - Significant quality improvement over free models
   - Only ~$0.015/month
   - Good multilingual capabilities

4. **Best Free Option**: Use `meta-llama/llama-3.1-70b-instruct:free`
   - Better than the 8B version
   - Still completely free
   - Slightly slower response time

#### Testing Different Models

To test a model before committing:

```bash
# Update the environment variable
export OPENROUTER_MODEL_ID="openai/gpt-3.5-turbo"

# Trigger a test generation
curl -X POST https://your-app.vercel.app/api/test/daily-quotes \
  -H "Authorization: Bearer YOUR_TEST_SECRET"

# Review the generated quotes for quality
curl https://your-app.vercel.app/api/test/daily-quotes | jq '.todayQuotes'
```

#### Model Performance Considerations

**Response Time:**
- Free models: 2-5 seconds
- Paid models: 1-3 seconds
- Premium models: 1-2 seconds

**Quality Indicators:**
- Quote relevance and depth
- Multilingual accuracy
- Translation quality
- Author attribution correctness
- JSON format compliance

**Rate Limits:**
- Free models: Usually 20-50 requests/minute
- Paid models: Higher limits based on your plan
- Check [OpenRouter documentation](https://openrouter.ai/docs) for specifics

#### Example Configuration

**Production Setup (Free):**
```env
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
```

**Production Setup (Premium):**
```env
OPENROUTER_MODEL_ID=openai/gpt-4o
```

**Development/Testing:**
```env
OPENROUTER_MODEL_ID=openai/gpt-3.5-turbo
```

#### Troubleshooting Model Issues

**Issue: Model not found error**

Make sure the model ID is correct. Check [OpenRouter Models](https://openrouter.ai/models) for valid IDs.

**Issue: Rate limit exceeded**

Free models have stricter rate limits. Consider:
- Using a paid model
- Adding retry logic
- Scheduling cron jobs at different times

**Issue: Poor quote quality**

Try upgrading to a more capable model:
- From 8B → 70B (free upgrade)
- From free → GPT-3.5 Turbo (low-cost upgrade)
- From any → GPT-4o (premium upgrade)

**Issue: Cost concerns**

Estimate monthly costs:
```
Daily generations: 1
Quotes per generation: 30
Model cost per request: $0.0005 (GPT-3.5)
Monthly cost: 30 days × $0.0005 = $0.015/month
```

Most paid models cost less than $0.20/month for daily quote generation.

### 4. Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all required environment variables
4. Make sure to add them for Production, Preview, and Development environments

### 5. Generate Secure Secrets

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 6. Deploy to Vercel

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

**Premium option with GPT-4o:**

| Service | Tier | Cost |
|---------|------|------|
| OpenRouter API | GPT-4o | ~$0.15/month |
| Vercel Cron Jobs | Free on all plans | $0/month |
| Supabase Database | Free tier (500 MB) | $0/month |
| **Total** | | **~$0.15/month** |

**Budget option with GPT-3.5:**

| Service | Tier | Cost |
|---------|------|------|
| OpenRouter API | GPT-3.5 Turbo | ~$0.015/month |
| Vercel Cron Jobs | Free on all plans | $0/month |
| Supabase Database | Free tier (500 MB) | $0/month |
| **Total** | | **~$0.015/month** |

## Future Enhancements

1. **User Language Preferences**: Filter quotes by preferred language
2. **Category Tags**: Tag quotes by theme (motivation, learning, wisdom)
3. **Quote Ratings**: Let users rate quotes
4. **Translation Improvements**: Add translations in multiple languages
5. **Voice Playback**: Add audio reading of quotes
6. **Social Sharing**: Share quotes with translations
7. **Historical Archive**: Keep all quotes in archive table
8. **Analytics**: Track popular languages and quotes
9. **A/B Testing Models**: Compare quote quality across different AI models
10. **Custom Model Training**: Fine-tune models for specific quote styles

---

**Version**: 2.0.0 (Multilingual Update)  
**Last Updated**: December 24, 2025  
**Author**: Chris (RixGem)  
**Status**: Production Ready ✅
