'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import ProtectedRoute from '../../../components/ProtectedRoute'
import FlashcardNotes from '../../../components/FlashcardNotes'
import { useAuth } from '../../../contexts/AuthContext'
import { BookOpen, Calendar, MessageSquare, FileText as FileTextIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FrenchReviewPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchActivities()
    }
  }, [user])

  function normalizeVocabulary(vocabulary) {
    if (!vocabulary) return []
    if (Array.isArray(vocabulary)) return vocabulary
    if (typeof vocabulary === 'string') {
      if (vocabulary.includes('个新词汇') || vocabulary.includes('个复习词汇')) return []
      return vocabulary.split(',').map(v => v.trim()).filter(v => v.length > 0)
    }
    return []
  }

  function normalizeSentences(sentences) {
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
        .limit(50) // Fetch more for review

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  function getMoodEmoji(mood) {
    switch (mood) {
      case 'good': return '😊'
      case 'neutral': return '😐'
      case 'difficult': return '😓'
      default: return '😐'
    }
  }

  function getMoodColor(mood) {
    switch (mood) {
      case 'good': return 'text-green-600 dark:text-green-400'
      case 'neutral': return 'text-yellow-600 dark:text-yellow-400'
      case 'difficult': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-900 dark:text-gray-100">Loading reviews...</div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-40 flex flex-col">
        <div className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/french"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">French Review</h1>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <FlashcardNotes
            items={activities}
            onClose={() => {}} // No close button needed as we have the header back button
            title="French Learning History"
            renderFront={(activity) => {
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
            renderBack={(activity) => {
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
        </div>
      </div>
    </ProtectedRoute>
  )
}
