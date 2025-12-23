/**
 * Daily Quotes Collection
 * 20 curated quotes across three themes:
 * - Personal Growth (7 quotes)
 * - Learning (7 quotes)
 * - Philosophy (6 quotes)
 */

export const quotes = [
  // Personal Growth (7 quotes)
  {
    id: 1,
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "growth"
  },
  {
    id: 2,
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "growth"
  },
  {
    id: 3,
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "growth"
  },
  {
    id: 4,
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "growth"
  },
  {
    id: 5,
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    category: "growth"
  },
  {
    id: 6,
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson",
    category: "growth"
  },
  {
    id: 7,
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
    category: "growth"
  },

  // Learning (7 quotes)
  {
    id: 8,
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    category: "learning"
  },
  {
    id: 9,
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    category: "learning"
  },
  {
    id: 10,
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss",
    category: "learning"
  },
  {
    id: 11,
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "learning"
  },
  {
    id: 12,
    text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin",
    category: "learning"
  },
  {
    id: 13,
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    category: "learning"
  },
  {
    id: 14,
    text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams",
    category: "learning"
  },

  // Philosophy (6 quotes)
  {
    id: 15,
    text: "The unexamined life is not worth living.",
    author: "Socrates",
    category: "philosophy"
  },
  {
    id: 16,
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    category: "philosophy"
  },
  {
    id: 17,
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    category: "philosophy"
  },
  {
    id: 18,
    text: "Life can only be understood backwards; but it must be lived forwards.",
    author: "Søren Kierkegaard",
    category: "philosophy"
  },
  {
    id: 19,
    text: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "philosophy"
  },
  {
    id: 20,
    text: "The mind is everything. What you think you become.",
    author: "Buddha",
    category: "philosophy"
  }
]

/**
 * Get quote of the day based on current date
 * Uses day of year to ensure same quote for entire day in user's timezone
 */
export function getQuoteOfTheDay() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  
  const index = dayOfYear % quotes.length
  return quotes[index]
}

/**
 * Get category statistics
 */
export function getQuoteStats() {
  const stats = quotes.reduce((acc, quote) => {
    acc[quote.category] = (acc[quote.category] || 0) + 1
    return acc
  }, {})
  
  return {
    total: quotes.length,
    byCategory: stats
  }
}
