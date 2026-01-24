/**
 * TypeScript types for Dashboard
 */

import type { XPStats } from './xp';
import type { ChartDataPoint, TimePeriod } from './xpChart';

export type Language = 'french' | 'german' | 'all';

export interface DashboardData {
  xpStats: XPStats;
  chartData: ChartDataPoint[];
  recentActivities: Activity[];
  timeStats: TimeStats;
  streakData: StreakData;
  language?: Language;
}

export interface Activity {
  id: string;
  type: 'lesson' | 'practice' | 'review' | 'achievement';
  title: string;
  description?: string;
  xpGained: number;
  timestamp: Date;
  language?: Language;
}

export interface TimeStats {
  totalMinutes: number;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  averageDaily: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakGoal: number;
  isActive: boolean;
  lastActivityDate: Date;
}

export interface DashboardFilters {
  period: TimePeriod;
  language?: Language;
  startDate?: Date;
  endDate?: Date;
}

export interface LanguageStats {
  language: Language;
  displayName: string;
  totalXP: number;
  level: number;
  lessonsCompleted: number;
  timeSpent: number;
  streak: number;
}

export const LANGUAGE_CONFIG: Record<Language, { name: string; flag: string; color: string }> = {
  french: { name: 'French', flag: '🇫🇷', color: '#667eea' },
  german: { name: 'German', flag: '🇩🇪', color: '#f59e0b' },
  all: { name: 'All Languages', flag: '🌍', color: '#10b981' }
};
