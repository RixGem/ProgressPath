'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Languages, Home, LogOut, Settings, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Failed to log out. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/books', label: 'Books', icon: BookOpen },
    { href: '/french', label: 'French', icon: Languages },
    { href: '/german', label: 'German', icon: Globe },
    { href: '/embed/settings', label: 'Embed', icon: Settings },
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo and Title - Mobile Responsive */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0 min-w-0">
            <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">✦</span>
            </div>
            {/* Full text on larger screens */}
            <span className="hidden md:inline text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Chris's Learning Goal
            </span>
            {/* Abbreviated text on small screens */}
            <span className="inline md:hidden text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Chris's Goal
            </span>
            {/* Very small screens - even shorter */}
            <span className="hidden xs:hidden text-base font-semibold text-gray-900 dark:text-white">
              Goal
            </span>
          </Link>

          {/* Navigation Items and Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors duration-200 ${isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <ThemeToggle />

            {/* Logout Button */}
            {user && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
