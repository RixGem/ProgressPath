import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const DB_TIMEOUT_MS = 10000; // 10 second timeout for DB operations
const FETCH_TIMEOUT_MS = 30000; // 30 second timeout for internal API calls

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validate required environment variables
 * @returns {Object} Validation result with missing variables if any
 */
function validateEnvironment() {
  // Environment variable compatibility layer
  // Support both SUPABASE_SERVICE_ROLE_KEY (standard) and SUPABASE_SERVICE_KEY (legacy)
  // This ensures the app works regardless of which naming convention is used in deployment
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: supabaseServiceKey, // Using unified variable name
    CRON_SECRET: process.env.CRON_SECRET,
  };

  const missing = [];
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    // Enhanced error logging for debugging
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.error('Available Supabase keys:', {
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
    });
  }

  return {
    valid: missing.length === 0,
    missing,
    message: missing.length > 0 
      ? `Missing environment variables: ${missing.join(', ')}. ` +
        `For Supabase service key, use either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY.`
      : 'All required environment variables are present'
  };
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
    
    // Environment variable compatibility layer
    // Try SUPABASE_SERVICE_ROLE_KEY first (standard), fallback to SUPABASE_SERVICE_KEY (legacy)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials missing:', {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
      });
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
 * Execute database operation with timeout
 * @param {Function} operation - Async database operation
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<any>} Operation result
 */
async function executeWithTimeout(operation, timeoutMs = DB_TIMEOUT_MS) {
  return Promise.race([
    operation(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Fetch with timeout support using AbortController
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
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

// ============================================================================
// TEST ENDPOINT - POST (Trigger Quote Generation)
// ============================================================================

/**
 * Test endpoint to manually trigger daily quote generation
 * This endpoint should be protected in production
 */
export async function POST(request) {
  const startTime = Date.now();
  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST ENDPOINT - Manual Quote Generation`);
  console.log(`Test ID: ${testId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Step 1: Validate environment
    console.log('🔍 Validating environment...');
    const envValidation = validateEnvironment();
    
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:', envValidation.message);
      return NextResponse.json(
        { 
          error: 'Configuration error',
          message: envValidation.message,
          missing: envValidation.missing,
          testId
        },
        { status: 500 }
      );
    }
    console.log('✅ Environment validated');

    // Step 2: Security - Check for test authorization
    console.log('\n🔐 Verifying authorization...');
    const authHeader = request.headers.get('authorization');
    const testSecret = process.env.TEST_SECRET || process.env.CRON_SECRET;
    
    if (testSecret && authHeader !== `Bearer ${testSecret}`) {
      console.error('❌ Unauthorized test attempt');
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid or missing test secret',
          hint: 'Include "Authorization: Bearer YOUR_TEST_SECRET" header',
          testId
        },
        { status: 401 }
      );
    }
    console.log('✅ Authorization verified');

    // Step 3: Call the cron endpoint internally
    console.log('\n📞 Calling cron endpoint...');
    
    // Determine base URL with Vercel support
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    baseUrl = baseUrl || 'http://localhost:3000';
    
    const cronUrl = `${baseUrl}/api/cron/daily-quotes`;
    const cronSecret = process.env.CRON_SECRET;
    
    const response = await fetchWithTimeout(
      cronUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json'
        }
      },
      FETCH_TIMEOUT_MS
    );

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(80)}`);
    if (response.ok) {
      console.log('✅ TEST COMPLETED SUCCESSFULLY');
    } else {
      console.log('❌ TEST FAILED');
    }
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json({
      testRun: true,
      testId,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      durationSeconds: (duration / 1000).toFixed(2),
      cronEndpoint: cronUrl,
      cronResponse: data,
      httpStatus: response.status,
      success: response.ok
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`\n${'='.repeat(80)}`);
    console.error('❌ TEST ENDPOINT ERROR');
    console.error(`Error: ${error.message}`);
    console.error(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`${'='.repeat(80)}\n`);

    return NextResponse.json(
      {
        success: false,
        testId,
        error: error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        durationSeconds: (duration / 1000).toFixed(2),
        troubleshooting: [
          'Verify the cron endpoint is accessible',
          'Check that CRON_SECRET is correctly configured',
          'Ensure all environment variables are set',
          'Review Vercel logs for detailed error information'
        ]
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// TEST ENDPOINT - GET (View Current Quotes)
// ============================================================================

/**
 * GET endpoint to view current quotes in the database
 * Provides diagnostics and statistics about stored quotes
 */
export async function GET(request) {
  const startTime = Date.now();
  const queryId = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TEST ENDPOINT - View Quotes`);
  console.log(`Query ID: ${queryId}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Step 1: Validate environment
    console.log('🔍 Validating environment...');
    const envValidation = validateEnvironment();
    
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:', envValidation.message);
      return NextResponse.json(
        { 
          error: 'Configuration error',
          message: envValidation.message,
          missing: envValidation.missing,
          queryId
        },
        { status: 500 }
      );
    }

    // Step 2: Initialize Supabase client
    console.log('🔌 Initializing database connection...');
    const client = initializeSupabase();

    // Step 3: Fetch current quotes with timeout
    console.log('📖 Fetching quotes from database...');
    const today = new Date().toISOString().split('T')[0];

    const quotes = await executeWithTimeout(async () => {
      // Query using day_id field (schema consistency fix)
      const { data, error } = await client
        .from('daily_quotes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    });

    // Step 4: Analyze and categorize quotes
    console.log('🔍 Analyzing quote data...');
    
    const todayQuotes = quotes.filter(q => q.day_id === today);
    const otherDates = [...new Set(quotes.map(q => q.day_id))].filter(d => d !== today);
    const otherQuotes = quotes.filter(q => q.day_id !== today);

    // Language distribution
    const languageStats = {};
    todayQuotes.forEach(q => {
      const lang = q.language || 'unknown';
      languageStats[lang] = (languageStats[lang] || 0) + 1;
    });

    // Translation statistics
    const withTranslation = todayQuotes.filter(q => q.translation).length;
    const withoutTranslation = todayQuotes.length - withTranslation;

    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ QUERY COMPLETED SUCCESSFULLY');
    console.log(`Total Quotes: ${quotes.length}`);
    console.log(`Today's Quotes: ${todayQuotes.length}`);
    console.log(`Other Dates: ${otherDates.length}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`${'='.repeat(80)}\n`);

    return NextResponse.json({
      success: true,
      queryId,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      durationSeconds: (duration / 1000).toFixed(2),
      
      summary: {
        today: today,
        todayQuotesCount: todayQuotes.length,
        otherQuotesCount: otherQuotes.length,
        totalQuotes: quotes.length,
        datesInDatabase: [today, ...otherDates],
        datesCount: otherDates.length + 1
      },

      statistics: {
        languageDistribution: languageStats,
        translations: {
          withTranslation,
          withoutTranslation,
          percentage: todayQuotes.length > 0 
            ? ((withTranslation / todayQuotes.length) * 100).toFixed(1) + '%'
            : '0%'
        }
      },

      todayQuotes: todayQuotes.map(q => ({
        id: q.id,
        quote: q.quote,
        author: q.author,
        language: q.language,
        translation: q.translation,
        day_id: q.day_id,
        created_at: q.created_at
      })),

      // Only include other quotes if there are any
      ...(otherQuotes.length > 0 && {
        otherQuotes: {
          count: otherQuotes.length,
          dates: otherDates,
          warning: 'These quotes should have been deleted by the cron job',
          samples: otherQuotes.slice(0, 5).map(q => ({
            id: q.id,
            author: q.author,
            day_id: q.day_id
          }))
        }
      }),

      diagnostics: {
        databaseStatus: 'Connected',
        schemaVersion: 'v2.0 (multilingual)',
        expectedQuotesPerDay: 30,
        todayStatus: todayQuotes.length === 30 ? 'Complete' : 'Incomplete',
        ...(todayQuotes.length !== 30 && {
          recommendation: `Expected 30 quotes for today, found ${todayQuotes.length}. Consider running the cron job manually.`
        })
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`\n${'='.repeat(80)}`);
    console.error('❌ QUERY FAILED');
    console.error(`Error: ${error.message}`);
    console.error(`Duration: ${(duration / 1000).toFixed(2)}s`);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    console.log(`${'='.repeat(80)}\n`);

    return NextResponse.json(
      {
        success: false,
        queryId,
        error: error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        durationSeconds: (duration / 1000).toFixed(2),
        troubleshooting: [
          'Verify Supabase credentials are correct',
          'Check that daily_quotes table exists',
          'Ensure database schema matches expected format',
          'Verify network connectivity to Supabase',
          'Review Supabase logs for detailed error information'
        ]
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;
