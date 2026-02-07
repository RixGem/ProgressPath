'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp, BookOpen, MessageSquare, Flame, Calendar, Plus, GalleryHorizontal, FileText as FileTextIcon } from 'lucide-react'
import ProtectedRoute from '../../components/ProtectedRoute'
import FlashcardNotes from '../../components/FlashcardNotes'
import { useAuth } from '../../contexts/AuthContext'
import { FrenchActivity, FrenchStats } from '../../types/french'
import ActivityForm from '../../components/french/ActivityForm'
import ActivityList from '../../components/french/ActivityList'

export default function FrenchPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<FrenchActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [showFlashcards, setShowFlashcards] = useState(false)

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
  function normalizeVocabulary(vocabulary: string[] | string | null): string[] {
    if (!vocabulary) return []
    if (Array.isArray(vocabulary)) return vocabulary
    if (typeof vocabulary === 'string') {
      if (vocabulary.includes('个新词汇') || vocabulary.includes('个复习词汇')) return []
      return vocabulary.split(',').map(v => v.trim()).filter(v => v.length > 0)
    }
    return []
  }

  /**
   * Helper function to normalize practice sentences
   */
  function normalizeSentences(sentences: string[] | string | null): string[] {
    if (!sentences) return []
    if (Array.isArray(sentences)) return sentences
    if (typeof sentences === 'string') {
      return sentences.split(',').map(s => s.trim()).filter(s => s.length > 0)
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

      // Cast the data to the correct type
      const typedData = (data || []) as FrenchActivity[]
      setActivities(typedData)

      if (typedData.length > 0) {
        calculateStreak(typedData)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStreak(activitiesData: FrenchActivity[]) {
    if (!activitiesData || activitiesData.length === 0) {
      setCurrentStreak(0)
      return
    }

    const sortedActivities = [...activitiesData].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const mostRecentActivity = new Date(sortedActivities[0].date)
    mostRecentActivity.setHours(0, 0, 0, 0)

    const daysDifference = Math.floor((currentDate.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60 * 24))

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

  async function fetchTotalTime() {
    try {
      const { data, error } = await supabase
        .from('french_learning')
        .select('total_time, duration_minutes')
        .eq('user_id', user.id)

      if (error) throw error

      const total = (data || []).reduce((sum: number, record: any) => {
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

  function calculateStats(): FrenchStats {
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

  function getMoodEmoji(mood: string): string {
    switch (mood) {
      case 'good': return '😊'
      case 'neutral': return '😐'
      case 'difficult': return '😓'
      default: return '😐'
    }
  }

  function getMoodColor(mood: string): string {
    switch (mood) {
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
            <Plus className="w-5 h-5" />
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
          <ActivityForm
            userId={user.id}
            onSuccess={() => {
              setShowForm(false)
              fetchActivities()
              fetchTotalTime()
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Activities List */}
        <ActivityList
          activities={activities}
          onReviewCards={() => setShowFlashcards(true)}
          onLogActivity={() => setShowForm(true)}
        />

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
                      className={`h-20 rounded-lg flex items-center justify-center ${hasActivity ? 'bg-purple-500 dark:bg-purple-600 text-white font-semibold' : 'bg-gray-200 dark:bg-gray-700'
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

      {showFlashcards && (
        <FlashcardNotes
          items={activities}
          onClose={() => setShowFlashcards(false)}
          title="French Learning History"
          renderFront={(activity: FrenchActivity) => {
            const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)

            return (
              <div className="flex flex-col h-full items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-4xl text-purple-600 dark:text-purple-400 capitalize">
                    {activity.activity_type ? activity.activity_type.charAt(0) : '?'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                  {activity.activity_type}
                </h3>

                <div className="space-y-2">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {activity.total_time || activity.duration_minutes} min
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Duration</div>
                </div>

                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex gap-4">
                  {normalizedVocabulary.length > 0 && (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-bold">{normalizedVocabulary.length} Words</span>
                    </div>
                  )}

                  {activity.mood && (
                    <div className={`flex items-center space-x-1 ${getMoodColor(activity.mood)}`}>
                      <span className="text-xl">{getMoodEmoji(activity.mood)}</span>
                      <span className="font-bold capitalize">{activity.mood}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          }}
          renderBack={(activity: FrenchActivity) => {
            const normalizedVocabulary = normalizeVocabulary(activity.new_vocabulary)
            const normalizedSentences = normalizeSentences(activity.practice_sentences)

            return (
              <div className="space-y-6 h-full text-left">
                {/* Vocabulary Section */}
                {normalizedVocabulary.length > 0 && (
                  <div>
                    <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      <span>Vocabulary</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {normalizedVocabulary.map((word, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg text-sm border border-green-200 dark:border-green-800">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentences Section */}
                {normalizedSentences.length > 0 && (
                  <div>
                    <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span>Practice Sentences</span>
                    </h4>
                    <ul className="space-y-2">
                      {normalizedSentences.map((sentence, idx) => (
                        <li key={idx} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-700 dark:text-gray-300 italic">{sentence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes Section */}
                {activity.notes && (
                  <div>
                    <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      <FileTextIcon className="w-5 h-5 text-gray-500" />
                      <span>Notes</span>
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {activity.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!normalizedVocabulary.length && !normalizedSentences.length && !activity.notes && (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 italic">
                    No details recorded for this session.
                  </div>
                )}
              </div>
            )
          }}
        />
      )}
    </ProtectedRoute>
  )
}
