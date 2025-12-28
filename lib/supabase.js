import { createClient } from '@supabase/supabase-js'

// ============================================================================
// SECURITY FIX #2: Supabase Initialization with Error Handling
// ============================================================================
// Added comprehensive error handling for missing environment variables
// Provides graceful degradation and clear error messages

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Initialize Supabase client with error handling
 * @returns {Object} Supabase client instance or mock object
 */
function initializeSupabase() {
  // Check for missing environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SECURITY] Supabase initialization failed: Missing environment variables');
    console.error('[SECURITY] Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    // Return a mock client that provides helpful error messages
    return createMockSupabaseClient();
  }

  try {
    // Validate URL format
    if (!isValidUrl(supabaseUrl)) {
      console.error('[SECURITY] Invalid Supabase URL format:', supabaseUrl);
      return createMockSupabaseClient();
    }

    // Create the actual Supabase client
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: false, // Temporarily disabled to debug refresh hanging issues
      },
    });

    console.log('[SUPABASE] Client initialized (autoRefresh: false)');
    return client;
  } catch (error) {
    console.error('[SECURITY] Supabase client creation failed:', error);
    console.error('[SECURITY] Falling back to mock client');
    return createMockSupabaseClient();
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Create a mock Supabase client for graceful degradation
 * @returns {Object} Mock client that returns helpful errors
 */
function createMockSupabaseClient() {
  const createErrorResponse = (operation) => ({
    data: null,
    error: {
      message: `Supabase not initialized. Operation: ${operation}`,
      code: 'SUPABASE_NOT_INITIALIZED',
      details: 'Check environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
    },
  });

  return {
    from: () => ({
      select: () => Promise.resolve(createErrorResponse('select')),
      insert: () => Promise.resolve(createErrorResponse('insert')),
      update: () => Promise.resolve(createErrorResponse('update')),
      delete: () => Promise.resolve(createErrorResponse('delete')),
      upsert: () => Promise.resolve(createErrorResponse('upsert')),
    }),
    auth: {
      getSession: () => Promise.resolve(createErrorResponse('getSession')),
      signIn: () => Promise.resolve(createErrorResponse('signIn')),
      signOut: () => Promise.resolve(createErrorResponse('signOut')),
      signUp: () => Promise.resolve(createErrorResponse('signUp')),
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {},
        }),
      }),
    }),
  };
}

// Export the initialized client
export const supabase = initializeSupabase();

// Export initialization status for debugging
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Check if Supabase is properly configured
 * @returns {boolean} True if configured
 */
export function checkSupabaseConfig() {
  return isSupabaseConfigured;
}

/**
 * Get configuration status for debugging
 * @returns {Object} Configuration status
 */
export function getSupabaseStatus() {
  return {
    configured: isSupabaseConfigured,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not set',
  };
}
