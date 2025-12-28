# Daily Quotes System Documentation

## Overview

The Daily Quotes system is a full-stack feature that generates, stores, and displays multilingual motivational quotes. It consists of:
1.  **Backend**: An automated Cron Job that generates fresh quotes daily using AI.
2.  **Database**: A Supabase table storing the quotes.
3.  **Frontend**: A React component that efficiently fetches and caches these quotes for display.

---

## 1. Backend: Automated Generation (Cron Job)

**Endpoint**: `/app/api/cron/daily-quotes/route.js`  
**Schedule**: Daily at 00:00 UTC

### Functionality
-   **AI Generation**: Uses OpenRouter API (Llama 3, GPT-4, etc.) to generate 30 fresh quotes.
-   **Multilingual**: Supports English (~60%), Chinese (~15%), French (~15%), and others.
-   **Robustness**:
    -   **Retries**: Exponential backoff (3 attempts) for API calls.
    -   **Batching**: Processes quotes in batches of 5 to manage memory/rate limits.
    -   **Atomic Updates**: Transaction-like behavior with rollback on failure.
    -   **Validation**: Pre-flight checks for environment variables.

### Configuration
Required Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
CRON_SECRET=...
```

---

## 2. Frontend: Display Component (`DailyQuote.js`)

**Location**: `components/DailyQuote.js`

### Functionality
The component has been migrated from using external APIs (Zen Quotes) to querying our own Supabase database.

1.  **Direct Database Query**:
    -   Fetches a random quote directly from the `daily_quotes` table.
    -   Performance: ~100-300ms (vs 500ms+ for external API).
    -   Logic:
        1.  Gets total count of quotes.
        2.  Calculates a random offset.
        3.  Fetches the single row at that offset.

2.  **Session Caching**:
    -   Stores the fetched quote in `sessionStorage`.
    -   Ensures the user sees the **same quote** throughout their browser session.
    -   Fetches a new quote only on a new tab or window.

3.  **Resilience**:
    -   **Fallbacks**: If the DB query fails or user is offline, it falls back to a hardcoded list of 18 curated quotes.
    -   **Loading States**: Smooth "Loading inspiration..." animation.

### Code Example (Simplified)
```javascript
// Fetch random quote from Supabase
const { count } = await supabase.from('daily_quotes').select('*', { count: 'exact', head: true });
const randomOffset = Math.floor(Math.random() * count);
const { data } = await supabase.from('daily_quotes').select('*').range(randomOffset, randomOffset).single();
```

---

## 3. Database Schema

**Table**: `daily_quotes`

```sql
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  translation TEXT,
  day_id TEXT NOT NULL, -- Format: YYYY-MM-DD
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_quotes_day_id ON daily_quotes(day_id);
```

---

## 4. Maintenance & Troubleshooting

### Manual Trigger
You can manually trigger the generation for testing:
```bash
curl -X POST https://your-app.vercel.app/api/test/daily-quotes \
  -H "Authorization: Bearer YOUR_TEST_SECRET"
```

### Common Issues
-   **Missing Translations**: The frontend handles `null` translations gracefully (only displays if present).
-   **Generation Failures**: Check Vercel logs for "Execution ID". The system logs detailed batch progress.
-   **Stale Quotes**: If the cron job fails, the frontend will continue serving existing quotes from the DB (randomly selected).

---

**Version**: 2.0.0
**Status**: Production Ready
