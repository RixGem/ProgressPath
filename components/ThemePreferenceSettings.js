'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Clock, Check } from 'lucide-react'
import {
  THEME_MODES,
  THEMES,
  calculateTheme,
  applyTheme,
  getThemeMode,
  setThemeMode,
  getManualTheme,
  setManualTheme,
  getSystemTheme,
  isDarkHours,
  initializeTheme
} from '../lib/theme'

export default function ThemePreferenceSettings() {
  const [currentTheme, setCurrentTheme] = useState(THEMES.LIGHT)
  const [mode, setMode] = useState(THEME_MODES.SYSTEM)
  const [manualTheme, setManualThemeState] = useState(THEMES.LIGHT)

  useEffect(() => {
    // Load initial values
    const savedMode = getThemeMode()
    const theme = calculateTheme()
    const manual = getManualTheme()
    
    setMode(savedMode)
    setCurrentTheme(theme)
    setManualThemeState(manual)

    // Set up theme listeners
    const cleanup = initializeTheme((newTheme) => {
      setCurrentTheme(newTheme)
    })

    return cleanup
  }, [])

  const handleModeChange = (newMode) => {
    setThemeMode(newMode)
    setMode(newMode)
    
    // Apply theme based on new mode
    const theme = calculateTheme()
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  const handleManualThemeChange = (theme) => {
    setManualTheme(theme)
    setManualThemeState(theme)
    
    // If in manual mode, apply immediately
    if (mode === THEME_MODES.MANUAL) {
      setCurrentTheme(theme)
      applyTheme(theme)
    }
  }

  const systemTheme = getSystemTheme()
  const isNightTime = isDarkHours()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Theme Preferences
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose how you want the theme to be applied
      </p>

      <div className="space-y-4">
        {/* Follow System Option */}
        <button
          onClick={() => handleModeChange(THEME_MODES.SYSTEM)}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            mode === THEME_MODES.SYSTEM
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              mode === THEME_MODES.SYSTEM
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              <Monitor className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Follow System
                </h3>
                {mode === THEME_MODES.SYSTEM && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Automatically match your operating system's theme preference
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Current system preference: <span className="font-medium">{systemTheme}</span>
              </p>
            </div>
          </div>
        </button>

        {/* Time-based Option */}
        <button
          onClick={() => handleModeChange(THEME_MODES.TIME_BASED)}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            mode === THEME_MODES.TIME_BASED
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              mode === THEME_MODES.TIME_BASED
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Time-based
                </h3>
                {mode === THEME_MODES.TIME_BASED && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Switch to dark mode from 6PM to 6AM automatically
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Current time preference: <span className="font-medium">{isNightTime ? 'dark' : 'light'}</span>
              </p>
            </div>
          </div>
        </button>

        {/* Manual Option */}
        <button
          onClick={() => handleModeChange(THEME_MODES.MANUAL)}
          className={`w-full p-4 rounded-lg border-2 transition-all ${
            mode === THEME_MODES.MANUAL
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              mode === THEME_MODES.MANUAL
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {manualTheme === THEMES.DARK ? (
                <Moon className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Manual
                </h3>
                {mode === THEME_MODES.MANUAL && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose your preferred theme manually
              </p>
              
              {mode === THEME_MODES.MANUAL && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleManualThemeChange(THEMES.LIGHT)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      manualTheme === THEMES.LIGHT
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleManualThemeChange(THEMES.DARK)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      manualTheme === THEMES.DARK
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 dark:text-blue-400 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              Current Theme
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              {currentTheme === THEMES.DARK ? 'Dark mode is currently active' : 'Light mode is currently active'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
