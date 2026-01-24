/**
 * TypeScript types for view mode
 */

export type ViewMode = 'grid' | 'list' | 'compact' | 'detailed';

export interface ViewModeConfig {
  mode: ViewMode;
  sortBy?: 'name' | 'date' | 'xp' | 'progress';
  sortOrder?: 'asc' | 'desc';
  showDetails?: boolean;
  itemsPerPage?: number;
}

export interface ViewModePreferences {
  defaultMode: ViewMode;
  rememberLastMode: boolean;
  autoSavePreferences: boolean;
}

export interface ViewModeState {
  currentMode: ViewMode;
  config: ViewModeConfig;
  isChanging: boolean;
}

export const VIEW_MODES: readonly ViewMode[] = ['grid', 'list', 'compact', 'detailed'] as const;

export const DEFAULT_VIEW_MODE: ViewMode = 'grid';

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  grid: 'Grid View',
  list: 'List View',
  compact: 'Compact View',
  detailed: 'Detailed View'
};

export const VIEW_MODE_ICONS: Record<ViewMode, string> = {
  grid: '⊞',
  list: '☰',
  compact: '≡',
  detailed: '▤'
};
