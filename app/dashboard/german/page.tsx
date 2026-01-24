/**
 * German Dashboard Page
 * German-specific progress tracking
 */

'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import XPStatsCard from '@/components/XPStatsCard';
import XPChart from '@/components/XPChart';
import TimeChart from '@/components/TimeChart';
import ViewModeToggle from '@/components/ViewModeToggle';
import { useViewMode } from '@/hooks/useViewMode';
import { useDashboardData } from '@/hooks/useDashboardData';
import styles from '../dashboard.module.css';

export default function GermanDashboardPage() {
  const { viewMode, setViewMode } = useViewMode('grid');
  const { data, loading, error, refetch } = useDashboardData({
    language: 'german',
    autoRefresh: false
  });

  if (loading) {
    return (
      <DashboardLayout language="german">
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading your German dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout language="german">
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
    <DashboardLayout language="german">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🇩🇪 German Dashboard</h1>
            <p className={styles.subtitle}>Track your German learning progress</p>
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
                <h3 className={styles.streakTitle}>German Streak</h3>
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

        {/* Charts Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📈 German Progress</h2>
          <div className={styles.chartsGrid}>
            {data && (
              <XPChart
                userId="default"
                goalXP={350}
                initialConfig={{ period: 'weekly', type: 'line' }}
              />
            )}
            {data?.timeStats && <TimeChart timeStats={data.timeStats} />}
          </div>
        </div>

        {/* Vocabulary Stats */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>💬 Vocabulary</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔤</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>324</div>
                <div className={styles.statLabel}>Words Learned</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>✔️</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>86%</div>
                <div className={styles.statLabel}>Accuracy</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>9</div>
                <div className={styles.statLabel}>Mastered Topics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        {data?.recentActivities && data.recentActivities.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🕒 Recent Activities</h2>
            <div className={styles.activitiesList}>
              {data.recentActivities.slice(0, 8).map((activity) => (
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

        {/* Quick Links */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🔗 Quick Actions</h2>
          <div className={styles.quickLinks}>
            <a href="/german" className={styles.quickLink}>
              <span className={styles.quickLinkIcon}>📚</span>
              <span className={styles.quickLinkText}>Continue Learning</span>
            </a>
            <a href="/german/vocabulary" className={styles.quickLink}>
              <span className={styles.quickLinkIcon}>💬</span>
              <span className={styles.quickLinkText}>Practice Vocabulary</span>
            </a>
            <a href="/german/review" className={styles.quickLink}>
              <span className={styles.quickLinkIcon}>🔄</span>
              <span className={styles.quickLinkText}>Review Lessons</span>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
