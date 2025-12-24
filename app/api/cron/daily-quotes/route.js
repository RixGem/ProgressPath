import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const BATCH_SIZE = 5; // Process quotes in batches of 5
const TOTAL_QUOTES = 30;
const API_TIMEOUT_MS = 30000; // 30 second timeout for API calls
const DB_TIMEOUT_MS = 10000; // 10 second timeout for DB operations
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validate all required environment variables at startup
 * @throws {Error} If any required variables are missing
 */
function validateEnvironment() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  };

  const missing = [];
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please configure these in your Vercel project settings.`
    );
  }

  // Validate URL format
  try {
    new URL(required.NEXT_PUBLIC_SUPABASE_URL);
  } catch (e) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
  }

  console.log('✅ Environment validation passed');
}

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

let supabaseAdmin = null;
let initializationError = null;

/**
 * Safely initialize Supabase admin client with error handling
 * @returns {Object|null} Supabase client or null if initialization fails
 */
function initializeSupabase() {
  if (supabaseAdmin) return supabaseAdmin;
  if (initializationError) throw initializationError;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase client initialized successfully');
    return supabaseAdmin;
  } catch (error) {
    initializationError = error;
    console.error('❌ Failed to initialize Supabase client:', error.message);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt) {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

/**
 * Fetch with timeout support using AbortController
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Execute database operation with timeout
 * @param {Function} operation - Async database operation
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<any>} Operation result
 */
async function executeWithTimeout(operation, timeoutMs = DB_TIMEOUT_MS) {
  return Promise.race([
    operation(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Database operation timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// ============================================================================
// QUOTE GENERATION WITH RETRY
// ============================================================================

/**
 * Generate quotes with exponential backoff retry mechanism
 * @param {number} count - Number of quotes to generate
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Array>} Array of quote objects
 */
async function generateQuotesWithRetry(count, attempt = 0) {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  
  try {
    console.log(`📝 Generating ${count} quotes (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);
    
    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://progresspath.vercel.app',
          'X-Title': 'ProgressPath Daily Quotes'
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL_ID || 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: `You are a multilingual motivational quote generator. Generate exactly ${count} unique, inspiring quotes about learning, growth, perseverance, success, and personal development.

Include quotes in multiple languages (English, Chinese, French, Spanish, etc.) to provide diverse cultural perspectives.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array
- NO markdown formatting, NO code blocks, NO additional text
- Each quote object MUST have these exact fields:
  * "quote": the quote text in its original language
  * "author": the author's name  
  * "language": ISO 639-1 language code (en, zh, fr, es, etc.)
  * "translation": English or Chinese translation (null if quote is already in English or Chinese)

Example:
[
  {
    "quote": "学习之路没有尽头，只有新的起点",
    "author": "林语堂",
    "language": "zh",
    "translation": null
  },
  {
    "quote": "La vie est un mystère qu'il faut vivre",
    "author": "Gandhi",
    "language": "fr",
    "translation": "Life is a mystery to be lived"
  }
]

Generate a diverse mix: ~60% English, ~15% Chinese, ~15% French, ~10% other languages.`
            },
            {
              role: 'user',
              content: `Generate exactly ${count} motivational quotes in valid JSON array format. Return ONLY the JSON array, no other text.`
            }
          ],
          temperature: 0.9,
          max_tokens: count * 120 // ~120 tokens per quote
        })
      },
      API_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenRouter API');
    }

    // Extract and parse JSON
    let jsonStr = content.trim();
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '');
    
    // Find JSON array in content
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    const quotes = JSON.parse(jsonStr);
    
    if (!Array.isArray(quotes)) {
      throw new Error('Response is not a valid JSON array');
    }

    if (quotes.length < count) {
      throw new Error(`Expected ${count} quotes, got ${quotes.length}`);
    }

    // Validate and sanitize quote structure
    const validatedQuotes = quotes.slice(0, count).map((quote, index) => {
      if (!quote.quote || !quote.author || !quote.language) {
        throw new Error(`Quote ${index + 1} missing required fields`);
      }

      return {
        quote: String(quote.quote).trim(),
        author: String(quote.author).trim(),
        language: String(quote.language).toLowerCase().trim(),
        translation: quote.translation ? String(quote.translation).trim() : null
      };
    });

    console.log(`✅ Successfully generated ${validatedQuotes.length} quotes`);
    return validatedQuotes;

  } catch (error) {
    console.error(`❌ Quote generation failed (attempt ${attempt + 1}):`, error.message);

    // Retry with exponential backoff
    if (attempt < MAX_RETRIES) {
      const delay = calculateBackoff(attempt);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await sleep(delay);
      return generateQuotesWithRetry(count, attempt + 1);
    }

    throw new Error(`Failed to generate quotes after ${MAX_RETRIES + 1} attempts: ${error.message}`);
  }
}

/**
 * Generate all quotes in batches
 * @returns {Promise<Array>} Array of all generated quotes
 */
async function generateQuotesInBatches() {
  const allQuotes = [];
  const batches = Math.ceil(TOTAL_QUOTES / BATCH_SIZE);
  
  console.log(`📦 Generating ${TOTAL_QUOTES} quotes in ${batches} batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < batches; i++) {
    const remaining = TOTAL_QUOTES - allQuotes.length;
    const batchSize = Math.min(BATCH_SIZE, remaining);
    
    console.log(`\n🔄 Processing batch ${i + 1}/${batches} (${batchSize} quotes)...`);
    
    try {
      const batchQuotes = await generateQuotesWithRetry(batchSize);
      allQuotes.push(...batchQuotes);
      
      // Small delay between batches to avoid rate limiting
      if (i < batches - 1) {
        await sleep(500);
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error.message);
      throw new Error(`Batch processing failed at batch ${i + 1}: ${error.message}`);
    }
  }

  console.log(`\n✅ All batches completed: ${allQuotes.length} total quotes generated`);
  return allQuotes;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Delete previous quotes with proper error handling and cleanup
 * @param {Object} client - Supabase client
 * @returns {Promise<Object>} Deletion result
 */
async function deletePreviousQuotes(client) {
  let deletedCount = 0;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🗑️  Deleting quotes from previous days (keeping ${today})...`);

    const result = await executeWithTimeout(async () => {
      const { data, error, count } = await client
        .from('daily_quotes')
        .delete()
        .neq('day_id', today)
        .select('id', { count: 'exact' });

      if (error) throw error;
      return { data, count };
    });

    deletedCount = result.count || 0;
    console.log(`✅ Deleted ${deletedCount} previous quotes`);
    
    return { 
      success: true, 
      deletedCount,
      date: today 
    };

  } catch (error) {
    console.error('❌ Error deleting previous quotes:', error.message);
    
    // Attempt cleanup on partial failure
    if (deletedCount > 0) {
      console.log(`⚠️  Partial deletion: ${deletedCount} quotes were deleted before error`);
    }
    
    throw new Error(`Database deletion failed: ${error.message}`);
  }
}

/**
 * Insert quotes in batches with transaction-like behavior
 * @param {Object} client - Supabase client
 * @param {Array} quotes - Array of quote objects
 * @returns {Promise<Object>} Insertion result
 */
async function insertQuotesWithRollback(client, quotes) {
  const today = new Date().toISOString().split('T')[0];
  const insertedIds = [];
  
  try {
    console.log(`💾 Inserting ${quotes.length} quotes for ${today}...`);

    // Prepare quotes with consistent schema
    const quotesWithDate = quotes.map((quote) => ({
      quote: quote.quote,
      author: quote.author,
      language: quote.language || 'en',
      translation: quote.translation || null,
      day_id: today,
      created_at: new Date().toISOString()
    }));

    // Insert all quotes in a single operation with timeout
    const result = await executeWithTimeout(async () => {
      const { data, error } = await client
        .from('daily_quotes')
        .insert(quotesWithDate)
        .select('id');

      if (error) throw error;
      return data;
    });

    insertedIds.push(...result.map(r => r.id));
    
    console.log(`✅ Successfully inserted ${insertedIds.length} quotes`);
    
    return { 
      success: true, 
      insertedCount: insertedIds.length,
      insertedIds,
      date: today
    };

  } catch (error) {
    console.error('❌ Error inserting quotes:', error.message);
    
    // Rollback: attempt to delete partially inserted quotes
    if (insertedIds.length > 0) {
      console.log(`⚠️  Attempting rollback of ${insertedIds.length} partially inserted quotes...`);
      
      try {
        await executeWithTimeout(async () => {
          const { error: deleteError } = await client
            .from('daily_quotes')
            .delete()
            .in('id', insertedIds);
          
          if (deleteError) throw deleteError;
        }, 5000); // Shorter timeout for rollback
        
        console.log(`✅ Rollback successful: removed ${insertedIds.length} quotes`);
      } catch (rollbackError) {
        console.error(`❌ Rollback failed:`, rollbackError.message);
        console.error(`⚠️  Manual cleanup may be required for IDs: ${insertedIds.join(', ')}`);
      }
    }
    
    throw new Error(`Database insertion failed: ${error.message}`);
  }
}

// ============================================================================
// MAIN CRON JOB HANDLER
// ============================================================================

/**
 * Main cron job handler with comprehensive error handling
 * Runs daily at midnight to refresh quotes
 */
export async function GET(request) {
  const startTime = Date.now();
  const executionId = `cron-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 DAILY QUOTES CRON JOB STARTED`);
  console.log(`Execution ID: ${executionId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Step 1: Validate environment
    console.log('🔍 Step 1: Validating environment...');
    validateEnvironment();

    // Step 2: Verify authorization
    console.log('\n🔐 Step 2: Verifying authorization...');
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron job attempt');
      console.error(`Expected: Bearer ${cronSecret.substring(0, 10)}...`);
      console.error(`Received: ${authHeader || 'No authorization header'}`);
      
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid or missing authorization token',
          executionId
        },
        { status: 401 }
      );
    }
    console.log('✅ Authorization verified');

    // Step 3: Initialize Supabase client
    console.log('\n🔌 Step 3: Initializing database connection...');
    const client = initializeSupabase();

    // Step 4: Generate quotes in batches
    console.log('\n📝 Step 4: Generating quotes...');
    const quotes = await generateQuotesInBatches();

    // Step 5: Delete previous quotes
    console.log('\n🗑️  Step 5: Cleaning up old quotes...');
    const deleteResult = await deletePreviousQuotes(client);

    // Step 6: Insert new quotes
    console.log('\n💾 Step 6: Saving new quotes...');
    const insertResult = await insertQuotesWithRollback(client, quotes);

    // Success!
    const duration = Date.now() - startTime;
    const result = {
      success: true,
      executionId,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      durationSeconds: (duration / 1000).toFixed(2),
      statistics: {
        quotesGenerated: quotes.length,
        quotesDeleted: deleteResult.deletedCount,
        quotesInserted: insertResult.insertedCount,
        batches: Math.ceil(TOTAL_QUOTES / BATCH_SIZE),
        batchSize: BATCH_SIZE
      },
      date: insertResult.date,
      message: 'Daily quotes successfully refreshed'
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log('✨ CRON JOB COMPLETED SUCCESSFULLY');
    console.log(`Duration: ${result.durationSeconds}s`);
    console.log(`Generated: ${result.statistics.quotesGenerated} quotes`);
    console.log(`Deleted: ${result.statistics.quotesDeleted} old quotes`);
    console.log(`Inserted: ${result.statistics.quotesInserted} new quotes`);
    console.log(`${'='.repeat(80)}\n`);

    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`\n${'='.repeat(80)}`);
    console.error('❌ CRON JOB FAILED');
    console.error(`Error: ${error.message}`);
    console.error(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.error(`Stack trace:`, error.stack);
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json(
      {
        success: false,
        executionId,
        error: error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        durationSeconds: (duration / 1000).toFixed(2),
        recommendations: [
          'Check Vercel logs for detailed error information',
          'Verify all environment variables are correctly set',
          'Ensure Supabase database is accessible',
          'Check OpenRouter API status and rate limits',
          'Review database schema matches expected format'
        ]
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;
