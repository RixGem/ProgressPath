# Daily Quotes System Documentation (GitHub Actions)

## Overview

The Daily Quotes system has been migrated from Vercel Serverless Functions to **GitHub Actions** to bypass execution time limits and ensure reliable generation of multilingual AI quotes.

## Architecture

1.  **Script**: `scripts/generate-quotes.js`
    -   A standalone Node.js script that handles the logic:
        -   Connects to OpenRouter AI (Gemini Flash Lite).
        -   Generates 30 quotes in batches.
        -   Connects to Supabase.
        -   Deletes old quotes and inserts new ones.
    
2.  **Automation**: `.github/workflows/daily-quotes.yml`
    -   **Schedule**: Runs automatically every day at 00:00 UTC.
    -   **Manual Trigger**: Can be manually triggered from the "Actions" tab in GitHub.
    -   **Timeout**: Configured with a 10-minute timeout (plenty of buffer).

3.  **Frontend**: `components/DailyQuote.js` (Unchanged)
    -   Fetches quotes directly from Supabase `daily_quotes` table.
    -   Falls back to local quotes if the table is empty.

---

## Setup Guide

### 1. GitHub Secrets
To make this work, you must configure the following **Secrets** in your GitHub Repository settings (`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`):

| Secret Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (starts with `ey...`) |
| `OPENROUTER_API_KEY` | Your OpenRouter API Key |

### 2. GitHub Variables (Optional)
You can configure these under the "Variables" tab if you want to change defaults without editing code:

| Variable Name | Default Value | Description |
|---|---|---|
| `OPENROUTER_MODEL_ID` | `google/gemini-2.0-flash-lite-preview-02-05:free` | The AI model to use. |
| `NEXT_PUBLIC_APP_URL` | `https://progresspath.vercel.app` | Your Vercel domain. |

---

## How to Run Manually

1.  Go to your GitHub repository.
2.  Click on the **Actions** tab.
3.  Select **Daily Quotes Generator** from the left sidebar.
4.  Click the **Run workflow** dropdown button on the right.
5.  Click the green **Run workflow** button.

## Troubleshooting

-   **Workflow Failed**: Click on the failed run in the Actions tab to see the logs. The script prints detailed logs for every step (Batch 1/6, etc.).
-   **Database Error**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is correct and has write access.
-   **AI Error**: Check if `OPENROUTER_API_KEY` is valid or if you've hit rate limits.