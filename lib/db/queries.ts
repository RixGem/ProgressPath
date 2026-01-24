/**
 * Database query functions for real Duolingo XP data
 * 
 * This module replaces mock data with real Supabase queries to the duolingo_activity table.
 * All functions now fetch actual user data from the database.
 * 
 * @module lib/db/queries
 */

import { supabase } from '@/lib/supabase';
import type { ChartDataPoint, TimePeriod } from '@/types/xpChart';
import type { DashboardData, Activity, TimeStats, StreakData, Language } from '@/types/dashboard';
import { getXPStats } from '@/utils/xpCalculations';

/**
 * Database response type for duolingo_activity table
 */
interface DuolingoActivityRecord {
  id: string;
  user_id: string;
  date: string;
  language: string;
  xp_gained: number;
  total_xp: number;
  lessons_completed: number;
  streak_count: number;
  level: number;
  time_spent_minutes: number;
  words_learned?: number;
  raw_api_data?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Default user ID for queries (can be overridden)
 */
const DEFAULT_USER_ID = 'f484bfe8-2771-4e0f-b765-830fbdb3c74e';

/**
 * Get start date for a given time period
 */
function getStartDateForPeriod(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    case 'weekly':
      return new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
    case 'monthly':
      return new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
    case 'yearly':
      return new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); // Last 5 years
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Convert database language code to app language type
 */
function normalizeLanguage(dbLanguage: string): Language {
  const lang = dbLanguage.toLowerCase();
  if (lang.includes('french') || lang === 'fr') return 'french';
  if (lang.includes('german') || lang === 'de') return 'german';
  return 'all';
}

/**
 * Fetch XP data for a specific user and period from duolingo_activity table
 * 
 * @param userId - User ID to fetch data for
 * @param period - Time period for data aggregation
 * @param language - Optional language filter
 * @returns Array of chart data points
 */
export async function fetchXPData(
  userId: string = DEFAULT_USER_ID,
  period: TimePeriod = 'weekly',
  language?: Language
): Promise<ChartDataPoint[]> {
  try {
    console.log(`[DB Query] Fetching XP data for user ${userId}, period: ${period}, language: ${language || 'all'}`);
    
    const startDate = getStartDateForPeriod(period);
    
    // Build query
    let query = supabase
      .from('duolingo_activity')
      .select('date, xp_gained, total_xp, language, lessons_completed')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    // Add language filter if specified
    if (language && language !== 'all') {
      const languageFilter = language === 'french' ? 'French' : language === 'german' ? 'German' : language;
      query = query.ilike('language', `%${languageFilter}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[DB Query Error] Failed to fetch XP data:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('[DB Query] No XP data found for user');
      return [];
    }
    
    console.log(`[DB Query] Successfully fetched ${data.length} XP records`);
    
    // Transform database records to chart data points
    const chartData: ChartDataPoint[] = data.map((record: any) => ({
      date: record.date,
      xp: record.xp_gained || 0,
      totalXP: record.total_xp || 0,
      lessons: record.lessons_completed || 0,
      label: new Date(record.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
    
    return chartData;
  } catch (error) {
    console.error('[DB Query] Error fetching XP data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch XP data');
  }
}

/**
 * Fetch comprehensive dashboard data for a user
 * 
 * @param userId - User ID to fetch data for
 * @param language - Optional language filter
 * @returns Complete dashboard data
 */
export async function fetchDashboardData(
  userId: string = DEFAULT_USER_ID,
  language?: Language
): Promise<DashboardData> {
  try {
    console.log(`[DB Query] Fetching dashboard data for user ${userId}, language: ${language || 'all'}`);
    
    // Fetch all components in parallel for better performance
    const [chartData, recentActivities, timeStats, streakData] = await Promise.all([
      fetchXPData(userId, 'weekly', language),
      fetchRecentActivities(userId, 10, language),
      fetchTimeStats(userId, language),
      fetchStreakData(userId, language)
    ]);
    
    // Calculate XP stats from chart data
    const totalXP = chartData.reduce((sum, point) => sum + point.xp, 0);
    const xpStats = getXPStats(totalXP);
    
    console.log(`[DB Query] Dashboard data assembled successfully`);
    
    return {
      xpStats,
      chartData,
      recentActivities,
      timeStats,
      streakData,
      language
    };
  } catch (error) {
    console.error('[DB Query] Error fetching dashboard data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
  }
}

/**
 * Fetch recent activities from duolingo_activity table
 * 
 * @param userId - User ID to fetch activities for
 * @param limit - Maximum number of activities to return
 * @param language - Optional language filter
 * @returns Array of recent activities
 */
export async function fetchRecentActivities(
  userId: string = DEFAULT_USER_ID,
  limit: number = 10,
  language?: Language
): Promise<Activity[]> {
  try {
    console.log(`[DB Query] Fetching recent activities for user ${userId}, limit: ${limit}`);
    
    // Build query
    let query = supabase
      .from('duolingo_activity')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    // Add language filter if specified
    if (language && language !== 'all') {
      const languageFilter = language === 'french' ? 'French' : language === 'german' ? 'German' : language;
      query = query.ilike('language', `%${languageFilter}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[DB Query Error] Failed to fetch activities:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('[DB Query] No recent activities found');
      return [];
    }
    
    console.log(`[DB Query] Found ${data.length} recent activities`);
    
    // Transform database records to Activity objects
    const activities: Activity[] = data.map((record: any) => {
      const activityType = record.lessons_completed > 0 ? 'lesson' : 'practice';
      const xpGained = record.xp_gained || 0;
      
      return {
        id: record.id,
        type: activityType,
        title: `${record.language} ${activityType}`,
        description: `Completed ${record.lessons_completed || 0} lessons, earned ${xpGained} XP`,
        xpGained,
        timestamp: new Date(record.date),
        language: normalizeLanguage(record.language)
      };
    });
    
    return activities;
  } catch (error) {
    console.error('[DB Query] Error fetching activities:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch activities');
  }
}

/**
 * Fetch time statistics from duolingo_activity table
 * 
 * @param userId - User ID to fetch stats for
 * @param language - Optional language filter
 * @returns Time statistics
 */
export async function fetchTimeStats(
  userId: string = DEFAULT_USER_ID,
  language?: Language
): Promise<TimeStats> {
  try {
    console.log(`[DB Query] Fetching time stats for user ${userId}`);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Build base query
    let baseQuery = supabase
      .from('duolingo_activity')
      .select('date, time_spent_minutes')
      .eq('user_id', userId);
    
    // Add language filter if specified
    if (language && language !== 'all') {
      const languageFilter = language === 'french' ? 'French' : language === 'german' ? 'German' : language;
      baseQuery = baseQuery.ilike('language', `%${languageFilter}%`);
    }
    
    // Fetch all time data
    const { data: allTimeData, error: allTimeError } = await baseQuery;
    
    if (allTimeError) {
      console.error('[DB Query Error] Failed to fetch time stats:', allTimeError);
      throw new Error(`Database error: ${allTimeError.message}`);
    }
    
    if (!allTimeData || allTimeData.length === 0) {
      console.warn('[DB Query] No time stats found');
      return {
        totalMinutes: 0,
        todayMinutes: 0,
        weekMinutes: 0,
        monthMinutes: 0,
        averageDaily: 0
      };
    }
    
    // Calculate statistics
    const totalMinutes = allTimeData.reduce((sum: number, record: any) => 
      sum + (record.time_spent_minutes || 0), 0);
    
    const todayMinutes = allTimeData
      .filter((record: any) => record.date === today)
      .reduce((sum: number, record: any) => sum + (record.time_spent_minutes || 0), 0);
    
    const weekMinutes = allTimeData
      .filter((record: any) => record.date >= weekAgo)
      .reduce((sum: number, record: any) => sum + (record.time_spent_minutes || 0), 0);
    
    const monthMinutes = allTimeData
      .filter((record: any) => record.date >= monthAgo)
      .reduce((sum: number, record: any) => sum + (record.time_spent_minutes || 0), 0);
    
    const uniqueDays = new Set(allTimeData.map((record: any) => record.date)).size;
    const averageDaily = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;
    
    console.log(`[DB Query] Time stats calculated: ${totalMinutes} total minutes`);
    
    return {
      totalMinutes,
      todayMinutes,
      weekMinutes,
      monthMinutes,
      averageDaily
    };
  } catch (error) {
    console.error('[DB Query] Error fetching time stats:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch time stats');
  }
}

/**
 * Fetch streak data from duolingo_activity table
 * 
 * @param userId - User ID to fetch streak for
 * @param language - Optional language filter
 * @returns Streak information
 */
export async function fetchStreakData(
  userId: string = DEFAULT_USER_ID,
  language?: Language
): Promise<StreakData> {
  try {
    console.log(`[DB Query] Fetching streak data for user ${userId}`);
    
    // Build query for most recent record (has latest streak info)
    let query = supabase
      .from('duolingo_activity')
      .select('date, streak_count')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);
    
    // Add language filter if specified
    if (language && language !== 'all') {
      const languageFilter = language === 'french' ? 'French' : language === 'german' ? 'German' : language;
      query = query.ilike('language', `%${languageFilter}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[DB Query Error] Failed to fetch streak data:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.warn('[DB Query] No streak data found');
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakGoal: 30,
        isActive: false,
        lastActivityDate: new Date()
      };
    }
    
    const latestRecord = data[0];
    const currentStreak = latestRecord.streak_count || 0;
    const lastActivityDate = new Date(latestRecord.date);
    const today = new Date();
    const daysSinceActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    const isActive = daysSinceActivity <= 1; // Active if practiced today or yesterday
    
    // For longest streak, we'd need to analyze all records, but for now use current as proxy
    // In a real implementation, this would scan all records to find the longest consecutive streak
    const longestStreak = Math.max(currentStreak, currentStreak);
    
    console.log(`[DB Query] Streak data: current=${currentStreak}, active=${isActive}`);
    
    return {
      currentStreak,
      longestStreak,
      streakGoal: 30,
      isActive,
      lastActivityDate
    };
  } catch (error) {
    console.error('[DB Query] Error fetching streak data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch streak data');
  }
}

/**
 * Save a new XP activity to the duolingo_activity table
 * 
 * @param userId - User ID
 * @param xp - XP amount earned
 * @param activityType - Type of activity
 * @param description - Optional description
 * @param language - Language of activity
 * @returns Created activity record
 */
export async function saveXPActivity(
  userId: string = DEFAULT_USER_ID,
  xp: number,
  activityType: string,
  description?: string,
  language?: Language
): Promise<Activity> {
  try {
    console.log(`[DB Query] Saving XP activity for user ${userId}: ${xp} XP`);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch current totals for this user and language
    let totalQuery = supabase
      .from('duolingo_activity')
      .select('total_xp, streak_count')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);
    
    if (language && language !== 'all') {
      const languageFilter = language === 'french' ? 'French' : language === 'german' ? 'German' : language;
      totalQuery = totalQuery.ilike('language', `%${languageFilter}%`);
    }
    
    const { data: latestData } = await totalQuery;
    const previousTotalXP = latestData && latestData.length > 0 ? latestData[0].total_xp : 0;
    const previousStreak = latestData && latestData.length > 0 ? latestData[0].streak_count : 0;
    
    // Insert new activity record
    const { data, error } = await supabase
      .from('duolingo_activity')
      .insert({
        user_id: userId,
        date: today,
        language: language === 'french' ? 'French' : language === 'german' ? 'German' : 'Unknown',
        xp_gained: xp,
        total_xp: previousTotalXP + xp,
        lessons_completed: 1,
        streak_count: previousStreak + 1,
        level: Math.floor((previousTotalXP + xp) / 100) + 1,
        time_spent_minutes: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('[DB Query Error] Failed to save activity:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log(`[DB Query] Activity saved successfully`);
    
    // Transform to Activity type
    const activity: Activity = {
      id: data.id,
      type: activityType as Activity['type'],
      title: `${data.language} ${activityType}`,
      description,
      xpGained: xp,
      timestamp: new Date(data.date),
      language: normalizeLanguage(data.language)
    };
    
    return activity;
  } catch (error) {
    console.error('[DB Query] Error saving XP activity:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save XP activity');
  }
}

/**
 * Get latest activity data for a user (for quick stats)
 * 
 * @param userId - User ID
 * @param language - Optional language filter
 * @returns Latest activity record
 */
export async function getLatestActivity(
  userId: string = DEFAULT_USER_ID,
  language?: Language
): Promise<DuolingoActivityRecord | null> {
  try {
    let query = supabase
      .from('duolingo_activity')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);
    
    if (language && language !== 'all') {
      const languageFilter = language === 'french' ? 'French' : language === 'german' ? 'German' : language;
      query = query.ilike('language', `%${languageFilter}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[DB Query Error] Failed to fetch latest activity:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('[DB Query] Error fetching latest activity:', error);
    return null;
  }
}
