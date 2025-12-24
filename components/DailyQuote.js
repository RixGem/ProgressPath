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
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    language: "en",
    translation: null
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    language: "en",
    translation: null
  },
  {
    quote: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    language: "en",
    translation: null
  },
  {
    quote: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    language: "en",
    translation: null
  },
  {
    quote: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    language: "en",
    translation: null
  },
  {
    quote: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    language: "en",
    translation: null
  },
  
  // Learning (7 quotes)
  {
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    language: "en",
    translation: null
  },
  {
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    language: "en",
    translation: null
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    language: "en",
    translation: null
  },
  {
    quote: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert",
    language: "en",
    translation: null
  },
  {
    quote: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci",
    language: "en",
    translation: null
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    language: "en",
    translation: null
  },
  {
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    language: "en",
    translation: null
  },
  
  // Philosophy (4 quotes)
  {
    quote: "The unexamined life is not worth living.",
    author: "Socrates",
    language: "en",
    translation: null
  },
  {
    quote: "I think, therefore I am.",
    author: "René Descartes",
    language: "en",
    translation: null
  },
  {
    quote: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    language: "en",
    translation: null
  },
  {
    quote: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    language: "en",
    translation: null
  }
]

// Session storage key for caching
const CACHE_KEY = 'dailyQuote_cache'
const CACHE_TIMESTAMP_KEY = 'dailyQuote_timestamp'

export default function DailyQuote() {
  const [quote, setQuote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        // Check if we have a cached quote in this session
        const cachedQuote = sessionStorage.getItem(CACHE_KEY)
        const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY)
        
        if (cachedQuote && cachedTimestamp) {
          // Use cached quote for this session
          setQuote(JSON.parse(cachedQuote))
          setIsLoading(false)
          return
        }

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
          
          // Cache the quote for this session
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(supabaseQuote))
          sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
          
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
        
        // Cache the fallback quote for this session
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(fallbackQuote))
        sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
        
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
