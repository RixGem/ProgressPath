/**
 * TimeChart Component
 * Displays time-based progress tracking
 */

'use client';

import React from 'react';
import styles from './TimeChart.module.css';
import type { TimeStats } from '@/types/dashboard';

interface TimeChartProps {
  timeStats: TimeStats;
  className?: string;
}

export default function TimeChart({ timeStats, className = '' }: TimeChartProps) {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const timeData = [
    {
      label: 'Today',
      value: timeStats.todayMinutes,
      icon: '📅',
      color: '#667eea',
      percentage: (timeStats.todayMinutes / 180) * 100 // 3 hours goal
    },
    {
      label: 'This Week',
      value: timeStats.weekMinutes,
      icon: '📆',
      color: '#f59e0b',
      percentage: (timeStats.weekMinutes / 1260) * 100 // 21 hours goal
    },
    {
      label: 'This Month',
      value: timeStats.monthMinutes,
      icon: '📆',
      color: '#10b981',
      percentage: (timeStats.monthMinutes / 5400) * 100 // 90 hours goal
    },
    {
      label: 'Daily Avg',
      value: timeStats.averageDaily,
      icon: '⏱️',
      color: '#8b5cf6',
      percentage: (timeStats.averageDaily / 180) * 100
    }
  ];

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>⏰ Time Spent</h3>
        <p className={styles.subtitle}>
          Total: <strong>{formatTime(timeStats.totalMinutes)}</strong>
        </p>
      </div>

      <div className={styles.grid}>
        {timeData.map((item, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </div>
            
            <div className={styles.value}>{formatTime(item.value)}</div>
            
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, item.percentage)}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            
            <div className={styles.percentage}>
              {Math.round(Math.min(100, item.percentage))}% of goal
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
