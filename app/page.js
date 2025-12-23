'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Languages, TrendingUp } from 'lucide-react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to ProgressPath
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your learning journey across books and languages. Stay motivated and see your progress grow.
          </p>
          {user && (
            <p className="text-sm text-gray-500">
              Logged in as: <span className="font-medium text-gray-700">{user.email}</span>
            </p>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Books Tracking */}
          <Link href="/books" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Books</h2>
              </div>
              <p className="text-gray-600">
                Track your reading progress, set daily goals, and maintain your reading streak.
              </p>
            </div>
          </Link>

          {/* French Learning */}
          <Link href="/french" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Languages className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">French</h2>
              </div>
              <p className="text-gray-600">
                Practice French vocabulary with spaced repetition and track your learning progress.
              </p>
            </div>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Your Learning Journey</h2>
          </div>
          <p className="text-blue-100">
            Consistent progress leads to mastery. Start tracking your learning today and watch yourself grow!
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
