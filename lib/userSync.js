/**
 * User Synchronization Utilities
 * Provides helper functions for syncing user data across the application
 */

import { supabase } from './supabase'

/**
 * Sync user data with retry logic
 * @param {string} userId - User ID to sync
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object|null>} User data or null
 */
export async function syncUserData(userId, maxRetries = 3) {
  let lastError = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
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
    
    // Create new profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        ...initialData,
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
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
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
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds)
    
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
  const subscription = supabase
    .channel(`user-profile-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`
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
