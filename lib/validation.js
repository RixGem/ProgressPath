/**
 * Validation utilities for user data operations
 * Ensures all database operations include proper user associations
 */

/**
 * Validates that user object exists and has required properties
 * @param {Object} user - User object from authentication context
 * @returns {boolean} - True if valid, throws error if invalid
 */
export function validateUser(user) {
  if (!user) {
    throw new Error('Authentication required: User must be logged in')
  }
  
  if (!user.id) {
    throw new Error('Invalid user object: Missing user ID')
  }
  
  return true
}

/**
 * Validates that data object includes user_id before database operation
 * @param {Object} data - Data object to be inserted/updated in database
 * @param {string} userId - User ID from authentication context
 * @returns {Object} - Validated data object with user_id
 */
export function validateDataWithUserId(data, userId) {
  if (!userId) {
    throw new Error('User ID is required for database operations')
  }
  
  if (!data) {
    throw new Error('Data object is required')
  }
  
  // Ensure user_id is set
  const validatedData = {
    ...data,
    user_id: userId
  }
  
  return validatedData
}

/**
 * Validates book data before saving
 * @param {Object} bookData - Book data to validate
 * @param {string} userId - User ID from authentication context
 * @returns {Object} - Validated and sanitized book data
 */
export function validateBookData(bookData, userId) {
  validateUser({ id: userId })
  
  if (!bookData.title || !bookData.title.trim()) {
    throw new Error('Book title is required')
  }
  
  if (!bookData.author || !bookData.author.trim()) {
    throw new Error('Book author is required')
  }
  
  if (bookData.progress === undefined || bookData.progress === null) {
    throw new Error('Book progress is required')
  }
  
  const progress = parseFloat(bookData.progress)
  if (isNaN(progress) || progress < 0 || progress > 100) {
    throw new Error('Book progress must be between 0 and 100')
  }
  
  if (!bookData.status || !['planned', 'reading', 'completed'].includes(bookData.status)) {
    throw new Error('Invalid book status')
  }
  
  // Return validated data with user_id
  return {
    title: bookData.title.trim(),
    author: bookData.author.trim(),
    progress: progress,
    status: bookData.status,
    genre: bookData.genre?.trim() || null,
    rating: bookData.rating ? parseInt(bookData.rating) : null,
    language_analysis: bookData.language_analysis?.trim() || null,
    notes: bookData.notes?.trim() || null,
    date_started: bookData.date_started || null,
    date_finished: bookData.date_finished || null,
    user_id: userId
  }
}

/**
 * Validates French learning activity data before saving
 * @param {Object} activityData - Activity data to validate
 * @param {string} userId - User ID from authentication context
 * @returns {Object} - Validated and sanitized activity data
 */
export function validateFrenchLearningData(activityData, userId) {
  validateUser({ id: userId })
  
  if (!activityData.activity_type) {
    throw new Error('Activity type is required')
  }
  
  const validActivityTypes = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing', 'exercise']
  if (!validActivityTypes.includes(activityData.activity_type)) {
    throw new Error('Invalid activity type')
  }
  
  if (!activityData.duration_minutes) {
    throw new Error('Duration is required')
  }
  
  const duration = parseInt(activityData.duration_minutes)
  if (isNaN(duration) || duration < 1) {
    throw new Error('Duration must be at least 1 minute')
  }
  
  if (!activityData.date) {
    throw new Error('Date is required')
  }
  
  // Validate mood if provided
  if (activityData.mood && !['good', 'neutral', 'difficult'].includes(activityData.mood)) {
    throw new Error('Invalid mood value')
  }
  
  // Process vocabulary array
  let vocabularyArray = null
  if (activityData.new_vocabulary) {
    if (typeof activityData.new_vocabulary === 'string') {
      vocabularyArray = activityData.new_vocabulary
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
    } else if (Array.isArray(activityData.new_vocabulary)) {
      vocabularyArray = activityData.new_vocabulary.filter(v => v && v.trim())
    }
    vocabularyArray = vocabularyArray && vocabularyArray.length > 0 ? vocabularyArray : null
  }
  
  // Process sentences array
  let sentencesArray = null
  if (activityData.practice_sentences) {
    if (typeof activityData.practice_sentences === 'string') {
      sentencesArray = activityData.practice_sentences
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    } else if (Array.isArray(activityData.practice_sentences)) {
      sentencesArray = activityData.practice_sentences.filter(s => s && s.trim())
    }
    sentencesArray = sentencesArray && sentencesArray.length > 0 ? sentencesArray : null
  }
  
  // Return validated data with user_id
  return {
    activity_type: activityData.activity_type,
    duration_minutes: duration,
    total_time: duration, // Keep both fields in sync
    notes: activityData.notes?.trim() || null,
    date: activityData.date,
    new_vocabulary: vocabularyArray,
    practice_sentences: sentencesArray,
    mood: activityData.mood || 'neutral',
    user_id: userId
  }
}

/**
 * Creates a safe database query filter with user_id
 * @param {string} userId - User ID from authentication context
 * @returns {Object} - Query filter object
 */
export function createUserFilter(userId) {
  validateUser({ id: userId })
  return { user_id: userId }
}

/**
 * Validates that a query result belongs to the authenticated user
 * @param {Object|Array} result - Query result from database
 * @param {string} userId - User ID from authentication context
 * @returns {boolean} - True if valid
 */
export function validateQueryResult(result, userId) {
  if (!result) return true // Empty result is valid
  
  validateUser({ id: userId })
  
  const results = Array.isArray(result) ? result : [result]
  
  for (const item of results) {
    if (item.user_id && item.user_id !== userId) {
      throw new Error('Security violation: Attempted to access data belonging to another user')
    }
  }
  
  return true
}

/**
 * Safe wrapper for Supabase insert operations
 * @param {Object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @param {string} userId - User ID from authentication context
 * @returns {Promise} - Supabase query promise
 */
export async function safeInsert(supabase, table, data, userId) {
  const validatedData = validateDataWithUserId(data, userId)
  return supabase.from(table).insert([validatedData])
}

/**
 * Safe wrapper for Supabase update operations
 * @param {Object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {string|number} id - Record ID
 * @param {string} userId - User ID from authentication context
 * @returns {Promise} - Supabase query promise
 */
export async function safeUpdate(supabase, table, data, id, userId) {
  const validatedData = validateDataWithUserId(data, userId)
  return supabase
    .from(table)
    .update(validatedData)
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns the record
}

/**
 * Safe wrapper for Supabase delete operations
 * @param {Object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {string|number} id - Record ID
 * @param {string} userId - User ID from authentication context
 * @returns {Promise} - Supabase query promise
 */
export async function safeDelete(supabase, table, id, userId) {
  validateUser({ id: userId })
  return supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns the record
}

/**
 * Safe wrapper for Supabase select operations
 * @param {Object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {string} userId - User ID from authentication context
 * @param {string} columns - Columns to select (default: '*')
 * @returns {Promise} - Supabase query promise
 */
export async function safeSelect(supabase, table, userId, columns = '*') {
  validateUser({ id: userId })
  return supabase
    .from(table)
    .select(columns)
    .eq('user_id', userId)
}
