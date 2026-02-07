import React from 'react'
import { Languages, Calendar, GalleryHorizontal, BookOpen, MessageSquare } from 'lucide-react'
import { FrenchActivity } from '../../types/french'

interface ActivityListProps {
  activities: FrenchActivity[]
  onReviewCards: () => void
  onLogActivity: () => void
}

export default function ActivityList({ activities, onReviewCards, onLogActivity }: ActivityListProps) {
  /**
   * Helper function to normalize vocabulary data
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

  return (
    <div className="card p-6 dark:border dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
          <Calendar className="w-5 h-5" />
          <span>Recent Activities</span>
        </h2>
        {activities.length > 0 && (
          <button
            onClick={onReviewCards}
            className="btn-secondary flex items-center space-x-2"
          >
            <GalleryHorizontal className="w-4 h-4" />
            <span>Review Cards</span>
          </button>
        )}
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Languages className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No activities yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Start logging your French learning activities</p>
          <button onClick={onLogActivity} className="btn-primary">
            Log Your First Activity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const displayDuration = activity.total_time !== undefined && activity.total_time !== null
              ? activity.total_time
              : activity.duration_minutes

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
  )
}
