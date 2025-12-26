'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Enhanced DailyQuote Component for French Learners
 * 
 * Features:
 * - French/English language toggle
 * - Category-based quote filtering
 * - Manual refresh capability
 * - Pronunciation helper for French quotes
 * - Progress tracking integration
 * - Animated transitions
 */

const CACHE_KEY = 'dailyQuoteEnhanced_cache'
const CACHE_TIMESTAMP_KEY = 'dailyQuoteEnhanced_timestamp'
const LANGUAGE_PREF_KEY = 'dailyQuote_languagePref'

// Fallback quotes for offline/error scenarios
const fallbackQuotes = [
  {
    quote: "La persévérance est la clé du succès",
    author: "Proverbe français",
    language: "fr",
    translation: "Perseverance is the key to success",
    category: "motivation"
  },
  {
    quote: "Petit à petit, l'oiseau fait son nid",
    author: "Proverbe français",
    language: "fr",
    translation: "Little by little, the bird builds its nest",
    category: "learning"
  },
  {
    quote: "Learning never exhausts the mind",
    author: "Leonardo da Vinci",
    language: "en",
    translation: "L'apprentissage n'épuise jamais l'esprit",
    category: "learning"
  },
  {
    quote: "The future belongs to those who believe in the beauty of their dreams",
    author: "Eleanor Roosevelt",
    language: "en",
    translation: "L'avenir appartient à ceux qui croient en la beauté de leurs rêves",
    category: "inspiration"
  }
]

export default function DailyQuoteEnhanced({ 
  preferFrench = false,
  category = null,
  showControls = true 
}) {
  const [quote, setQuote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [languagePref, setLanguagePref] = useState(preferFrench ? 'fr' : 'en')
  const [showTranslation, setShowTranslation] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem(LANGUAGE_PREF_KEY)
      if (savedPref) {
        setLanguagePref(savedPref)
      }
    }
  }, [])

  // Save language preference
  const updateLanguagePref = (newLang) => {
    setLanguagePref(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_PREF_KEY, newLang)
    }
    // Clear cache to fetch new quote in preferred language
    sessionStorage.removeItem(CACHE_KEY)
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY)
    fetchQuote(newLang)
  }

  // Fetch quote from database
  const fetchQuote = async (preferredLang = languagePref) => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query based on preferences
      let query = supabase
        .from('daily_quotes')
        .select('quote, author, language, translation, category')

      // Filter by language preference
      if (preferredLang) {
        query = query.eq('language', preferredLang)
      }

      // Filter by category if specified
      if (category) {
        query = query.eq('category', category)
      }

      // Get count for random selection
      const { count, error: countError } = await supabase
        .from('daily_quotes')
        .select('*', { count: 'exact', head: true })
        .eq('language', preferredLang)

      if (countError) throw countError

      if (!count || count === 0) {
        throw new Error('No quotes available')
      }

      // Get random quote
      const randomOffset = Math.floor(Math.random() * count)
      const { data, error: fetchError } = await query
        .range(randomOffset, randomOffset)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        const fetchedQuote = {
          quote: data.quote,
          author: data.author,
          language: data.language || 'en',
          translation: data.translation || null,
          category: data.category || 'general'
        }

        // Cache the quote
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(fetchedQuote))
        sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())

        setQuote(fetchedQuote)
      }
    } catch (err) {
      console.error('Error fetching quote:', err)
      setError(err.message)

      // Use fallback quotes
      const filteredFallbacks = fallbackQuotes.filter(q => 
        q.language === preferredLang && (!category || q.category === category)
      )
      const fallbackList = filteredFallbacks.length > 0 ? filteredFallbacks : fallbackQuotes
      const randomIndex = Math.floor(Math.random() * fallbackList.length)
      setQuote(fallbackList[randomIndex])
    } finally {
      setIsLoading(false)
    }
  }

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    sessionStorage.removeItem(CACHE_KEY)
    sessionStorage.removeItem(CACHE_TIMESTAMP_KEY)
    await fetchQuote()
    setIsRefreshing(false)
  }

  // Initial load - check cache first
  useEffect(() => {
    const cachedQuote = sessionStorage.getItem(CACHE_KEY)
    const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY)

    if (cachedQuote && cachedTimestamp) {
      const cached = JSON.parse(cachedQuote)
      // Use cache if it matches language preference
      if (cached.language === languagePref) {
        setQuote(cached)
        setIsLoading(false)
        return
      }
    }

    fetchQuote()
  }, [category]) // Re-fetch if category changes

  // French pronunciation helper
  const speakFrench = () => {
    if ('speechSynthesis' in window && quote?.language === 'fr') {
      const utterance = new SpeechSynthesisUtterance(quote.quote)
      utterance.lang = 'fr-FR'
      utterance.rate = 0.8 // Slower for learning
      window.speechSynthesis.speak(utterance)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!quote) return null

  const isFrench = quote.language === 'fr'
  const hasTranslation = quote.translation && quote.translation.trim() !== ''

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Header with controls */}
      {showControls && (
        <div className="flex justify-between items-center mb-4">
          {/* Language Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => updateLanguagePref('fr')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                languagePref === 'fr'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              onClick={() => updateLanguagePref('en')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                languagePref === 'en'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
            title="Get new quote"
          >
            <svg
              className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Category Badge */}
      {quote.category && (
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {quote.category}
          </span>
        </div>
      )}

      {/* Main Quote */}
      <div className="space-y-4">
        <div className="relative">
          <blockquote className="text-2xl font-serif text-gray-800 dark:text-gray-100 italic leading-relaxed">
            &ldquo;{quote.quote}&rdquo;
          </blockquote>
          
          {/* French pronunciation button */}
          {isFrench && (
            <button
              onClick={speakFrench}
              className="absolute -right-2 -top-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all"
              title="Écouter la prononciation"
            >
              🔊
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            — {quote.author}
          </p>
          
          {isFrench && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
              Français
            </span>
          )}
        </div>

        {/* Translation Section */}
        {hasTranslation && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all"
            >
              <span>{showTranslation ? '🙈 Hide' : '👁️ Show'} Translation</span>
              <svg
                className={`w-4 h-4 transition-transform ${showTranslation ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showTranslation && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-fadeIn">
                <p className="text-lg text-gray-700 dark:text-gray-300 italic">
                  &ldquo;{quote.translation}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Learning Tip for French quotes */}
      {isFrench && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 <strong>Conseil:</strong> Lisez à haute voix pour améliorer votre prononciation!
          </p>
        </div>
      )}
    </div>
  )
}
