/**
 * Main Dashboard Page - Now with Real Duolingo Data
 * Overview of all learning progress from actual Supabase data
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import XPStatsCard from '@/components/XPStatsCard';
import XPChart from '@/components/XPChart';
import TimeChart from '@/components/TimeChart';
import ViewModeToggle from '@/components/ViewModeToggle';
import { useViewMode } from '@/hooks/useViewMode';
import { useDashboardData } from '@/hooks/useDashboardData';
import { getLatestActivity } from '@/lib/db/queries';
import type { ViewMode } from '@/types/viewMode';
import type { LanguageStats } from '@/types/dashboard';
import styles from './dashboard.module.css';

// Default user ID for queries
const DEFAULT_USER_ID = 'f484bfe8-2771-4e0f-b765-830fbdb3c74e';

export default function DashboardPage() {
  const { viewMode, setViewMode } = useViewMode('grid');
  const { data, loading, error, refetch } = useDashboardData({
    userId: DEFAULT_USER_ID,
    language: 'all',
    autoRefresh: false
  });

  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [loadingLanguageStats, setLoadingLanguageStats] = useState(true);

  // Fetch real language-specific stats
  useEffect(() => {
    async function fetchLanguageStats() {
      try {
        setLoadingLanguageStats(true);
        
        // Fetch stats for each language
        const [frenchActivity, germanActivity] = await Promise.all([
          getLatestActivity(DEFAULT_USER_ID, 'french'),
          getLatestActivity(DEFAULT_USER_ID, 'german')
        ]);

        const stats: LanguageStats[] = [];

        // Add French stats if data exists
        if (frenchActivity) {
          stats.push({
            language: 'french',
            displayName: 'French',
            totalXP: frenchActivity.total_xp || 0,
            level: frenchActivity.level || 1,
            lessonsCompleted: frenchActivity.lessons_completed || 0,
            timeSpent: frenchActivity.time_spent_minutes || 0,
            streak: frenchActivity.streak_count || 0
          });
        }

        // Add German stats if data exists
        if (germanActivity) {
          stats.push({
            language: 'german',
            displayName: 'German',
            totalXP: germanActivity.total_xp || 0,
            level: germanActivity.level || 1,
            lessonsCompleted: germanActivity.lessons_completed || 0,
            timeSpent: germanActivity.time_spent_minutes || 0,
            streak: germanActivity.streak_count || 0
          });
        }

        setLanguageStats(stats);
      } catch (err) {
        console.error('Error fetching language stats:', err);
        // Set empty array on error to show "no data" state
        setLanguageStats([]);
      } finally {
        setLoadingLanguageStats(false);
      }
    }

    fetchLanguageStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading your dashboard...</p>
          <p className={styles.loadingSubtext}>Fetching real data from Duolingo</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className={styles.error}>
          <p className={styles.errorIcon}>⚠️</p>
          <h3 className={styles.errorTitle}>Failed to Load Dashboard</h3>
          <p className={styles.errorMessage}>{error}</p>
          <p className={styles.errorHint}>
            Please check your internet connection or try again later.
          </p>
          <button className={styles.retryButton} onClick={refetch}>
            🔄 Retry
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
            <p className={styles.subtitle}>
              Real-time progress from your Duolingo account
            </p>
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
                <span className={styles.streakIcon}>
                  {data.streakData.isActive ? '🔥' : '❄️'}
                </span>
                <h3 className={styles.streakTitle}>
                  {data.streakData.isActive ? 'Active Streak' : 'Streak Frozen'}
                </h3>
              </div>
              <div className={styles.streakValue}>
                {data.streakData.currentStreak}
              </div>
              <div className={styles.streakLabel}>days in a row</div>
              {data.streakData.currentStreak > 0 && (
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
              )}
              {data.streakData.lastActivityDate && (
                <div className={styles.streakLastActive}>
                  Last active: {new Date(data.streakData.lastActivityDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Language Stats */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🌍 Languages</h2>
          
          {loadingLanguageStats ? (
            <div className={styles.loadingLanguages}>
              <div className={styles.spinner} />
              <p>Loading language statistics...</p>
            </div>
          ) : languageStats.length > 0 ? (
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
                      <span className={styles.statValue}>
                        {lang.totalXP.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.languageStat}>
                      <span className={styles.statLabel}>Streak</span>
                      <span className={styles.statValue}>
                        {lang.streak > 0 ? `🔥 ${lang.streak}` : '—'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.languageFooter}>
                    <span>{lang.lessonsCompleted} lessons completed</span>
                    <span>→</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>
              <p className={styles.noDataIcon}>📚</p>
              <p className={styles.noDataText}>No language data available yet</p>
              <p className={styles.noDataHint}>
                Start learning a language on Duolingo to see your progress here!
              </p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        {data && data.chartData && data.chartData.length > 0 ? (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📈 Progress Charts</h2>
            <div className={styles.chartsGrid}>
              <XPChart
                userId={DEFAULT_USER_ID}
                goalXP={500}
                initialConfig={{ period: 'weekly', type: 'area' }}
              />
              {data.timeStats && <TimeChart timeStats={data.timeStats} />}
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📈 Progress Charts</h2>
            <div className={styles.noData}>
              <p className={styles.noDataIcon}>📊</p>
              <p className={styles.noDataText}>Not enough data for charts yet</p>
              <p className={styles.noDataHint}>
                Complete a few lessons to start seeing your progress visualization!
              </p>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        {data?.recentActivities && data.recentActivities.length > 0 ? (
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
                    <div className={styles.activityDescription}>
                      {activity.description}
                    </div>
                    <div className={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={styles.activityXP}>
                    +{activity.xpGained} XP
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>🕒 Recent Activities</h2>
            <div className={styles.noData}>
              <p className={styles.noDataIcon}>🎯</p>
              <p className={styles.noDataText}>No recent activities</p>
              <p className={styles.noDataHint}>
                Your learning activities will appear here as you progress!
              </p>
            </div>
          </div>
        )}

        {/* Data Source Indicator */}
        <div className={styles.dataSource}>
          <small>
            ✨ Data synced from Duolingo API • Last updated: {new Date().toLocaleTimeString()}
          </small>
        </div>
      </div>
    </DashboardLayout>
  );
}
