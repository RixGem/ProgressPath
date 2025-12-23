'use client'

import { useState, useEffect } from 'react'

const quotes = [
  // Personal Growth (7 quotes)
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  
  // Learning (7 quotes)
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert"
  },
  {
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci"
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  
  // Philosophy (4 quotes)
  {
    text: "The unexamined life is not worth living.",
    author: "Socrates"
  },
  {
    text: "I think, therefore I am.",
    author: "René Descartes"
  },
  {
    text: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche"
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates"
  }
]

export default function DailyQuote() {
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    // Get day of year for consistent daily rotation
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    
    // Select quote based on day of year
    const quoteIndex = dayOfYear % quotes.length
    setQuote(quotes[quoteIndex])
  }, [])

  if (!quote) return null

  return (
    <div className="text-center">
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto italic">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
        —— {quote.author}
      </p>
    </div>
  )
}
