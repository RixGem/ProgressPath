/**
 * Utility functions for view mode storage
 */

import type { ViewMode, ViewModeConfig, ViewModePreferences } from '@/types/viewMode';
import { DEFAULT_VIEW_MODE } from '@/types/viewMode';

const VIEW_MODE_STORAGE_KEY = 'progresspath_view_mode';
const VIEW_MODE_CONFIG_KEY = 'progresspath_view_mode_config';
const VIEW_MODE_PREFERENCES_KEY = 'progresspath_view_mode_preferences';

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get stored view mode from localStorage
 */
export function getStoredViewMode(): ViewMode | null {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored as ViewMode | null;
  } catch (error) {
    console.error('Error reading view mode from storage:', error);
    return null;
  }
}

/**
 * Save view mode to localStorage
 */
export function saveViewMode(mode: ViewMode): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    return true;
  } catch (error) {
    console.error('Error saving view mode to storage:', error);
    return false;
  }
}

/**
 * Get stored view mode config from localStorage
 */
export function getStoredViewModeConfig(): ViewModeConfig | null {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading view mode config from storage:', error);
    return null;
  }
}

/**
 * Save view mode config to localStorage
 */
export function saveViewModeConfig(config: ViewModeConfig): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    window.localStorage.setItem(VIEW_MODE_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving view mode config to storage:', error);
    return false;
  }
}

/**
 * Get stored view mode preferences from localStorage
 */
export function getStoredViewModePreferences(): ViewModePreferences | null {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading view mode preferences from storage:', error);
    return null;
  }
}

/**
 * Save view mode preferences to localStorage
 */
export function saveViewModePreferences(preferences: ViewModePreferences): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    window.localStorage.setItem(VIEW_MODE_PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error saving view mode preferences to storage:', error);
    return false;
  }
}

/**
 * Clear all view mode storage
 */
export function clearViewModeStorage(): boolean {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    window.localStorage.removeItem(VIEW_MODE_STORAGE_KEY);
    window.localStorage.removeItem(VIEW_MODE_CONFIG_KEY);
    window.localStorage.removeItem(VIEW_MODE_PREFERENCES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing view mode storage:', error);
    return false;
  }
}

/**
 * Get view mode with fallback to default
 */
export function getViewModeWithDefault(): ViewMode {
  return getStoredViewMode() || DEFAULT_VIEW_MODE;
}

/**
 * Initialize view mode config with defaults
 */
export function getDefaultViewModeConfig(mode: ViewMode): ViewModeConfig {
  return {
    mode,
    sortBy: 'date',
    sortOrder: 'desc',
    showDetails: mode === 'detailed',
    itemsPerPage: mode === 'compact' ? 50 : 20
  };
}

/**
 * Initialize view mode preferences with defaults
 */
export function getDefaultViewModePreferences(): ViewModePreferences {
  return {
    defaultMode: DEFAULT_VIEW_MODE,
    rememberLastMode: true,
    autoSavePreferences: true
  };
}
