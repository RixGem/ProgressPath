/**
 * Main Dashboard Page
 * Overview of all learning progress
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import XPStatsCard from '@/components/XPStatsCard';
import XPChart from '@/components/XPChart';
import TimeChart from '@/components/TimeChart';
import ViewModeToggle from '@/components/ViewModeToggle';
import { useViewMode } from '@/hooks/useViewMode';
import styles from './dashboard.module.css';
import { getDailyXP, getStreakInfo, getActivityBreakdown, getLanguageSummary } from '@/lib/db/queries';
import { getXPStats } from '@/utils/xpCalculations';
import type { DashboardData, LanguageStats, StreakData, Activity, TimeStats } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { viewMode, setViewMode } = useViewMode('grid');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<{
    xpStats: any;
    chartData: any[];
    streakData: StreakData | null;
    recentActivities: Activity[];
    languageStats: LanguageStats[];
    timeStats: TimeStats;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const userId = user.id;

      // Fetch all data in parallel using the dynamic userId
      const [dailyXP, streakInfo, activities, languages] = await Promise.all([
        getDailyXP(userId, 'weekly'),
        getStreakInfo(userId),
        getActivityBreakdown(userId),
        getLanguageSummary(userId)
      ]);

      // Calculate aggregated stats
      const totalXP = languages.reduce((sum, lang) => sum + lang.totalXP, 0);
      const xpStats = getXPStats(totalXP);

      // Calculate time stats (estimate based on language summary)
      const totalMinutes = languages.reduce((sum, lang) => sum + lang.timeSpent, 0);
      const timeStats: TimeStats = {
        totalMinutes,
        todayMinutes: 0, // Would need daily breakdown for this
        weekMinutes: 0, // Would need weekly breakdown
        monthMinutes: 0,
        averageDaily: Math.round(totalMinutes / (streakInfo.currentStreak || 1))
      };

      setData({
        xpStats,
        chartData: dailyXP,
        streakData: streakInfo,
        recentActivities: activities,
        languageStats: languages,
        timeStats
      });

    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading your learning progress...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={fetchData}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard Overview</h1>
            <p className={styles.subtitle}>Track your real-time Duolingo progress</p>
          </div>

          <div className={styles.headerActions}>
            <ViewModeToggle
              currentMode={viewMode}
              availableModes={['grid', 'list']}
              onModeChange={setViewMode}
              size="medium"
            />
            <button className={styles.refreshButton} onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`${styles.statsGrid} ${styles[viewMode]}`}>
          {data && (
            <XPStatsCard
              stats={data.xpStats}
              showDetails={true}
              animated={true}
            />
          )}

          {/* Streak Card */}
          {data?.streakData && (
            <div className={styles.streakCard}>
              <div className={styles.streakHeader}>
                <span className={styles.streakIcon}>🔥</span>
                <h3 className={styles.streakTitle}>Streak</h3>
              </div>
              <div className={styles.streakValue}>{data.streakData.currentStreak}</div>
              <div className={styles.streakLabel}>days in a row</div>
              <div className={styles.streakProgress}>
                <div className={styles.streakProgressBar}>
                  <div
                    className={styles.streakProgressFill}
                    style={{
                      width: `${Math.min((data.streakData.currentStreak / data.streakData.streakGoal) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className={styles.streakGoal}>
                  Goal: {data.streakData.streakGoal} days
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Language Stats */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🌍 Languages</h2>
          <div className={styles.languageGrid}>
            {data?.languageStats.map((lang) => (
              <div
                key={lang.language}
                className={styles.languageCard}
              >
                <div className={styles.languageHeader}>
                  <span className={styles.languageFlag}>
                    {lang.language.toLowerCase().includes('french') ? '🇫🇷' :
                     lang.language.toLowerCase().includes('german') ? '🇩🇪' : '🏳️'}
                  </span>
                  <h3 className={styles.languageName}>{lang.displayName}</h3>
                </div>
                <div className={styles.languageStats}>
                  <div className={styles.languageStat}>
                    <span className={styles.statLabel}>Level</span>
                    <span className={styles.statValue}>{lang.level}</span>
                  </div>
                  <div className={styles.languageStat}>
                    <span className={styles.statLabel}>XP</span>
                    <span className={styles.statValue}>{lang.totalXP.toLocaleString()}</span>
                  </div>
                  <div className={styles.languageStat}>
                    <span className={styles.statLabel}>Est. Time</span>
                    <span className={styles.statValue}>{Math.round(lang.timeSpent / 60)}h</span>
                  </div>
                </div>
                <div className={styles.languageFooter}>
                  <span>{lang.lessonsCompleted} activities</span>
                  {/* Link removed as these are now summary cards */}
                </div>
              </div>
            ))}
            {(!data?.languageStats || data.languageStats.length === 0) && (
              <div className={styles.emptyState}>
                <p>No language data found yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📈 Progress Charts</h2>
          <div className={styles.chartsGrid}>
            {data && user && (
              <XPChart
                userId={user.id}
                goalXP={50}
                initialConfig={{ period: 'weekly', type: 'area' }}
              />
            )}
            {/* TimeChart might be less useful with estimated data, but keeping for layout consistency */}
            {data?.timeStats && <TimeChart timeStats={data.timeStats} />}
          </div>
        </div>

        {/* Recent Activities */}
        {data?.recentActivities && data.recentActivities.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🕒 Recent Activities</h2>
            <div className={styles.activitiesList}>
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <span className={styles.activityIcon}>
                    {activity.type === 'lesson' ? '📚' :
                     activity.type === 'practice' ? '✍️' :
                     activity.type === 'review' ? '🔄' : '🏆'}
                  </span>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>{activity.title}</div>
                    <div className={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.activityXP}>+{activity.xpGained} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


