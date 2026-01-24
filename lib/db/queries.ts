/**
 * Database query functions for Duolingo activity data
 */

import { supabase } from '@/lib/supabase';
import type { ChartDataPoint, TimePeriod } from '@/types/xpChart';
import type { DashboardData, Activity, TimeStats, StreakData, Language, LanguageStats } from '@/types/dashboard';

const TARGET_USER_ID = 'f484bfe8-2771-4e0f-b765-830fbdb3c74e';

/**
 * Get daily XP for charts
 */
export async function getDailyXP(period: TimePeriod = 'weekly'): Promise<ChartDataPoint[]> {
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

    const { data, error } = await supabase
      .from('duolingoactivity')
      .select('date, xp, language')
      .eq('user_id', TARGET_USER_ID)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;

    // Aggregate XP by date
    const xpByDate = new Map<string, number>();

    data?.forEach(row => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      const currentXP = xpByDate.get(dateStr) || 0;
      xpByDate.set(dateStr, currentXP + (row.xp || 0));
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
export async function getStreakInfo(): Promise<StreakData> {
  try {
    const { data, error } = await supabase
      .from('duolingoactivity')
      .select('date')
      .eq('user_id', TARGET_USER_ID)
      .order('date', { ascending: false });

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

    // Get unique dates
    const uniqueDates = Array.from(new Set(data.map(d => new Date(d.date).toISOString().split('T')[0]))).sort().reverse();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if active (activity today)
    const isActive = uniqueDates.includes(today);

    // Start counting from today or yesterday
    let checkDate = isActive ? today : yesterday;

    // If no activity today or yesterday, streak is 0 (unless we want to show broken streak state)
    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
        currentStreak = 0;
    } else {
        for (const date of uniqueDates) {
            if (date === checkDate) {
                currentStreak++;
                const prevDate = new Date(checkDate);
                prevDate.setDate(prevDate.getDate() - 1);
                checkDate = prevDate.toISOString().split('T')[0];
            }
        }
    }

    // Calculate longest streak (simple version)
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDateTimestamp = 0;

    // Re-sort ascending for longest streak calc
    const sortedDatesAsc = [...uniqueDates].reverse();

    sortedDatesAsc.forEach(dateStr => {
        const timestamp = new Date(dateStr).getTime();
        if (prevDateTimestamp === 0) {
            tempStreak = 1;
        } else {
            const diffDays = Math.round((timestamp - prevDateTimestamp) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        prevDateTimestamp = timestamp;
    });

    return {
      currentStreak,
      longestStreak,
      streakGoal: 50, // Default goal
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
export async function getActivityBreakdown(): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('duolingoactivity')
      .select('*')
      .eq('user_id', TARGET_USER_ID)
      .order('date', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || []).map((row, index) => ({
      id: row.id || `activity-${index}`,
      type: (row.event_type || 'practice') as Activity['type'],
      title: row.event_type || 'Lesson',
      description: row.language ? `${row.language} practice` : 'Language practice',
      xpGained: row.xp || 0,
      timestamp: new Date(row.date),
      language: row.language?.toLowerCase() as Language
    }));
  } catch (error) {
    console.error('Error fetching activity breakdown:', error);
    return [];
  }
}

/**
 * Get language summary
 */
export async function getLanguageSummary(): Promise<LanguageStats[]> {
  try {
    const { data, error } = await supabase
      .from('duolingoactivity')
      .select('language, xp, date')
      .eq('user_id', TARGET_USER_ID);

    if (error) throw error;

    const statsMap = new Map<string, LanguageStats>();

    data?.forEach(row => {
      const lang = (row.language || 'unknown').toLowerCase();
      const current = statsMap.get(lang) || {
        language: lang as Language,
        displayName: row.language || 'Unknown',
        totalXP: 0,
        level: 1,
        lessonsCompleted: 0,
        timeSpent: 0,
        streak: 0
      };

      current.totalXP += (row.xp || 0);
      current.lessonsCompleted += 1;
      // Estimate time: 5 mins per lesson/activity
      current.timeSpent += 5;

      statsMap.set(lang, current);
    });

    // Calculate levels
    const stats = Array.from(statsMap.values()).map(stat => ({
      ...stat,
      level: Math.floor(Math.sqrt(stat.totalXP / 100)) + 1
    }));

    return stats;
  } catch (error) {
    console.error('Error fetching language summary:', error);
    return [];
  }
}

