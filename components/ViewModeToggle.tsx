/**
 * ViewModeToggle Component
 * Toggle button for switching between different view modes
 */

import React from 'react';
import styles from './ViewModeToggle.module.css';
import type { ViewMode } from '@/types/viewMode';
import { VIEW_MODE_LABELS, VIEW_MODE_ICONS } from '@/types/viewMode';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  availableModes?: ViewMode[];
  onModeChange: (mode: ViewMode) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  className?: string;
}

export default function ViewModeToggle({
  currentMode,
  availableModes = ['grid', 'list', 'compact', 'detailed'],
  onModeChange,
  disabled = false,
  size = 'medium',
  showLabels = false,
  className = ''
}: ViewModeToggleProps) {
  const handleModeClick = (mode: ViewMode) => {
    if (!disabled && mode !== currentMode) {
      onModeChange(mode);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, mode: ViewMode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeClick(mode);
    }
  };

  return (
    <div className={`${styles.container} ${styles[size]} ${className}`} role="group" aria-label="View mode toggle">
      {availableModes.map((mode) => {
        const isActive = mode === currentMode;
        const label = VIEW_MODE_LABELS[mode];
        const icon = VIEW_MODE_ICONS[mode];

        return (
          <button
            key={mode}
            className={`${styles.button} ${isActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => handleModeClick(mode)}
            onKeyDown={(e) => handleKeyDown(e, mode)}
            disabled={disabled}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            type="button"
          >
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
            {showLabels && <span className={styles.label}>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
