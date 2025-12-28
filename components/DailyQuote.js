'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Fallback quotes in case Supabase query fails
const fallbackQuotes = [
  // Personal Growth (7 quotes)
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    language: "en",
    translation: null
  },
  // ... (keep fallback quotes as is)
]

export default function DailyQuote() {
  const [quote, setQuote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        // Fetch random quote from Supabase daily_quotes table
        setIsLoading(true)
        setError(null)
        
        // Get total count of quotes
        const { count, error: countError } = await supabase
          .from('daily_quotes')
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          throw new Error(`Failed to get quote count: ${countError.message}`)
        }
        
        if (!count || count === 0) {
          throw new Error('No quotes available in database')
        }
        
        // Generate random offset
        const randomOffset = Math.floor(Math.random() * count)
        
        // Fetch a random quote using offset with all fields
        const { data, error: fetchError } = await supabase
          .from('daily_quotes')
          .select('quote, author, language, translation')
          .range(randomOffset, randomOffset)
          .single()
        
        if (fetchError) {
          throw new Error(`Failed to fetch quote: ${fetchError.message}`)
        }
        
        if (data) {
          const supabaseQuote = {
            quote: data.quote,
            author: data.author,
            language: data.language || 'en',
            translation: data.translation || null
          }
          
          setQuote(supabaseQuote)
          setIsLoading(false)
        } else {
          throw new Error('Invalid database response')
        }
      } catch (err) {
        console.error('Error fetching quote from Supabase:', err)
        setError(err.message)
        
        // Fall back to local quotes
        const now = new Date()
        const start = new Date(now.getFullYear(), 0, 0)
        const diff = now - start
        const oneDay = 1000 * 60 * 60 * 24
        const dayOfYear = Math.floor(diff / oneDay)
        
        // Select fallback quote based on day of year
        const quoteIndex = dayOfYear % fallbackQuotes.length
        const fallbackQuote = fallbackQuotes[quoteIndex]
        
        setQuote(fallbackQuote)
        setIsLoading(false)
      }
    }

    fetchQuote()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="text-center">
        <p className="text-xl text-gray-400 dark:text-gray-500 max-w-2xl mx-auto italic animate-pulse">
          Loading inspiration...
        </p>
      </div>
    )
  }

  // Error state with fallback quote
  if (error && !quote) {
    return (
      <div className="text-center">
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto italic">
          &ldquo;Stay curious and keep learning.&rdquo;
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          —— ProgressPath
        </p>
      </div>
    )
  }

  // Normal state with quote
  if (!quote) return null

  return (
    <div className="text-center">
      <div className="max-w-2xl mx-auto">
        <p className="text-xl text-gray-600 dark:text-gray-300 italic">
          &ldquo;{quote.quote}&rdquo;
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          —— {quote.author}
        </p>
        {quote.language !== 'en' && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Language: {quote.language.toUpperCase()}
          </p>
        )}
        {quote.translation && (
          <p className="text-md text-gray-500 dark:text-gray-400 mt-3 italic">
            Translation: &ldquo;{quote.translation}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
