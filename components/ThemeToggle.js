'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Clock } from 'lucide-react'
import {
  THEME_MODES,
  THEMES,
  calculateTheme,
  applyTheme,
  getThemeMode,
  setThemeMode,
  setManualTheme,
  initializeTheme
} from '../lib/theme'

export default function ThemeToggle({ showModeSelector = false }) {
  const [currentTheme, setCurrentTheme] = useState(THEMES.LIGHT)
  const [mode, setMode] = useState(THEME_MODES.SYSTEM)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    // Initialize theme and get current values
    const savedMode = getThemeMode()
    const theme = calculateTheme()
    
    setMode(savedMode)
    setCurrentTheme(theme)
    applyTheme(theme)

    // Set up theme listeners
    const cleanup = initializeTheme((newTheme) => {
      setCurrentTheme(newTheme)
    })

    return cleanup
  }, [])

  const handleManualToggle = () => {
    // Switch to manual mode and toggle theme
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    
    setThemeMode(THEME_MODES.MANUAL)
    setManualTheme(newTheme)
    setMode(THEME_MODES.MANUAL)
    setCurrentTheme(newTheme)
    applyTheme(newTheme)
    setShowMenu(false)
  }

  const handleModeChange = (newMode) => {
    setThemeMode(newMode)
    setMode(newMode)
    
    // Apply theme based on new mode
    const theme = calculateTheme()
    setCurrentTheme(theme)
    applyTheme(theme)
    setShowMenu(false)
  }

  const getModeIcon = () => {
    switch (mode) {
      case THEME_MODES.SYSTEM:
        return <Monitor className="w-4 h-4" />
      case THEME_MODES.TIME_BASED:
        return <Clock className="w-4 h-4" />
      default:
        return currentTheme === THEMES.DARK ? 
          <Moon className="w-4 h-4" /> : 
          <Sun className="w-4 h-4" />
    }
  }

  if (!showModeSelector) {
    // Simple toggle button
    return (
      <button
        onClick={handleManualToggle}
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200"
        aria-label="Toggle theme"
        title={`Current: ${mode === THEME_MODES.MANUAL ? currentTheme : mode} mode`}
      >
        {currentTheme === THEMES.DARK ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-700" />
        )}
      </button>
    )
  }

  // Extended version with mode selector
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
        aria-label="Theme settings"
      >
        {currentTheme === THEMES.DARK ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-gray-700" />
        )}
        {getModeIcon()}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
              Theme Mode
            </div>
            
            <button
              onClick={() => handleModeChange(THEME_MODES.SYSTEM)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                mode === THEME_MODES.SYSTEM ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Follow System</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Use system preference</div>
              </div>
              {mode === THEME_MODES.SYSTEM && (
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>

            <button
              onClick={() => handleModeChange(THEME_MODES.TIME_BASED)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                mode === THEME_MODES.TIME_BASED ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Time-based</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Dark mode 6PM-6AM</div>
              </div>
              {mode === THEME_MODES.TIME_BASED && (
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>

            <button
              onClick={handleManualToggle}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                mode === THEME_MODES.MANUAL ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {currentTheme === THEMES.DARK ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Manual</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Toggle manually</div>
              </div>
              {mode === THEME_MODES.MANUAL && (
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
