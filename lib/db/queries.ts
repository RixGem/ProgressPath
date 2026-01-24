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
 * Interface for completion rate data
 */
export interface CompletionRateData {
  completionRate: number;
  totalSkills: number;
  completedSkills: number;
  languageCode: string;
}

/**
 * Interface for virtual level data
 */
export interface VirtualLevelData {
  virtualLevel: number;
  totalXP: number;
  languageCode: string;
  estimatedHours: number;
}

/**
 * Interface for active skills data
 */
export interface ActiveSkillsData {
  activeSkillsCount: number;
  totalSkills: number;
  completionRate: number;
  languageCode: string;
  recentActivityHeat: number;
}

/**
 * Interface for activity heatmap data point
 */
export interface ActivityHeatmapPoint {
  date: string;
  xpGained: number;
  lessonsCompleted: number;
  timeSpentMinutes: number;
  activityHeat: number;
  timestamp: number;
}

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
 * Get completion rate for a specific language
 */
export async function getCompletionRate(userId: string, languageCode: string): Promise<CompletionRateData | null> {
  try {
    const { data, error } = await supabase
      .from('duolingo_activity')
      .select('completion_rate, language_code, active_skills_count')
      .eq('user_id', userId)
      .eq('language_code', languageCode)
      .order('date', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const completionRate = row.completion_rate || 0;
    const activeSkillsCount = row.active_skills_count || 0;
    
    // Estimate total skills based on completion rate
    const totalSkills = completionRate > 0 ? Math.round(activeSkillsCount / (completionRate / 100)) : activeSkillsCount;
    const completedSkills = totalSkills - activeSkillsCount;

    return {
      completionRate,
      totalSkills,
      completedSkills,
      languageCode: row.language_code
    };
  } catch (error) {
    console.error('Error fetching completion rate:', error);
    return null;
  }
}

/**
 * Get virtual level for a specific language
 */
export async function getVirtualLevel(userId: string, languageCode: string): Promise<VirtualLevelData | null> {
  try {
    const { data, error } = await supabase
      .from('duolingo_activity')
      .select('virtual_level, total_xp, language_code, estimated_hours')
      .eq('user_id', userId)
      .eq('language_code', languageCode)
      .order('date', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      virtualLevel: row.virtual_level || 0,
      totalXP: row.total_xp || 0,
      languageCode: row.language_code,
      estimatedHours: row.estimated_hours || 0
    };
  } catch (error) {
    console.error('Error fetching virtual level:', error);
    return null;
  }
}

/**
 * Get active skills data for a specific language
 */
export async function getActiveSkillsData(userId: string, languageCode: string): Promise<ActiveSkillsData | null> {
  try {
    const { data, error } = await supabase
      .from('duolingo_activity')
      .select('active_skills_count, completion_rate, language_code, recent_activity_heat')
      .eq('user_id', userId)
      .eq('language_code', languageCode)
      .order('date', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    const row = data[0];
    const activeSkillsCount = row.active_skills_count || 0;
    const completionRate = row.completion_rate || 0;
    
    // Estimate total skills
    const totalSkills = completionRate > 0 ? Math.round(activeSkillsCount / (completionRate / 100)) : activeSkillsCount;

    return {
      activeSkillsCount,
      totalSkills,
      completionRate,
      languageCode: row.language_code,
      recentActivityHeat: row.recent_activity_heat || 0
    };
  } catch (error) {
    console.error('Error fetching active skills data:', error);
    return null;
  }
}

/**
 * Get activity heatmap data for a specific language over a given number of days
 */
export async function getActivityHeatmap(
  userId: string, 
  languageCode: string, 
  days: number = 30
): Promise<ActivityHeatmapPoint[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data, error } = await supabase
      .from('duolingo_activity')
      .select('date, xp_gained, lessons_completed, time_spent_minutes, recent_activity_heat')
      .eq('user_id', userId)
      .eq('language_code', languageCode)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
      date: row.date,
      xpGained: row.xp_gained || 0,
      lessonsCompleted: row.lessons_completed || 0,
      timeSpentMinutes: row.time_spent_minutes || 0,
      activityHeat: row.recent_activity_heat || 0,
      timestamp: new Date(row.date).getTime()
    }));
  } catch (error) {
    console.error('Error fetching activity heatmap:', error);
    return [];
  }
}

/**
 * Get daily XP for charts
 */
export async function getDailyXP(userId: string, period: TimePeriod = 'weekly', languageCode?: string): Promise<ChartDataPoint[]> {
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
      .select('date, xp_gained, language_code')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (languageCode) {
      query = query.eq('language_code', languageCode);
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
export async function getStreakInfo(userId: string, languageCode?: string): Promise<StreakData> {
  try {
    // First try to get streak_count from the most recent record
    let query = supabase
      .from('duolingo_activity')
      .select('date, streak_count')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (languageCode) {
      query = query.eq('language_code', languageCode);
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
export async function getActivityBreakdown(userId: string, languageCode?: string): Promise<Activity[]> {
  try {
    let query = supabase
      .from('duolingo_activity')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    if (languageCode) {
      query = query.eq('language_code', languageCode);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Parse raw_api_data to get individual activities
    const activities: Activity[] = [];

    (data || []).forEach((row, rowIndex) => {
      const rawData = row.raw_api_data;
      const languageName = row.language_code?.toLowerCase() || 'unknown';

      if (rawData?.activities && Array.isArray(rawData.activities)) {
        rawData.activities.forEach((activity: any, actIndex: number) => {
          activities.push({
            id: `${row.id}-${actIndex}`,
            type: 'lesson' as Activity['type'],
            title: activity.skill || 'General Practice',
            description: `${row.language_code} - ${activity.skill || 'Practice'}`,
            xpGained: activity.xp || 0,
            timestamp: new Date(`${row.date}T${activity.time || '12:00:00'}`),
            language: languageName as Language
          });
        });
      } else {
        // Fallback: create one activity per day if no detailed activities
        activities.push({
          id: row.id || `activity-${rowIndex}`,
          type: 'practice' as Activity['type'],
          title: `${row.language_code} Practice`,
          description: `${row.lessons_completed || 0} lessons completed`,
          xpGained: row.xp_gained || 0,
          timestamp: new Date(row.date),
          language: languageName as Language
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
      .select('language_code, xp_gained, total_xp, lessons_completed, time_spent_minutes, level, virtual_level, streak_count, completion_rate, active_skills_count, estimated_hours, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    const statsMap = new Map<string, LanguageStats>();

    data?.forEach(row => {
      const langCode = (row.language_code || 'unknown').toLowerCase();
      const existing = statsMap.get(langCode);

      if (!existing) {
        // Use the most recent record's level, virtual_level, and streak_count
        statsMap.set(langCode, {
          language: langCode as Language,
          displayName: row.language_code || 'Unknown',
          totalXP: row.total_xp || row.xp_gained || 0,
          level: row.virtual_level || row.level || 1,
          lessonsCompleted: row.lessons_completed || 0,
          timeSpent: row.time_spent_minutes || 0,
          streak: row.streak_count || 0
        });
      } else {
        // Aggregate lessons and time from older records
        existing.lessonsCompleted += (row.lessons_completed || 0);
        existing.timeSpent += (row.time_spent_minutes || 0);
        // Keep the most recent total_xp value (from the first record)
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
export async function getTimeStats(userId: string, languageCode?: string): Promise<TimeStats> {
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
      .select('date, time_spent_minutes, estimated_hours')
      .eq('user_id', userId)
      .gte('date', monthStartStr)
      .lte('date', todayStr);

    if (languageCode) {
      query = query.eq('language_code', languageCode);
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

export async function getVocabularyStats(userId: string, languageCode?: string): Promise<VocabularyStats> {
  try {
    let query = supabase
      .from('duolingo_activity')
      .select('words_learned, raw_api_data')
      .eq('user_id', userId);

    if (languageCode) {
      query = query.eq('language_code', languageCode);
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
