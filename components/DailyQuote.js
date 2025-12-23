'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { getQuoteOfTheDay } from '@/lib/quotes'

export default function DailyQuote() {
  const [quote, setQuote] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Get quote on client side to ensure timezone accuracy
    const dailyQuote = getQuoteOfTheDay()
    setQuote(dailyQuote)
    
    // Fade in animation
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  if (!quote) {
    return null // Prevent hydration mismatch
  }

  // Category color mapping
  const categoryColors = {
    growth: 'from-primary-500 to-primary-600',
    learning: 'from-purple-500 to-purple-600',
    philosophy: 'from-indigo-500 to-indigo-600'
  }

  const gradientClass = categoryColors[quote.category] || categoryColors.growth

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} p-8 shadow-xl transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white opacity-10 blur-xl" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-white/90" />
          <span className="text-white/90 text-sm font-medium uppercase tracking-wider">
            Quote of the Day
          </span>
        </div>

        {/* Quote text */}
        <blockquote className="mb-4">
          <p className="text-white text-xl md:text-2xl font-serif leading-relaxed">
            "{quote.text}"
          </p>
        </blockquote>

        {/* Author */}
        <div className="flex items-center justify-between">
          <cite className="text-white/90 text-base md:text-lg font-medium not-italic">
            — {quote.author}
          </cite>
          
          {/* Category badge */}
          <span className="hidden sm:inline-flex px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium uppercase tracking-wide">
            {quote.category}
          </span>
        </div>
      </div>

      {/* Quote marks decoration */}
      <div className="absolute top-6 left-6 text-white/10 text-6xl font-serif leading-none">
        "
      </div>
    </div>
  )
}
