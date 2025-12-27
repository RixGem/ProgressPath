'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, TrendingUp, BookOpen, Flame, MessageSquare, Languages } from 'lucide-react'

export default function EmbedPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalTime, setTotalTime] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    verifyTokenAndFetchData()
  }, [])

  /**
   * Verify JWT token via server-side API and fetch user data
   */
  async function verifyTokenAndFetchData() {
    try {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      if (!token) {
        throw new Error('No embed token provided')
      }

      // Verify token using server-side API
      const payload = await verifyTokenServerSide(token)

      // Enhanced defensive checks: verify payload structure and permissions
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid token payload structure')
      }

      if (!payload.permissions || !Array.isArray(payload.permissions)) {
        throw new Error('Invalid or missing permissions in token payload')
      }

      // Check permissions
      if (!payload.permissions.includes('read')) {
        throw new Error('Invalid token permissions')
      }

      // Verify userId exists
      if (!payload.userId) {
        throw new Error('Missing userId in token payload')
      }

      // Set user ID from token
      setUserId(payload.userId)

      // Fetch data with verified user ID
      await Promise.all([
        fetchActivities(payload.userId),
        fetchTotalTime(payload.userId)
      ])
    } catch (err) {
      console.error('Token verification or data fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  /**
   * Verify JWT token on server-side by calling API endpoint
   */
  async function verifyTokenServerSide(token) {
    try {
      const response = await fetch('/api/embed/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Token verification failed')
      }

      const data = await response.json()
      
      // Fix: Return data.user instead of data.payload to match server response structure
      if (!data || !data.user) {
        throw new Error('Invalid response structure from verification endpoint')
      }
      
      return data.user
    } catch (err) {
      console.error('Server-side token verification error:', err)
      throw new Error(`Token verification failed: ${err.message}`)
    }
  }

  /**
   * Helper function to normalize vocabulary data
   */
  function normalizeVocabulary(vocabulary) {
    if (!vocabulary) return []
    if (Array.isArray(vocabulary)) return vocabulary
    
    if (typeof vocabulary === 'string') {
      if (vocabulary.includes('个新词汇') || vocabulary.includes('个复习词汇')) {
        return []
      }
      return vocabulary.split(',').map(v => v.trim()).filter(v => v.length > 0)
    }
    
    return []
  }

  /**
   * Helper function to normalize practice sentences
   */
  function normalizeSentences(sentences) {
    if (!sentences) return []
    if (Array.isArray(sentences)) return sentences
    
    if (typeof sentences === 'string') {
      return sentences.split(',').map(s => s.trim()).filter(s => s.length > 0)
    }
    
    return []
  }

  async function fetchActivities(uid) {
    try {
      const { data, error } = await supabase
        .from('french_learning')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false })
        .limit(10) // Limit for embed view

      if (error) throw error
      setActivities(data || [])

      if (data && data.length > 0) {
        calculateStreak(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  function calculateStreak(activitiesData) {
    if (!activitiesData || activitiesData.length === 0) {
      setCurrentStreak(0)
      return
    }

    const sortedActivities = [...activitiesData].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const mostRecentActivity = new Date(sortedActivities[0].date)
    mostRecentActivity.setHours(0, 0, 0, 0)
    
    const daysDifference = Math.floor((currentDate - mostRecentActivity) / (1000 * 60 * 60 * 24))
    
    if (daysDifference > 1) {
      setCurrentStreak(0)
      return
    }

    let checkDate = new Date(currentDate)
    if (daysDifference === 1) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    const activityDates = new Set(sortedActivities.map(a => a.date))
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (activityDates.has(dateStr)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    setCurrentStreak(streak)
  }

  async function fetchTotalTime(uid) {
    try {
      const { data, error } = await supabase
        .from('french_learning')
        .select('total_time, duration_minutes')
        .eq('user_id', uid)

      if (error) throw error

      const total = data.reduce((sum, record) => {
        const time = record.total_time !== undefined && record.total_time !== null 
          ? record.total_time 
          : record.duration_minutes
        return sum + (time || 0)
      }, 0)

      setTotalTime(total)
    } catch (error) {
      console.error('Error fetching total time:', error)
      throw error
    }
  }

  function calculateStats() {
    const totalHours = (totalTime / 60).toFixed(1)
    
    const totalVocabulary = activities.reduce((sum, a) => {
      const vocab = normalizeVocabulary(a.new_vocabulary)
      return sum + vocab.length
    }, 0)
    
    return { totalHours, totalSessions: activities.length, totalVocabulary, currentStreak }
  }

  function getMoodEmoji(mood) {
    switch(mood) {
      case 'good': return '😊'
      case 'neutral': return '😐'
      case 'difficult': return '😓'
      default: return '😐'
    }
  }

  function getMoodColor(mood) {
    switch(mood) {
      case 'good': return 'text-green-600 dark:text-green-400'
      case 'neutral': return 'text-yellow-600 dark:text-yellow-400'
      case 'difficult': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading French Learning Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please check your embed token and try again.
          </p>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <Languages className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            French Learning Progress
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your journey to fluency
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.totalHours}h
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Total Hours</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.currentStreak}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Day Streak</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalSessions}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Sessions</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.totalVocabulary}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">Words Learned</div>
          </div>
        </div>

        {/* 7-Day Activity Visualization */}
        {activities.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              7-Day Activity
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (6 - i))
                const dateStr = date.toISOString().split('T')[0]
                const dayActivities = activities.filter(a => a.date === dateStr)
                const hasActivity = dayActivities.length > 0
                const totalMinutes = dayActivities.reduce((sum, a) => {
                  const time = a.total_time !== undefined && a.total_time !== null ? a.total_time : a.duration_minutes
                  return sum + (time || 0)
                }, 0)

                return (
                  <div key={i} className="text-center">
                    <div 
                      className={`h-16 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                        hasActivity 
                          ? 'bg-purple-500 dark:bg-purple-600 text-white shadow-sm' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}
                      title={hasActivity ? `${totalMinutes} minutes` : 'No activity'}
                    >
                      {hasActivity && <span>{totalMinutes}m</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                    </div>
                  </div>
                )
              })}
            </div>
            {stats.currentStreak > 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  🔥 <span className="font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak}-day streak</span> - Keep it up!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Recent Activities
          </h2>

          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Languages className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No activities logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => {
                const displayDuration = activity.total_time !== undefined && activity.total_time !== null
                  ? activity.total_time
                  : activity.duration_minutes

                const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)
                const normalizedSentences = normalizeSentences(activity.practice_sentences)

                return (
                  <div 
                    key={activity.id} 
                    className="border-l-4 border-purple-500 dark:border-purple-400 pl-3 py-2 bg-white dark:bg-gray-700/50 rounded-r"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white capitalize">
                          {activity.activity_type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {displayDuration} min
                        </span>
                        {activity.mood && (
                          <span className={`text-sm ${getMoodColor(activity.mood)}`}>
                            {getMoodEmoji(activity.mood)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Vocabulary */}
                    {normalizedVocabulary.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            +{normalizedVocabulary.length} words
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {normalizedVocabulary.slice(0, 5).map((word, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full"
                            >
                              {word}
                            </span>
                          ))}
                          {normalizedVocabulary.length > 5 && (
                            <span className="px-2 py-0.5 text-gray-600 dark:text-gray-400 text-xs">
                              +{normalizedVocabulary.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Practice Sentences */}
                    {normalizedSentences.length > 0 && (
                      <div className="mb-1">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {normalizedSentences.length} sentence{normalizedSentences.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {activity.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2 mt-1">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-2 pb-1">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Powered by ProgressPath • Read-only View
          </p>
        </div>
      </div>
    </div>
  )
}
