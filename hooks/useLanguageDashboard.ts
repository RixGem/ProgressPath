/**
 * useLanguageDashboard Hook
 * Custom hook for fetching language-specific dashboard data from new API endpoints
 */

import { useState, useEffect, useCallback } from 'react';

export interface LanguageDashboardData {
  // Status Cards Data
  level: number;
  virtualLevel: number;
  completionRate: number;
  activeSkillsCount: number;
  streakCount: number;
  totalXp: number;
  
  // Time Investment
  estimatedHours: number;
  timeSpentMinutes: number;
  
  // Activity Heat Map
  recentActivityHeat: Array<{
    date: string;
    xpGained: number;
    lessonsCompleted: number;
    timeSpent: number;
    activityHeat: number;
  }>;
  
  // XP Progress
  xpData: Array<{
    date: string;
    xpGained: number;
    totalXp: number;
  }>;
  
  // Vocabulary Progress
  wordsLearned: number;
  vocabularyTrends: Array<{
    date: string;
    wordsLearned: number;
  }>;
  
  // Recent Activities
  recentActivities: Array<{
    id: string;
    date: string;
    xpGained: number;
    lessonsCompleted: number;
    timeSpentMinutes: number;
  }>;
}

interface UseLanguageDashboardResult {
  data: LanguageDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLanguageDashboard(language: string): UseLanguageDashboardResult {
  const [data, setData] = useState<LanguageDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch data from all new API endpoints in parallel
      const [virtualLevelRes, completionRes, skillsRes, heatmapRes, xpRes] = await Promise.all([
        fetch(`/api/dashboard/${language}/virtual-level`),
        fetch(`/api/dashboard/${language}/completion`),
        fetch(`/api/dashboard/${language}/skills`),
        fetch(`/api/dashboard/${language}/heatmap?days=30`),
        fetch(`/api/dashboard/${language}/xp?days=30`)
      ]);

      if (!virtualLevelRes.ok || !completionRes.ok || !skillsRes.ok || !heatmapRes.ok || !xpRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const virtualLevelData = await virtualLevelRes.json();
      const completionData = await completionRes.json();
      const skillsData = await skillsRes.json();
      const heatmapData = await heatmapRes.json();
      const xpData = await xpRes.json();

      // Combine data into unified structure
      const combinedData: LanguageDashboardData = {
        level: virtualLevelData.data?.level || 0,
        virtualLevel: virtualLevelData.data?.virtualLevel || 0,
        completionRate: completionData.data?.completionRate || 0,
        activeSkillsCount: skillsData.data?.activeSkillsCount || 0,
        streakCount: xpData.summary?.streakCount || 0,
        totalXp: virtualLevelData.data?.totalXp || 0,
        estimatedHours: virtualLevelData.data?.estimatedHours || 0,
        timeSpentMinutes: heatmapData.summary?.totalTimeSpent || 0,
        recentActivityHeat: heatmapData.data || [],
        xpData: xpData.data || [],
        wordsLearned: xpData.summary?.wordsLearned || 0,
        vocabularyTrends: xpData.data?.map((item: any) => ({
          date: item.date,
          wordsLearned: item.wordsLearned || 0
        })) || [],
        recentActivities: (xpData.data || []).slice(0, 10).map((item: any) => ({
          id: item.id || `${item.date}-${item.xpGained}`,
          date: item.date,
          xpGained: item.xpGained,
          lessonsCompleted: item.lessonsCompleted || 0,
          timeSpentMinutes: item.timeSpentMinutes || 0
        }))
      };

      setData(combinedData);
    } catch (err) {
      console.error('Error fetching language dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
