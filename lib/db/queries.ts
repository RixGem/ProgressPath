/**
 * Database query functions for Duolingo activity data
 * Uses duolingo_activity table which stores daily progress data per language
 */

import { supabaseServer } from '@/lib/supabaseServer';
import type { ChartDataPoint, TimePeriod } from '@/types/xpChart';
import type { DashboardData, Activity, TimeStats, StreakData, Language, LanguageStats } from '@/types/dashboard';

// Use server client that bypasses RLS
const supabase = supabaseServer;

// Fixed user ID as per requirements
export const TARGET_USER_ID = 'f484bfe8-2771-4e0f-b765-830fbdb3c74e';

/**
 * Fetch raw Duolingo stats for a user
 */
export async function getDuolingoStats(userId: string) {
  const { data, error } = await supabase
    .from('duolingo_activity')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching Duolingo stats:', error);
    return null;
  }

  return data;
}

/**
 * Get daily XP for charts
 */
export async function getDailyXP(userId: string, period: TimePeriod = 'weekly', language?: string): Promise<ChartDataPoint[]> {
  try {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'monthly':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    let query = supabase
      .from('duolingo_activity')
      .select('date, xp_gained, language')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (language) {
      query = query.ilike('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Aggregate XP by date
    const xpByDate = new Map<string, number>();

    data?.forEach(row => {
      const dateStr = row.date; // date is already in YYYY-MM-DD format
      const currentXP = xpByDate.get(dateStr) || 0;
      xpByDate.set(dateStr, currentXP + (row.xp_gained || 0));
    });

    // Format for chart
    const chartData: ChartDataPoint[] = Array.from(xpByDate.entries()).map(([date, xp]) => ({
      date,
      xp,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: new Date(date).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);

    return chartData;
  } catch (error) {
    console.error('Error fetching daily XP:', error);
    return [];
  }
}

/**
 * Get streak information
 */
export async function getStreakInfo(userId: string, language?: string): Promise<StreakData> {
  try {
    // First try to get streak_count from the most recent record
    let query = supabase
      .from('duolingo_activity')
      .select('date, streak_count')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (language) {
      query = query.ilike('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakGoal: 30,
        isActive: false,
        lastActivityDate: new Date()
      };
    }

    // Get the current streak from the most recent record
    const currentStreak = data[0].streak_count || 0;

    // Get unique dates for calculating longest streak
    const uniqueDates = Array.from<string>(new Set((data || []).map(d => d.date))).sort().reverse();

    const today = new Date().toISOString().split('T')[0];
    const isActive = uniqueDates.includes(today);

    // Calculate longest streak from streak_count values
    const longestStreak = Math.max(...data.map(d => d.streak_count || 0), currentStreak);

    return {
      currentStreak,
      longestStreak,
      streakGoal: 50,
      isActive,
      lastActivityDate: new Date(uniqueDates[0])
    };
  } catch (error) {
    console.error('Error fetching streak info:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakGoal: 30,
      isActive: false,
      lastActivityDate: new Date()
    };
  }
}

/**
 * Get activity breakdown
 */
export async function getActivityBreakdown(userId: string, language?: string): Promise<Activity[]> {
  try {
    let query = supabase
      .from('duolingo_activity')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    if (language) {
      query = query.ilike('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Parse raw_api_data to get individual activities
    const activities: Activity[] = [];

    (data || []).forEach((row, rowIndex) => {
      const rawData = row.raw_api_data;

      if (rawData?.activities && Array.isArray(rawData.activities)) {
        rawData.activities.forEach((activity: any, actIndex: number) => {
          activities.push({
            id: `${row.id}-${actIndex}`,
            type: 'lesson' as Activity['type'],
            title: activity.skill || 'General Practice',
            description: `${row.language} - ${activity.skill || 'Practice'}`,
            xpGained: activity.xp || 0,
            timestamp: new Date(`${row.date}T${activity.time || '12:00:00'}`),
            language: row.language?.toLowerCase() as Language
          });
        });
      } else {
        // Fallback: create one activity per day if no detailed activities
        activities.push({
          id: row.id || `activity-${rowIndex}`,
          type: 'practice' as Activity['type'],
          title: `${row.language} Practice`,
          description: `${row.lessons_completed || 0} lessons completed`,
          xpGained: row.xp_gained || 0,
          timestamp: new Date(row.date),
          language: row.language?.toLowerCase() as Language
        });
      }
    });

    return activities.slice(0, 10);
  } catch (error) {
    console.error('Error fetching activity breakdown:', error);
    return [];
  }
}

/**
 * Get language summary
 */
export async function getLanguageSummary(userId: string): Promise<LanguageStats[]> {
  try {
    const { data, error } = await supabase
      .from('duolingo_activity')
      .select('language, xp_gained, total_xp, lessons_completed, time_spent_minutes, level, streak_count, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    const statsMap = new Map<string, LanguageStats>();

    data?.forEach(row => {
      const lang = (row.language || 'unknown').toLowerCase();
      const existing = statsMap.get(lang);

      if (!existing) {
        // Use the most recent record's level and streak_count
        statsMap.set(lang, {
          language: lang as Language,
          displayName: row.language || 'Unknown',
          totalXP: row.xp_gained || 0,
          level: row.level || 1,
          lessonsCompleted: row.lessons_completed || 0,
          timeSpent: row.time_spent_minutes || 0,
          streak: row.streak_count || 0
        });
      } else {
        // Aggregate XP, lessons, and time from older records
        existing.totalXP += (row.xp_gained || 0);
        existing.lessonsCompleted += (row.lessons_completed || 0);
        existing.timeSpent += (row.time_spent_minutes || 0);
      }
    });

    return Array.from(statsMap.values());
  } catch (error) {
    console.error('Error fetching language summary:', error);
    return [];
  }
}

/**
 * Get time stats with proper date filtering
 */
export async function getTimeStats(userId: string, language?: string): Promise<TimeStats> {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate date boundaries
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 30);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    let query = supabase
      .from('duolingo_activity')
      .select('date, time_spent_minutes')
      .eq('user_id', userId)
      .gte('date', monthStartStr)
      .lte('date', todayStr);

    if (language) {
      query = query.ilike('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate time stats
    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    let totalMinutes = 0;
    let daysWithActivity = 0;

    data?.forEach(row => {
      const minutes = row.time_spent_minutes || 0;
      const rowDate = row.date;

      totalMinutes += minutes;
      monthMinutes += minutes;

      if (rowDate === todayStr) {
        todayMinutes += minutes;
      }

      if (rowDate >= weekStartStr) {
        weekMinutes += minutes;
      }

      if (minutes > 0) {
        daysWithActivity++;
      }
    });

    const averageDaily = daysWithActivity > 0 ? Math.round(totalMinutes / daysWithActivity) : 0;

    return {
      totalMinutes,
      todayMinutes,
      weekMinutes,
      monthMinutes,
      averageDaily
    };
  } catch (error) {
    console.error('Error fetching time stats:', error);
    return {
      totalMinutes: 0,
      todayMinutes: 0,
      weekMinutes: 0,
      monthMinutes: 0,
      averageDaily: 0
    };
  }
}

/**
 * Get vocabulary stats from database
 */
export interface VocabularyStats {
  wordsLearned: number;
  accuracy: number;  // Will need to be calculated from raw_api_data if available
  masteredTopics: number;  // Will need to be calculated from raw_api_data if available
}

export async function getVocabularyStats(userId: string, language?: string): Promise<VocabularyStats> {
  try {
    let query = supabase
      .from('duolingo_activity')
      .select('words_learned, raw_api_data')
      .eq('user_id', userId);

    if (language) {
      query = query.ilike('language', language);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Sum up words_learned from all records
    let totalWordsLearned = 0;

    data?.forEach(row => {
      totalWordsLearned += row.words_learned || 0;
    });

    // For accuracy and mastered topics, we'd need additional data
    // Currently returning placeholders - these would need to be tracked separately
    // or calculated from raw_api_data if available
    return {
      wordsLearned: totalWordsLearned,
      accuracy: 0,  // Not tracked in current schema
      masteredTopics: 0  // Not tracked in current schema
    };
  } catch (error) {
    console.error('Error fetching vocabulary stats:', error);
    return {
      wordsLearned: 0,
      accuracy: 0,
      masteredTopics: 0
    };
  }
}

