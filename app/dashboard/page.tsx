/**
 * Main Dashboard Page
 * Overview of all learning progress
 */

'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import XPStatsCard from '@/components/XPStatsCard';
import XPChart from '@/components/XPChart';
import TimeChart from '@/components/TimeChart';
import ViewModeToggle from '@/components/ViewModeToggle';
import { useViewMode } from '@/hooks/useViewMode';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { ViewMode } from '@/types/viewMode';
import type { LanguageStats } from '@/types/dashboard';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { viewMode, setViewMode } = useViewMode('grid');
  const { data, loading, error, refetch } = useDashboardData({
    language: 'all',
    autoRefresh: false
  });

  // Mock language stats
  const languageStats: LanguageStats[] = [
    {
      language: 'french',
      displayName: 'French',
      totalXP: 2450,
      level: 12,
      lessonsCompleted: 45,
      timeSpent: 1840,
      streak: 7
    },
    {
      language: 'german',
      displayName: 'German',
      totalXP: 1890,
      level: 9,
      lessonsCompleted: 32,
      timeSpent: 1320,
      streak: 5
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.error}>
          <p className={styles.errorIcon}>⚠️</p>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={refetch}>
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
            <p className={styles.subtitle}>Track your learning progress across all languages</p>
          </div>
          
          <div className={styles.headerActions}>
            <ViewModeToggle
              currentMode={viewMode}
              availableModes={['grid', 'list']}
              onModeChange={setViewMode}
              size="medium"
            />
            <button className={styles.refreshButton} onClick={refetch}>
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
                      width: `${(data.streakData.currentStreak / data.streakData.streakGoal) * 100}%`
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
            {languageStats.map((lang) => (
              <a
                key={lang.language}
                href={`/dashboard/${lang.language}`}
                className={styles.languageCard}
              >
                <div className={styles.languageHeader}>
                  <span className={styles.languageFlag}>
                    {lang.language === 'french' ? '🇫🇷' : '🇩🇪'}
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
                    <span className={styles.statLabel}>Streak</span>
                    <span className={styles.statValue}>🔥 {lang.streak}</span>
                  </div>
                </div>
                <div className={styles.languageFooter}>
                  <span>{lang.lessonsCompleted} lessons</span>
                  <span>→</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📈 Progress Charts</h2>
          <div className={styles.chartsGrid}>
            {data && (
              <XPChart
                userId="default"
                goalXP={500}
                initialConfig={{ period: 'weekly', type: 'area' }}
              />
            )}
            {data?.timeStats && <TimeChart timeStats={data.timeStats} />}
          </div>
        </div>

        {/* Recent Activities */}
        {data?.recentActivities && data.recentActivities.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🕒 Recent Activities</h2>
            <div className={styles.activitiesList}>
              {data.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <span className={styles.activityIcon}>
                    {activity.type === 'lesson' && '📚'}
                    {activity.type === 'practice' && '✍️'}
                    {activity.type === 'review' && '🔄'}
                    {activity.type === 'achievement' && '🏆'}
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
