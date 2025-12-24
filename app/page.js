'use client'

import Link from 'next/link'
import { BookOpen, Languages, TrendingUp, Target } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import DailyQuote from '../components/DailyQuote'

export default function Home() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Hey Chris! Ready to <span className="text-primary-600 dark:text-primary-400">Level Up</span>?
          </h1>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Logged in as: <span className="font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
            </p>
          )}
          <DailyQuote />
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Books Card */}
          <Link href="/books" className="card p-8 hover:scale-105 transition-transform duration-200 dark:bg-gray-800 dark:border dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
              <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your Reading Journey</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Dive into your personal library—track every chapter conquered, celebrate reading milestones, and watch your knowledge grow
            </p>
            <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium">
              <span>Continue Reading</span>
              <TrendingUp className="w-4 h-4 ml-2" />
            </div>
          </Link>

          {/* French Learning Card */}
          <Link href="/french" className="card p-8 hover:scale-105 transition-transform duration-200 dark:bg-gray-800 dark:border dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-6">
              <Languages className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Bonjour, Chris! 🇫🇷</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your daily French practice hub—log your learning wins, build your streak, and transform from learner to fluent speaker
            </p>
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium">
              <span>Practice Today</span>
              <Target className="w-4 h-4 ml-2" />
            </div>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="card p-6 dark:bg-gray-800 dark:border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chris's Learning Principles</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">•</span>
                <span>Progress over perfection—every small step counts on your journey</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">•</span>
                <span>Consistency is your superpower—show up daily, even if just for 10 minutes</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 dark:text-primary-400 mr-2">•</span>
                <span>Celebrate every win—you're building something amazing, one day at a time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
