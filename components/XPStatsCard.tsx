/**
 * XPStatsCard Component
 * Displays XP statistics including level, progress, and XP counts
 */

import React from 'react';
import styles from './XPStatsCard.module.css';
import { formatXP, getLevelTitle } from '@/utils/xpCalculations';
import type { XPStats } from '@/types/xp';

interface XPStatsCardProps {
  stats: XPStats;
  showDetails?: boolean;
  className?: string;
  animated?: boolean;
}

export default function XPStatsCard({
  stats,
  showDetails = true,
  className = '',
  animated = true
}: XPStatsCardProps) {
  const xpToNextLevel = stats.nextLevelXP - stats.totalXP;
  const levelTitle = getLevelTitle(stats.level);

  return (
    <div className={`${styles.card} ${className} ${animated ? styles.animated : ''}`}>
      <div className={styles.header}>
        <div className={styles.levelBadge}>
          <span className={styles.levelNumber}>{stats.level}</span>
          <span className={styles.levelTitle}>{levelTitle}</span>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${stats.progress}%` }}
            role="progressbar"
            aria-valuenow={stats.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className={styles.progressText}>
          <span>{Math.round(stats.progress)}% to Level {stats.level + 1}</span>
        </div>
      </div>

      {showDetails && (
        <div className={styles.details}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Total XP:</span>
            <span className={styles.statValue}>{formatXP(stats.totalXP)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>XP to Next Level:</span>
            <span className={styles.statValue}>{formatXP(xpToNextLevel)}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Next Level XP:</span>
            <span className={styles.statValue}>{formatXP(stats.nextLevelXP)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
