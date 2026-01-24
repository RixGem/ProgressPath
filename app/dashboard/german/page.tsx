/**
 * German Dashboard Page
 * Comprehensive German learning progress tracking with new features
 */

'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusCard from '@/components/StatusCard';
import ActivityHeatMap from '@/components/ActivityHeatMap';
import VocabularyProgress from '@/components/VocabularyProgress';
import XPChart from '@/components/XPChart';
import ViewModeToggle from '@/components/ViewModeToggle';
import { useViewMode } from '@/hooks/useViewMode';
import { useLanguageDashboard } from '@/hooks/useLanguageDashboard';
import styles from '../dashboard.module.css';

export default function GermanDashboardPage() {
  const { viewMode, setViewMode } = useViewMode('grid');
  const { data, loading, error, refetch } = useLanguageDashboard('german');

  if (loading) {
    return (
      <DashboardLayout language="german">
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading your German dashboard...</p>
          <p className={styles.loadingSubtext}>Fetching real data from Duolingo</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout language="german">
        <div className={styles.error}>
          <p className={styles.errorIcon}>⚠️</p>
          <h2 className={styles.errorTitle}>Failed to Load Dashboard</h2>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorHint}>Please check your internet connection or try again later.</p>
          <button className={styles.retryButton} onClick={refetch}>
            🔄 Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout language="german">
        <div className={styles.noData}>
          <p className={styles.noDataIcon}>📚</p>
          <h2 className={styles.noDataText}>No German data available yet</h2>
          <p className={styles.noDataHint}>Start learning German on Duolingo to see your progress here!</p>
        </div>
      </DashboardLayout>
    );
  }

  // Format time investment
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <DashboardLayout language="german">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🇩🇪 German Dashboard</h1>
            <p className={styles.subtitle}>Comprehensive German learning progress and analytics</p>
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

        {/* Status Cards - 4 Column Grid */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📊 Quick Stats</h2>
          <div className={`${styles.statusGrid} ${styles[viewMode]}`}>
            <StatusCard
              icon="🎯"
              label="Level Progress"
              value={`Level ${data.level}`}
              subValue={`Virtual: ${data.virtualLevel}`}
            />
            <StatusCard
              icon="✅"
              label="Completion Rate"
              value={`${data.completionRate.toFixed(1)}%`}
              subValue={`${data.activeSkillsCount} active skills`}
            />
            <StatusCard
              icon="🔥"
              label="Current Streak"
              value={data.streakCount}
              subValue="days in a row"
            />
            <StatusCard
              icon="⭐"
              label="Total XP"
              value={data.totalXp.toLocaleString()}
              subValue={`${data.estimatedHours.toFixed(1)} estimated hours`}
            />
          </div>
        </div>

        {/* Time Investment Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>⏰ Time Investment</h2>
          <div className={styles.timeInvestment}>
            <div className={styles.timeCard}>
              <div className={styles.timeIcon}>🕐</div>
              <div className={styles.timeContent}>
                <div className={styles.timeValue}>{data.estimatedHours.toFixed(1)} hrs</div>
                <div className={styles.timeLabel}>Estimated Total Learning Time</div>
              </div>
            </div>
            <div className={styles.timeCard}>
              <div className={styles.timeIcon}>📈</div>
              <div className={styles.timeContent}>
                <div className={styles.timeValue}>{formatTime(data.timeSpentMinutes)}</div>
                <div className={styles.timeLabel}>Actual Time Tracked (Last 30 Days)</div>
              </div>
            </div>
            <div className={styles.timeCard}>
              <div className={styles.timeIcon}>⚡</div>
              <div className={styles.timeContent}>
                <div className={styles.timeValue}>
                  {data.recentActivityHeat.length > 0 
                    ? Math.round(data.timeSpentMinutes / data.recentActivityHeat.filter(d => d.xpGained > 0).length)
                    : 0} min
                </div>
                <div className={styles.timeLabel}>Average Session Length</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Heat Map */}
        <div className={styles.section}>
          <ActivityHeatMap data={data.recentActivityHeat} days={30} />
        </div>

        {/* XP Progress Charts */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📈 XP Progress</h2>
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Daily XP Trends</h3>
              <XPChart
                userId="default"
                goalXP={350}
                initialConfig={{ period: 'weekly', type: 'line' }}
              />
            </div>
            <div className={styles.xpSummary}>
              <h3 className={styles.chartTitle}>XP Summary</h3>
              <div className={styles.xpStats}>
                <div className={styles.xpStat}>
                  <span className={styles.xpStatLabel}>Total XP:</span>
                  <span className={styles.xpStatValue}>{data.totalXp.toLocaleString()}</span>
                </div>
                <div className={styles.xpStat}>
                  <span className={styles.xpStatLabel}>Recent Gain (30d):</span>
                  <span className={styles.xpStatValue}>
                    +{data.xpData.reduce((sum, item) => sum + item.xpGained, 0).toLocaleString()}
                  </span>
                </div>
                <div className={styles.xpStat}>
                  <span className={styles.xpStatLabel}>Daily Average:</span>
                  <span className={styles.xpStatValue}>
                    {data.xpData.length > 0
                      ? Math.round(data.xpData.reduce((sum, item) => sum + item.xpGained, 0) / data.xpData.length)
                      : 0} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vocabulary Progress */}
        <div className={styles.section}>
          <VocabularyProgress 
            totalWords={data.wordsLearned} 
            trends={data.vocabularyTrends}
          />
        </div>

        {/* Recent Activities */}
        {data.recentActivities && data.recentActivities.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🕒 Recent Activities</h2>
            <div className={styles.activitiesList}>
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <span className={styles.activityIcon}>📚</span>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>
                      {activity.lessonsCompleted} lesson{activity.lessonsCompleted !== 1 ? 's' : ''} completed
                    </div>
                    <div className={styles.activityDescription}>
                      {new Date(activity.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      {activity.timeSpentMinutes > 0 && ` • ${formatTime(activity.timeSpentMinutes)}`}
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

        {/* Data Source Indicator */}
        <div className={styles.dataSource}>
          <span>📊 Real-time data from Duolingo • Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </DashboardLayout>
  );
}
