/**
 * User Synchronization Utilities
 * Provides helper functions for syncing user data across the application
 * 
 * ============================================================================
 * SECURITY FIX #3: Input Validation for Database Operations
 * ============================================================================
 * Added comprehensive input validation for all database operations
 * - Validates user IDs (UUID format)
 * - Sanitizes and validates all input data
 * - Prevents SQL injection and data corruption
 * - Type checking for all parameters
 */

import { supabase } from './supabase'

// ============================================================================
// INPUT VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate UUID format (Supabase user IDs)
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(userId) {
  if (typeof userId !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Sanitize string input - remove potentially dangerous characters
 * @param {string} input - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  
  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .substring(0, maxLength);
}

/**
 * Validate and sanitize user profile data
 * @param {Object} data - User profile data to validate
 * @returns {Object} Validated and sanitized data
 * @throws {Error} If validation fails
 */
function validateUserProfileData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('User profile data must be an object');
  }

  const validated = {};

  // Validate email if present
  if (data.email !== undefined) {
    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    validated.email = sanitizeString(data.email, 255);
  }

  // Validate name fields if present
  if (data.name !== undefined) {
    validated.name = sanitizeString(data.name, 100);
  }

  if (data.display_name !== undefined) {
    validated.display_name = sanitizeString(data.display_name, 100);
  }

  // Validate numeric fields
  if (data.total_books !== undefined) {
    const num = parseInt(data.total_books, 10);
    if (isNaN(num) || num < 0 || num > 100000) {
      throw new Error('Invalid total_books value');
    }
    validated.total_books = num;
  }

  if (data.completed_books !== undefined) {
    const num = parseInt(data.completed_books, 10);
    if (isNaN(num) || num < 0 || num > 100000) {
      throw new Error('Invalid completed_books value');
    }
    validated.completed_books = num;
  }

  // Validate boolean fields
  if (data.is_active !== undefined) {
    validated.is_active = Boolean(data.is_active);
  }

  // Validate metadata (if present, must be valid object)
  if (data.metadata !== undefined) {
    if (typeof data.metadata !== 'object' || data.metadata === null) {
      throw new Error('Metadata must be an object');
    }
    validated.metadata = data.metadata;
  }

  return validated;
}

/**
 * Validate array of user IDs
 * @param {Array} userIds - Array of user IDs to validate
 * @returns {Array} Validated user IDs
 * @throws {Error} If validation fails
 */
function validateUserIds(userIds) {
  if (!Array.isArray(userIds)) {
    throw new Error('User IDs must be an array');
  }

  if (userIds.length === 0) {
    throw new Error('User IDs array cannot be empty');
  }

  if (userIds.length > 1000) {
    throw new Error('Too many user IDs (max 1000)');
  }

  const validated = userIds.filter(id => isValidUUID(id));
  
  if (validated.length !== userIds.length) {
    throw new Error('Invalid UUID format in user IDs array');
  }

  return validated;
}

// ============================================================================
// DATABASE OPERATIONS WITH VALIDATION
// ============================================================================

/**
 * Sync user data with retry logic
 * @param {string} userId - User ID to sync
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object|null>} User data or null
 */
export async function syncUserData(userId, maxRetries = 3) {
  // SECURITY: Validate user ID
  if (!isValidUUID(userId)) {
    console.error('[SECURITY] Invalid user ID format:', userId);
    throw new Error('Invalid user ID format');
  }

  // Validate maxRetries
  if (typeof maxRetries !== 'number' || maxRetries < 1 || maxRetries > 10) {
    maxRetries = 3; // Safe default
  }

  let lastError = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId) // Using .eq() with validated UUID is safe
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return data
    } catch (err) {
      lastError = err
      console.warn(`Sync attempt ${attempt + 1} failed:`, err.message)
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }
  }
  
  console.error('All sync attempts failed:', lastError)
  return null
}

/**
 * Initialize user profile if it doesn't exist
 * @param {string} userId - User ID
 * @param {Object} initialData - Initial profile data
 * @returns {Promise<Object|null>} Created profile or null
 */
export async function initializeUserProfile(userId, initialData = {}) {
  // SECURITY: Validate user ID
  if (!isValidUUID(userId)) {
    console.error('[SECURITY] Invalid user ID format:', userId);
    throw new Error('Invalid user ID format');
  }

  // SECURITY: Validate and sanitize initial data
  let validatedData;
  try {
    validatedData = validateUserProfileData(initialData);
  } catch (err) {
    console.error('[SECURITY] Invalid initial data:', err.message);
    throw err;
  }

  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (existing) {
      return existing
    }
    
    // Create new profile with validated data
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }
    
    return data
  } catch (err) {
    console.error('Error initializing user profile:', err)
    return null
  }
}

/**
 * Update user profile with optimistic updates
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object|null>} Updated profile or null
 */
export async function updateUserProfile(userId, updates) {
  // SECURITY: Validate user ID
  if (!isValidUUID(userId)) {
    console.error('[SECURITY] Invalid user ID format:', userId);
    throw new Error('Invalid user ID format');
  }

  // SECURITY: Validate and sanitize updates
  let validatedUpdates;
  try {
    validatedUpdates = validateUserProfileData(updates);
  } catch (err) {
    console.error('[SECURITY] Invalid update data:', err.message);
    throw err;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return data
  } catch (err) {
    console.error('Error updating user profile:', err)
    return null
  }
}

/**
 * Verify user session is valid and refresh if needed
 * @returns {Promise<Object|null>} Session data or null
 */
export async function verifyAndRefreshSession() {
  try {
    // Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw sessionError
    }
    
    // If no session, return null
    if (!session) {
      return null
    }
    
    // Check if session is expiring soon (within 5 minutes)
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = expiresAt - now
    
    if (timeUntilExpiry < 300) {
      // Refresh session
      const { data: { session: newSession }, error: refreshError } = 
        await supabase.auth.refreshSession()
      
      if (refreshError) {
        throw refreshError
      }
      
      return newSession
    }
    
    return session
  } catch (err) {
    console.error('Error verifying session:', err)
    return null
  }
}

/**
 * Get user data with fallback to auth session
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export async function getUserData(userId) {
  // SECURITY: Validate user ID
  if (!isValidUUID(userId)) {
    console.error('[SECURITY] Invalid user ID format:', userId);
    throw new Error('Invalid user ID format');
  }

  try {
    // First try to get from user_profiles
    const profileData = await syncUserData(userId)
    
    if (profileData) {
      return profileData
    }
    
    // Fallback to auth session
    const session = await verifyAndRefreshSession()
    
    if (session?.user?.id === userId) {
      return {
        id: session.user.id,
        email: session.user.email,
        ...session.user.user_metadata
      }
    }
    
    return null
  } catch (err) {
    console.error('Error getting user data:', err)
    return null
  }
}

/**
 * Batch sync multiple user records
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Array<Object>>} Array of user data
 */
export async function batchSyncUsers(userIds) {
  // SECURITY: Validate user IDs array
  let validatedIds;
  try {
    validatedIds = validateUserIds(userIds);
  } catch (err) {
    console.error('[SECURITY] Invalid user IDs:', err.message);
    throw err;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', validatedIds) // Using .in() with validated UUIDs is safe
    
    if (error) throw error
    
    return data || []
  } catch (err) {
    console.error('Error batch syncing users:', err)
    return []
  }
}

/**
 * Clear local user cache (useful for debugging)
 */
export function clearUserCache() {
  if (typeof window !== 'undefined') {
    // Clear any cached user data
    localStorage.removeItem('user-cache')
    sessionStorage.removeItem('user-cache')
  }
}

/**
 * Subscribe to user profile changes
 * @param {string} userId - User ID to watch
 * @param {Function} callback - Callback function when profile changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserProfile(userId, callback) {
  // SECURITY: Validate user ID
  if (!isValidUUID(userId)) {
    console.error('[SECURITY] Invalid user ID format:', userId);
    throw new Error('Invalid user ID format');
  }

  // SECURITY: Validate callback
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  const subscription = supabase
    .channel(`user-profile-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}` // Using validated UUID in filter
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}
