/**
 * Utility functions for XP calculations
 */

import type { XPData, XPStats, XPLevel } from '@/types/xp';

/**
 * Calculate the XP required for a given level
 * Uses exponential growth formula: baseXP * (level ^ exponent)
 */
export function calculateXPForLevel(level: number, baseXP: number = 100, exponent: number = 1.5): number {
  if (level <= 1) return 0;
  return Math.floor(baseXP * Math.pow(level, exponent));
}

/**
 * Calculate the current level from total XP
 */
export function calculateLevel(totalXP: number, baseXP: number = 100, exponent: number = 1.5): number {
  if (totalXP <= 0) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired <= totalXP) {
    level++;
    xpRequired += calculateXPForLevel(level, baseXP, exponent);
  }
  
  return level - 1;
}

/**
 * Calculate XP progress percentage for current level
 */
export function calculateXPProgress(currentXP: number, currentLevelXP: number, nextLevelXP: number): number {
  if (nextLevelXP <= currentLevelXP) return 100;
  
  const xpIntoLevel = currentXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  
  return Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100));
}

/**
 * Get comprehensive XP statistics
 */
export function getXPStats(totalXP: number, baseXP: number = 100, exponent: number = 1.5): XPStats {
  const level = calculateLevel(totalXP, baseXP, exponent);
  
  let currentLevelXP = 0;
  for (let i = 1; i <= level; i++) {
    currentLevelXP += calculateXPForLevel(i, baseXP, exponent);
  }
  
  const nextLevelXP = currentLevelXP + calculateXPForLevel(level + 1, baseXP, exponent);
  const progress = calculateXPProgress(totalXP, currentLevelXP, nextLevelXP);
  
  return {
    totalXP,
    currentLevelXP,
    nextLevelXP,
    level,
    progress
  };
}

/**
 * Calculate XP remaining to next level
 */
export function getXPToNextLevel(totalXP: number, baseXP: number = 100, exponent: number = 1.5): number {
  const stats = getXPStats(totalXP, baseXP, exponent);
  return stats.nextLevelXP - totalXP;
}

/**
 * Format XP number with thousands separators
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 20) return 'Adept';
  if (level < 35) return 'Expert';
  if (level < 50) return 'Master';
  if (level < 75) return 'Grandmaster';
  if (level < 100) return 'Legend';
  return 'Mythic';
}

/**
 * Generate level progression data
 */
export function generateLevelProgression(maxLevel: number = 100, baseXP: number = 100, exponent: number = 1.5): XPLevel[] {
  const levels: XPLevel[] = [];
  
  for (let level = 1; level <= maxLevel; level++) {
    levels.push({
      level,
      requiredXP: calculateXPForLevel(level, baseXP, exponent),
      title: getLevelTitle(level)
    });
  }
  
  return levels;
}

/**
 * Calculate XP gain rate (XP per day)
 */
export function calculateXPRate(xpGained: number, days: number): number {
  if (days <= 0) return 0;
  return Math.round(xpGained / days);
}

/**
 * Estimate days to reach target level
 */
export function estimateDaysToLevel(currentXP: number, targetLevel: number, dailyXPRate: number, baseXP: number = 100, exponent: number = 1.5): number {
  if (dailyXPRate <= 0) return Infinity;
  
  let targetXP = 0;
  for (let i = 1; i <= targetLevel; i++) {
    targetXP += calculateXPForLevel(i, baseXP, exponent);
  }
  
  const xpNeeded = targetXP - currentXP;
  if (xpNeeded <= 0) return 0;
  
  return Math.ceil(xpNeeded / dailyXPRate);
}
