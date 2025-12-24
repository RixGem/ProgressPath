/**
 * Theme management utility
 * Handles system theme detection, time-based switching, and user preferences
 */

// Theme preference modes
export const THEME_MODES = {
  MANUAL: 'manual',
  SYSTEM: 'system',
  TIME_BASED: 'time-based'
}

// Theme values
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

// Local storage keys
const STORAGE_KEYS = {
  MODE: 'theme-mode',
  MANUAL_THEME: 'theme-manual'
}

/**
 * Check if current time is within dark hours (6PM - 6AM)
 */
export function isDarkHours() {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6
}

/**
 * Get system theme preference using prefers-color-scheme
 */
export function getSystemTheme() {
  if (typeof window === 'undefined') return THEMES.LIGHT
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? THEMES.DARK : THEMES.LIGHT
}

/**
 * Get the current theme mode from localStorage
 */
export function getThemeMode() {
  if (typeof window === 'undefined') return THEME_MODES.SYSTEM
  
  const savedMode = localStorage.getItem(STORAGE_KEYS.MODE)
  return savedMode || THEME_MODES.SYSTEM
}

/**
 * Set the theme mode in localStorage
 */
export function setThemeMode(mode) {
  if (typeof window === 'undefined') return
  
  if (!Object.values(THEME_MODES).includes(mode)) {
    console.warn(`Invalid theme mode: ${mode}`)
    return
  }
  
  localStorage.setItem(STORAGE_KEYS.MODE, mode)
}

/**
 * Get the manually set theme from localStorage
 */
export function getManualTheme() {
  if (typeof window === 'undefined') return THEMES.LIGHT
  
  const savedTheme = localStorage.getItem(STORAGE_KEYS.MANUAL_THEME)
  return savedTheme || THEMES.LIGHT
}

/**
 * Set the manual theme in localStorage
 */
export function setManualTheme(theme) {
  if (typeof window === 'undefined') return
  
  if (!Object.values(THEMES).includes(theme)) {
    console.warn(`Invalid theme: ${theme}`)
    return
  }
  
  localStorage.setItem(STORAGE_KEYS.MANUAL_THEME, theme)
}

/**
 * Calculate the effective theme based on current mode and preferences
 */
export function calculateTheme() {
  const mode = getThemeMode()
  
  switch (mode) {
    case THEME_MODES.MANUAL:
      return getManualTheme()
    
    case THEME_MODES.SYSTEM:
      return getSystemTheme()
    
    case THEME_MODES.TIME_BASED:
      return isDarkHours() ? THEMES.DARK : THEMES.LIGHT
    
    default:
      return getSystemTheme()
  }
}

/**
 * Apply theme to the document
 */
export function applyTheme(theme) {
  if (typeof window === 'undefined') return
  
  if (theme === THEMES.DARK) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * Initialize theme system
 * Sets up listeners for system theme changes and time-based updates
 */
export function initializeTheme(onThemeChange) {
  if (typeof window === 'undefined') return () => {}
  
  // Apply initial theme
  const initialTheme = calculateTheme()
  applyTheme(initialTheme)
  
  // Set up system theme listener
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = () => {
    const mode = getThemeMode()
    if (mode === THEME_MODES.SYSTEM) {
      const newTheme = calculateTheme()
      applyTheme(newTheme)
      if (onThemeChange) onThemeChange(newTheme)
    }
  }
  
  // Add listener (use addEventListener for better compatibility)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handleSystemThemeChange)
  }
  
  // Set up interval for time-based theme updates
  const handleTimeCheck = () => {
    const mode = getThemeMode()
    if (mode === THEME_MODES.TIME_BASED) {
      const newTheme = calculateTheme()
      applyTheme(newTheme)
      if (onThemeChange) onThemeChange(newTheme)
    }
  }
  
  // Check every minute for time-based theme changes
  const timeInterval = setInterval(handleTimeCheck, 60000)
  
  // Cleanup function
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    } else {
      mediaQuery.removeListener(handleSystemThemeChange)
    }
    clearInterval(timeInterval)
  }
}
