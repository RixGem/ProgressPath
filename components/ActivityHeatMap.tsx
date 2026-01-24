/**
 * ActivityHeatMap Component
 * Displays a heat map of recent learning activity
 */

import React from 'react';
import styles from './ActivityHeatMap.module.css';

interface ActivityData {
  date: string;
  xpGained: number;
  lessonsCompleted: number;
  timeSpent: number;
  activityHeat: number;
}

interface ActivityHeatMapProps {
  data: ActivityData[];
  days?: number;
}

export default function ActivityHeatMap({ data, days = 30 }: ActivityHeatMapProps) {
  // Calculate heat level (0-4) based on activity
  const getHeatLevel = (activityHeat: number): number => {
    if (activityHeat === 0) return 0;
    if (activityHeat < 0.25) return 1;
    if (activityHeat < 0.5) return 2;
    if (activityHeat < 0.75) return 3;
    return 4;
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get day of week
  const getDayOfWeek = (dateStr: string): number => {
    return new Date(dateStr).getDay();
  };

  // Organize data into weeks
  const organizeIntoWeeks = () => {
    const weeks: ActivityData[][] = [];
    let currentWeek: ActivityData[] = [];

    data.forEach((item, index) => {
      currentWeek.push(item);
      
      // Start new week on Sunday or when current week has 7 days
      if (getDayOfWeek(item.date) === 6 || currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = organizeIntoWeeks();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>🔥 Activity Heat Map</h3>
        <p className={styles.subtitle}>Last {days} days of learning activity</p>
      </div>

      <div className={styles.heatmap}>
        <div className={styles.weekLabels}>
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        <div className={styles.grid}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className={styles.week}>
              {week.map((day) => {
                const heatLevel = getHeatLevel(day.activityHeat);
                return (
                  <div
                    key={day.date}
                    className={`${styles.day} ${styles[`heat${heatLevel}`]}`}
                    title={`${formatDate(day.date)}: ${day.xpGained} XP, ${day.lessonsCompleted} lessons, ${day.timeSpent} min`}
                  >
                    <span className={styles.dayTooltip}>
                      {formatDate(day.date)}<br />
                      {day.xpGained} XP<br />
                      {day.lessonsCompleted} lessons<br />
                      {day.timeSpent} minutes
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={`${styles.legendItem} ${styles.heat0}`} />
        <div className={`${styles.legendItem} ${styles.heat1}`} />
        <div className={`${styles.legendItem} ${styles.heat2}`} />
        <div className={`${styles.legendItem} ${styles.heat3}`} />
        <div className={`${styles.legendItem} ${styles.heat4}`} />
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  );
}
