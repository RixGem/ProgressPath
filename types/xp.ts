/**
 * TypeScript types for XP system
 */

export interface XPData {
  currentXP: number;
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number;
}

export interface XPStats {
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  level: number;
  progress: number;
}

export interface XPActivity {
  id: string;
  userId: string;
  activityType: string;
  xpGained: number;
  timestamp: Date;
  description?: string;
}

export interface XPLevel {
  level: number;
  requiredXP: number;
  title?: string;
  rewards?: string[];
}

export interface XPGainSource {
  source: string;
  amount: number;
  timestamp: Date;
}

export type XPHistoryPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export interface XPHistory {
  period: XPHistoryPeriod;
  data: {
    date: string;
    xp: number;
  }[];
}
