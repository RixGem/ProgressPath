/**
 * Custom hook for view mode management
 */

import { useState, useEffect, useCallback } from 'react';
import type { ViewMode, ViewModeConfig, ViewModeState } from '@/types/viewMode';
import { DEFAULT_VIEW_MODE } from '@/types/viewMode';
import {
  getStoredViewMode,
  saveViewMode,
  getStoredViewModeConfig,
  saveViewModeConfig,
  getStoredViewModePreferences,
  getDefaultViewModeConfig,
  getDefaultViewModePreferences
} from '@/utils/viewModeStorage';

export function useViewMode(initialMode?: ViewMode) {
  const [state, setState] = useState<ViewModeState>(() => {
    const preferences = getStoredViewModePreferences() || getDefaultViewModePreferences();
    const storedMode = preferences.rememberLastMode ? getStoredViewMode() : null;
    const mode = initialMode || storedMode || preferences.defaultMode || DEFAULT_VIEW_MODE;
    const config = getStoredViewModeConfig() || getDefaultViewModeConfig(mode);
    
    return {
      currentMode: mode,
      config: { ...config, mode },
      isChanging: false
    };
  });

  /**
   * Change the current view mode
   */
  const setViewMode = useCallback((newMode: ViewMode) => {
    setState(prev => ({
      ...prev,
      isChanging: true
    }));

    // Simulate a brief transition
    setTimeout(() => {
      setState(prev => {
        const newConfig = {
          ...prev.config,
          mode: newMode,
          showDetails: newMode === 'detailed',
          itemsPerPage: newMode === 'compact' ? 50 : 20
        };

        // Save to localStorage
        const preferences = getStoredViewModePreferences() || getDefaultViewModePreferences();
        if (preferences.autoSavePreferences) {
          saveViewMode(newMode);
          saveViewModeConfig(newConfig);
        }

        return {
          currentMode: newMode,
          config: newConfig,
          isChanging: false
        };
      });
    }, 150);
  }, []);

  /**
   * Update view mode configuration
   */
  const updateConfig = useCallback((updates: Partial<ViewModeConfig>) => {
    setState(prev => {
      const newConfig = { ...prev.config, ...updates };
      
      // Save to localStorage
      const preferences = getStoredViewModePreferences() || getDefaultViewModePreferences();
      if (preferences.autoSavePreferences) {
        saveViewModeConfig(newConfig);
      }
      
      return {
        ...prev,
        config: newConfig
      };
    });
  }, []);

  /**
   * Toggle between two view modes
   */
  const toggleViewMode = useCallback((modeA: ViewMode, modeB: ViewMode) => {
    setViewMode(state.currentMode === modeA ? modeB : modeA);
  }, [state.currentMode, setViewMode]);

  /**
   * Cycle through all available view modes
   */
  const cycleViewMode = useCallback(() => {
    const modes: ViewMode[] = ['grid', 'list', 'compact', 'detailed'];
    const currentIndex = modes.indexOf(state.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  }, [state.currentMode, setViewMode]);

  /**
   * Reset to default view mode
   */
  const resetViewMode = useCallback(() => {
    const preferences = getStoredViewModePreferences() || getDefaultViewModePreferences();
    setViewMode(preferences.defaultMode);
  }, [setViewMode]);

  return {
    viewMode: state.currentMode,
    config: state.config,
    isChanging: state.isChanging,
    setViewMode,
    updateConfig,
    toggleViewMode,
    cycleViewMode,
    resetViewMode
  };
}
