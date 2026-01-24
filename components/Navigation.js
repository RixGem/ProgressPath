'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BookOpen, Languages, Home, LogOut, Settings, Globe, BarChart3, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  
  // Create separate refs for each dropdown to fix click-outside detection
  const dashboardDropdownRef = useRef(null)
  const frenchDropdownRef = useRef(null)
  const germanDropdownRef = useRef(null)

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Check each dropdown ref separately
      const clickedOutsideDashboard = dashboardDropdownRef.current && 
        !dashboardDropdownRef.current.contains(event.target)
      const clickedOutsideFrench = frenchDropdownRef.current && 
        !frenchDropdownRef.current.contains(event.target)
      const clickedOutsideGerman = germanDropdownRef.current && 
        !germanDropdownRef.current.contains(event.target)

      // Only close if we clicked outside the currently open dropdown
      if (openDropdown === 'dashboard' && clickedOutsideDashboard) {
        setOpenDropdown(null)
      } else if (openDropdown === 'language-0' && clickedOutsideFrench) {
        setOpenDropdown(null)
      } else if (openDropdown === 'language-1' && clickedOutsideGerman) {
        setOpenDropdown(null)
      }
    }
    
    // Only add listener if a dropdown is open
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

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

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName)
  }

  // Helper to check if any path in a group is active
  const isPathGroupActive = (paths) => {
    return paths.some(path => pathname === path || pathname.startsWith(path + '/'))
  }

  const simpleNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/books', label: 'Books', icon: BookOpen },
    { href: '/embed/settings', label: 'Embed', icon: Settings },
  ]

  const dashboardItem = {
    label: 'Dashboards',
    icon: BarChart3,
    paths: ['/dashboard'],
    items: [
      { href: '/dashboard', label: 'Overview', icon: BarChart3 },
      { href: '/dashboard/french', label: 'French Dashboard', icon: Languages, emoji: '🇫🇷' },
      { href: '/dashboard/german', label: 'German Dashboard', icon: Globe, emoji: '🇩🇪' },
    ]
  }

  const languageItems = [
    {
      label: 'French',
      icon: Languages,
      emoji: '🇫🇷',
      paths: ['/french'],
      items: [
        { href: '/french', label: 'Learn French', icon: Languages },
        { href: '/french/review', label: 'Review', icon: BookOpen },
      ]
    },
    {
      label: 'German',
      icon: Globe,
      emoji: '🇩🇪',
      paths: ['/german'],
      items: [
        { href: '/german', label: 'Learn German', icon: Globe },
        { href: '/german/review', label: 'Review', icon: BookOpen },
      ]
    }
  ]

  // Map menu keys to their respective refs
  const getDropdownRef = (menuKey) => {
    switch (menuKey) {
      case 'dashboard':
        return dashboardDropdownRef
      case 'language-0':
        return frenchDropdownRef
      case 'language-1':
        return germanDropdownRef
      default:
        return null
    }
  }

  const renderDropdownMenu = (menu, menuKey) => {
    const isOpen = openDropdown === menuKey
    const isActive = isPathGroupActive(menu.paths)
    const dropdownRef = getDropdownRef(menuKey)

    return (
      <div key={menuKey} className="relative" ref={dropdownRef}>
        <button
          onClick={() => toggleDropdown(menuKey)}
          className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap ${
            isActive
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
          title={menu.label}
        >
          {menu.emoji ? (
            <span className="text-lg">{menu.emoji}</span>
          ) : (
            <menu.icon className="w-5 h-5" />
          )}
          <span className="hidden sm:inline text-sm md:text-base">{menu.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            {menu.items.map((item) => {
              const ItemIcon = item.icon
              const isItemActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenDropdown(null)}
                  className={`flex items-center space-x-3 px-4 py-2 transition-colors duration-150 ${
                    isItemActive
                      ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.emoji ? (
                    <span className="text-lg">{item.emoji}</span>
                  ) : (
                    <ItemIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm">{item.label}</span>
                  {isItemActive && <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

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
          </Link>

          {/* Navigation Items and Actions - Scrollable on mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 flex-nowrap">
              {/* Simple nav items */}
              {simpleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm md:text-base">{item.label}</span>
                  </Link>
                )
              })}

              {/* Dashboard dropdown */}
              {renderDropdownMenu(dashboardItem, 'dashboard')}

              {/* Language dropdowns */}
              {languageItems.map((menu, index) => renderDropdownMenu(menu, `language-${index}`))}
            </div>

            <ThemeToggle />

            {/* Logout Button */}
            {user && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-2 sm:px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium hidden sm:inline text-sm md:text-base">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Add scrollbar hide utility */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  )
}
