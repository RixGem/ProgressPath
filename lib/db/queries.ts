/**
 * Database query functions for XP data
 */

import type { ChartDataPoint, TimePeriod } from '@/types/xpChart';
import type { DashboardData, Activity, TimeStats, StreakData, Language } from '@/types/dashboard';
import { getXPStats } from '@/utils/xpCalculations';
import { getDataForPeriod } from '@/utils/xpChartData';

/**
 * Mock database connection
 * In production, replace with actual Supabase client
 */
const mockDB = {
  users: new Map(),
  activities: new Map(),
  xpData: new Map()
};

/**
 * Fetch XP data for a specific user and period
 */
export async function fetchXPData(
  userId: string,
  period: TimePeriod = 'weekly',
  language?: Language
): Promise<ChartDataPoint[]> {
  try {
    // TODO: Replace with actual database query
    // const { data, error } = await supabase
    //   .from('xp_activities')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .gte('created_at', getStartDateForPeriod(period));
    
    // For now, return mock data
    await simulateDelay(300);
    const data = getDataForPeriod(period);
    
    // Filter by language if specified
    if (language && language !== 'all') {
      return data.filter(() => Math.random() > 0.3); // Mock filtering
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching XP data:', error);
    throw new Error('Failed to fetch XP data');
  }
}

/**
 * Fetch dashboard data for a user
 */
export async function fetchDashboardData(
  userId: string,
  language?: Language
): Promise<DashboardData> {
  try {
    await simulateDelay(500);
    
    // Fetch XP data
    const chartData = await fetchXPData(userId, 'weekly', language);
    const totalXP = chartData.reduce((sum, point) => sum + point.xp, 0);
    const xpStats = getXPStats(totalXP);
    
    // Fetch recent activities
    const recentActivities = await fetchRecentActivities(userId, 10, language);
    
    // Fetch time stats
    const timeStats = await fetchTimeStats(userId, language);
    
    // Fetch streak data
    const streakData = await fetchStreakData(userId, language);
    
    return {
      xpStats,
      chartData,
      recentActivities,
      timeStats,
      streakData,
      language
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

/**
 * Fetch recent activities
 */
export async function fetchRecentActivities(
  userId: string,
  limit: number = 10,
  language?: Language
): Promise<Activity[]> {
  try {
    await simulateDelay(200);
    
    // Mock activities
    const activityTypes: Activity['type'][] = ['lesson', 'practice', 'review', 'achievement'];
    const activities: Activity[] = [];
    
    for (let i = 0; i < limit; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const date = new Date();
      date.setHours(date.getHours() - i * 2);
      
      activities.push({
        id: `activity-${i}`,
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} completed`,
        description: `Completed a ${type} activity`,
        xpGained: Math.floor(Math.random() * 100) + 50,
        timestamp: date,
        language: language || 'french'
      });
    }
    
    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw new Error('Failed to fetch activities');
  }
}

/**
 * Fetch time statistics
 */
export async function fetchTimeStats(
  userId: string,
  language?: Language
): Promise<TimeStats> {
  try {
    await simulateDelay(150);
    
    // Mock time stats
    const totalMinutes = Math.floor(Math.random() * 10000) + 5000;
    const todayMinutes = Math.floor(Math.random() * 120) + 30;
    const weekMinutes = Math.floor(Math.random() * 600) + 300;
    const monthMinutes = Math.floor(Math.random() * 2400) + 1200;
    const averageDaily = Math.floor(totalMinutes / 90);
    
    return {
      totalMinutes,
      todayMinutes,
      weekMinutes,
      monthMinutes,
      averageDaily
    };
  } catch (error) {
    console.error('Error fetching time stats:', error);
    throw new Error('Failed to fetch time stats');
  }
}

/**
 * Fetch streak data
 */
export async function fetchStreakData(
  userId: string,
  language?: Language
): Promise<StreakData> {
  try {
    await simulateDelay(150);
    
    // Mock streak data
    const currentStreak = Math.floor(Math.random() * 30) + 1;
    const longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 50) + 10);
    
    return {
      currentStreak,
      longestStreak,
      streakGoal: 30,
      isActive: Math.random() > 0.2,
      lastActivityDate: new Date()
    };
  } catch (error) {
    console.error('Error fetching streak data:', error);
    throw new Error('Failed to fetch streak data');
  }
}

/**
 * Save XP activity
 */
export async function saveXPActivity(
  userId: string,
  xp: number,
  activityType: string,
  description?: string,
  language?: Language
): Promise<Activity> {
  try {
    await simulateDelay(200);
    
    // TODO: Implement actual database save
    // const { data, error } = await supabase
    //   .from('xp_activities')
    //   .insert({
    //     user_id: userId,
    //     xp,
    //     activity_type: activityType,
    //     description,
    //     language,
    //     created_at: new Date()
    //   })
    //   .select()
    //   .single();
    
    const activity: Activity = {
      id: `activity-${Date.now()}`,
      type: activityType as Activity['type'],
      title: activityType,
      description,
      xpGained: xp,
      timestamp: new Date(),
      language
    };
    
    return activity;
  } catch (error) {
    console.error('Error saving XP activity:', error);
    throw new Error('Failed to save XP activity');
  }
}

/**
 * Helper: Simulate network delay
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Get start date for period
 */
function getStartDateForPeriod(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    case 'yearly':
      return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}
