/**
 * Custom hook for fetching dashboard data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardData, Language } from '@/types/dashboard';
import type { TimePeriod } from '@/types/xpChart';

interface UseDashboardDataOptions {
  userId?: string;
  language?: Language;
  period?: TimePeriod;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updatePeriod: (period: TimePeriod) => void;
}

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const {
    userId = 'default-user',
    language,
    period = 'weekly',
    autoRefresh = false,
    refreshInterval = 60000 // 1 minute
  } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState(period);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        userId,
        period: currentPeriod
      });

      if (language && language !== 'all') {
        params.append('language', language);
      }

      // Determine endpoint based on language
      let endpoint = '/api/dashboard/xp';
      if (language === 'french') {
        endpoint = '/api/dashboard/french/xp';
      } else if (language === 'german') {
        endpoint = '/api/dashboard/german/xp';
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Transform API response to DashboardData format
        const dashboardData: DashboardData = {
          xpStats: result.data.stats || { totalXP: 0, level: 1, progress: 0, currentLevelXP: 0, nextLevelXP: 100 },
          chartData: result.data.chartData || [],
          recentActivities: result.data.activities || [],
          timeStats: result.data.timeStats || { totalMinutes: 0, todayMinutes: 0, weekMinutes: 0, monthMinutes: 0, averageDaily: 0 },
          streakData: result.data.streakData || { currentStreak: 0, longestStreak: 0, streakGoal: 30, isActive: false, lastActivityDate: new Date() },
          language
        };

        setData(dashboardData);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, language, currentPeriod]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  const updatePeriod = useCallback((newPeriod: TimePeriod) => {
    setCurrentPeriod(newPeriod);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updatePeriod
  };
}
