'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Languages, Plus, Calendar, TrendingUp, X, BookOpen, MessageSquare, Smile, Flame } from 'lucide-react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'

export default function FrenchPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [formData, setFormData] = useState({
    activity_type: 'vocabulary',
    duration_minutes: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    new_vocabulary: '',
    practice_sentences: '',
    mood: 'neutral'
  })

  useEffect(() => {
    if (user) {
      fetchActivities()
      fetchTotalTime()
    }
  }, [user])

  /**
   * Helper function to normalize vocabulary data
   * Handles both array and string formats
   */
  function normalizeVocabulary(vocabulary) {
    if (!vocabulary) return []
    
    // If already an array, return it
    if (Array.isArray(vocabulary)) {
      return vocabulary
    }
    
    // If it's a string, try to parse it
    if (typeof vocabulary === 'string') {
      // Check if it's in Chinese summary format (e.g., "8个新词汇，15个复习词汇")
      if (vocabulary.includes('个新词汇') || vocabulary.includes('个复习词汇')) {
        // This is a summary format without actual vocabulary
        // Return empty array as we don't have the actual words
        return []
      }
      
      // Otherwise, split by comma and clean up
      return vocabulary
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
    }
    
    return []
  }

  /**
   * Helper function to normalize practice sentences
   * Handles both array and string formats
   */
  function normalizeSentences(sentences) {
    if (!sentences) return []
    
    // If already an array, return it
    if (Array.isArray(sentences)) {
      return sentences
    }
    
    // If it's a string, split by comma
    if (typeof sentences === 'string') {
      return sentences
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }
    
    return []
  }

  async function fetchActivities() {
    try {
      const { data, error } = await supabase
        .from('french_learning')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30)
      
      if (error) throw error
      setActivities(data || [])
      
      if (data && data.length > 0) {
        calculateStreak(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
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

    // Check if the most recent activity was today or yesterday to keep streak alive
    const mostRecentActivity = new Date(sortedActivities[0].date)
    mostRecentActivity.setHours(0, 0, 0, 0)
    
    const daysDifference = Math.floor((currentDate - mostRecentActivity) / (1000 * 60 * 60 * 24))
    
    // Streak is broken if more than 1 day has passed since last activity
    if (daysDifference > 1) {
      setCurrentStreak(0)
      return
    }

    // Start checking from the most recent activity date
    // This ensures we count the first day correctly
    let checkDate = new Date(mostRecentActivity)

    const activityDates = new Set(sortedActivities.map(a => a.date))
    
    // Count consecutive days backward from the most recent activity
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

  async function fetchTotalTime() {
    try {
      const { data, error } = await supabase
        .from('french_learning')
        .select('total_time, duration_minutes')
        .eq('user_id', user.id)
      
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
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const durationMinutes = parseInt(formData.duration_minutes)
      
      const vocabularyArray = formData.new_vocabulary
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
      
      const sentencesArray = formData.practice_sentences
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      const insertData = {
        activity_type: formData.activity_type,
        duration_minutes: durationMinutes,
        total_time: durationMinutes,
        notes: formData.notes,
        date: formData.date,
        new_vocabulary: vocabularyArray.length > 0 ? vocabularyArray : null,
        practice_sentences: sentencesArray.length > 0 ? sentencesArray : null,
        mood: formData.mood,
        user_id: user.id
      }
      
      const { error } = await supabase
        .from('french_learning')
        .insert([insertData])
        
      if (error) throw error
      
      resetForm()
      fetchActivities()
      fetchTotalTime()
    } catch (error) {
      console.error('Error saving activity:', error)
      alert('Error saving activity: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      activity_type: 'vocabulary',
      duration_minutes: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      new_vocabulary: '',
      practice_sentences: '',
      mood: 'neutral'
    })
    setShowForm(false)
  }

  function calculateStats() {
    const totalHours = (totalTime / 60).toFixed(1)
    
    const thisWeek = activities.filter(a => {
      const activityDate = new Date(a.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return activityDate >= weekAgo
    }).length
    
    const totalVocabulary = activities.reduce((sum, a) => {
      const vocab = normalizeVocabulary(a.new_vocabulary)
      return sum + vocab.length
    }, 0)
    
    return { totalHours, totalSessions: activities.length, thisWeek, totalVocabulary, currentStreak }
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

  const stats = calculateStats()

  if (loading) {
    return <div className="text-center py-12 text-gray-900 dark:text-gray-100">Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">French Learning</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Track your daily learning activities and progress</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center space-x-2"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{showForm ? 'Cancel' : 'Log Activity'}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-6 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalHours}h</div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400 dark:text-purple-300" />
            </div>
          </div>
          
          <div className="card p-6 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak} days</div>
              </div>
              <Flame className="w-8 h-8 text-orange-400 dark:text-orange-300" />
            </div>
          </div>
          
          <div className="card p-6 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.totalSessions}</div>
              </div>
              <Calendar className="w-8 h-8 text-primary-400 dark:text-primary-300" />
            </div>
          </div>
          
          <div className="card p-6 dark:border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Vocabulary Words</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalVocabulary}</div>
              </div>
              <BookOpen className="w-8 h-8 text-green-400 dark:text-green-300" />
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card p-6 dark:border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Log Learning Activity</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Activity Type *</label>
                  <select
                    className="input-field"
                    value={formData.activity_type}
                    onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                    required
                  >
                    <option value="vocabulary">Vocabulary</option>
                    <option value="grammar">Grammar</option>
                    <option value="reading">Reading</option>
                    <option value="listening">Listening</option>
                    <option value="speaking">Speaking</option>
                    <option value="writing">Writing</option>
                    <option value="exercise">Exercise</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Duration (minutes) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="label">How did it go? *</label>
                  <select
                    className="input-field"
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    required
                  >
                    <option value="good">😊 Good - Felt confident</option>
                    <option value="neutral">😐 Neutral - Okay progress</option>
                    <option value="difficult">😓 Difficult - Challenging</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="label">New Vocabulary</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter words separated by commas (e.g., bonjour, merci, au revoir)"
                  value={formData.new_vocabulary}
                  onChange={(e) => setFormData({ ...formData, new_vocabulary: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple words with commas</p>
              </div>
              
              <div>
                <label className="label">Practice Sentences</label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="Enter sentences separated by commas"
                  value={formData.practice_sentences}
                  onChange={(e) => setFormData({ ...formData, practice_sentences: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate multiple sentences with commas</p>
              </div>
              
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input-field"
                  rows="3"
                  placeholder="What did you learn or practice today?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary">Log Activity</button>
                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Activities List */}
        <div className="card p-6 dark:border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
            <Calendar className="w-5 h-5" />
            <span>Recent Activities</span>
          </h2>
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Languages className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No activities yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Start logging your French learning activities</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Log Your First Activity
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const displayDuration = activity.total_time !== undefined && activity.total_time !== null
                  ? activity.total_time
                  : activity.duration_minutes
                
                // Normalize vocabulary and sentences to handle both string and array formats
                const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)
                const normalizedSentences = normalizeSentences(activity.practice_sentences)
                
                return (
                  <div key={activity.id} className="border-l-4 border-purple-500 dark:border-purple-400 pl-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white capitalize">
                            {activity.activity_type}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {displayDuration} min
                          </span>
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            {new Date(activity.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                          {activity.mood && (
                            <span className={`text-lg ${getMoodColor(activity.mood)}`} title={activity.mood}>
                              {getMoodEmoji(activity.mood)}
                            </span>
                          )}
                        </div>
                        
                        {/* Display vocabulary if available */}
                        {normalizedVocabulary.length > 0 && (
                          <div className="mb-2">
                            <div className="flex items-center space-x-2 mb-1">
                              <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Vocabulary ({normalizedVocabulary.length}):</span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {normalizedVocabulary.map((word, idx) => (
                                <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Show a notice if vocabulary data is in old format */}
                        {!normalizedVocabulary.length && activity.new_vocabulary && 
                         typeof activity.new_vocabulary === 'string' && 
                         (activity.new_vocabulary.includes('个新词汇') || activity.new_vocabulary.includes('个复习词汇')) && (
                          <div className="mb-2">
                            <div className="flex items-center space-x-2 mb-1">
                              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Vocabulary Summary:</span>
                            </div>
                            <div className="ml-6 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                              {activity.new_vocabulary}
                              <span className="block text-xs mt-1 text-amber-500 dark:text-amber-400">
                                ℹ️ Legacy data format - specific words not recorded
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Display practice sentences if available */}
                        {normalizedSentences.length > 0 && (
                          <div className="mb-2">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Practice Sentences:</span>
                            </div>
                            <ul className="ml-6 space-y-1">
                              {normalizedSentences.map((sentence, idx) => (
                                <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 italic">• {sentence}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {activity.notes && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Learning Streak Visualization */}
        {activities.length > 0 && (
          <div className="card p-6 dark:border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>7-Day Activity</span>
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
                      className={`h-20 rounded-lg flex items-center justify-center ${
                        hasActivity ? 'bg-purple-500 dark:bg-purple-600 text-white font-semibold' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      title={hasActivity ? `${totalMinutes} minutes` : 'No activity'}
                    >
                      {hasActivity && <span className="text-sm">{totalMinutes}m</span>}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
            {stats.currentStreak > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Keep it up! You're on a <span className="font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak}-day streak</span> 🔥
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
