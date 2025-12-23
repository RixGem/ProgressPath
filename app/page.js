import Link from 'next/link'
import { BookOpen, Languages, TrendingUp, Target } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-primary-600">ProgressPath</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Track your learning journey and celebrate your progress in reading and language learning
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Books Card */}
        <Link href="/books" className="card p-8 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Books Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Track your reading progress, manage your book collection, and set reading goals
          </p>
          <div className="flex items-center text-primary-600 font-medium">
            <span>Start Tracking</span>
            <TrendingUp className="w-4 h-4 ml-2" />
          </div>
        </Link>

        {/* French Learning Card */}
        <Link href="/french" className="card p-8 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <Languages className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">French Learning</h2>
          <p className="text-gray-600 mb-4">
            Log daily learning activities, track your consistency, and monitor your language progress
          </p>
          <div className="flex items-center text-purple-600 font-medium">
            <span>Log Activity</span>
            <Target className="w-4 h-4 ml-2" />
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Set realistic daily goals to build consistent learning habits</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Track your progress regularly to stay motivated</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span>Celebrate small wins along your learning journey</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
