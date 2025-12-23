'use client'

import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, Settings } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [themePreference, setThemePreference] = useState('system') // 'manual', 'system', 'time-based'
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef(null)

  // Check if it's night time (6PM to 6AM)
  const isNightTime = () => {
    const hour = new Date().getHours()
    return hour >= 18 || hour < 6
  }

  // Get system preference
  const getSystemPreference = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  }

  // Apply theme to document
  const applyTheme = (dark) => {
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Determine theme based on preference
  const determineTheme = (preference) => {
    switch (preference) {
      case 'system':
        return getSystemPreference()
      case 'time-based':
        return isNightTime()
      case 'manual':
      default:
        return localStorage.getItem('theme') === 'dark'
    }
  }

  // Initialize theme on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('themePreference') || 'system'
    setThemePreference(savedPreference)
    
    const shouldBeDark = determineTheme(savedPreference)
    applyTheme(shouldBeDark)

    // Listen for system theme changes if preference is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (e) => {
      const currentPreference = localStorage.getItem('themePreference') || 'system'
      if (currentPreference === 'system') {
        applyTheme(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemChange)

    // Check time-based theme every minute if preference is 'time-based'
    const timeCheckInterval = setInterval(() => {
      const currentPreference = localStorage.getItem('themePreference') || 'system'
      if (currentPreference === 'time-based') {
        applyTheme(isNightTime())
      }
    }, 60000) // Check every minute

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange)
      clearInterval(timeCheckInterval)
    }
  }, [])

  // Handle preference change
  const handlePreferenceChange = (preference) => {
    setThemePreference(preference)
    localStorage.setItem('themePreference', preference)
    
    const shouldBeDark = determineTheme(preference)
    applyTheme(shouldBeDark)
    
    // Save manual theme state if switching to manual
    if (preference === 'manual') {
      localStorage.setItem('theme', shouldBeDark ? 'dark' : 'light')
    }
    
    setShowSettings(false)
  }

  // Manual toggle (only works in manual mode)
  const toggleTheme = () => {
    if (themePreference === 'manual') {
      const newTheme = !isDark
      applyTheme(newTheme)
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    } else {
      // If not in manual mode, switch to manual and toggle
      const newTheme = !isDark
      setThemePreference('manual')
      localStorage.setItem('themePreference', 'manual')
      applyTheme(newTheme)
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    }
  }

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

  // Get display text for current preference
  const getPreferenceLabel = () => {
    switch (themePreference) {
      case 'system':
        return 'System'
      case 'time-based':
        return 'Time-based'
      case 'manual':
        return 'Manual'
      default:
        return 'System'
    }
  }

  return (
    <div className="relative" ref={settingsRef}>
      <div className="flex gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label="Toggle theme"
          title={`Current theme: ${isDark ? 'Dark' : 'Light'} (${getPreferenceLabel()})`}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label="Theme settings"
          title="Theme preferences"
        >
          <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {showSettings && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Theme Preference
            </h3>
          </div>
          <div className="p-2">
            <button
              onClick={() => handlePreferenceChange('system')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                themePreference === 'system'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">Follow System</div>
              <div className="text-xs opacity-75 mt-0.5">
                Use device theme preference
              </div>
            </button>
            
            <button
              onClick={() => handlePreferenceChange('time-based')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mt-1 ${
                themePreference === 'time-based'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">Time-based</div>
              <div className="text-xs opacity-75 mt-0.5">
                Dark mode 6PM - 6AM
              </div>
            </button>
            
            <button
              onClick={() => handlePreferenceChange('manual')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mt-1 ${
                themePreference === 'manual'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">Manual</div>
              <div className="text-xs opacity-75 mt-0.5">
                Toggle theme manually
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
