/**
 * VocabularyProgress Component
 * Displays vocabulary learning progress with trends
 */

import React from 'react';
import styles from './VocabularyProgress.module.css';

interface VocabularyData {
  date: string;
  wordsLearned: number;
}

interface VocabularyProgressProps {
  totalWords: number;
  trends: VocabularyData[];
}

export default function VocabularyProgress({ totalWords, trends }: VocabularyProgressProps) {
  // Calculate weekly average
  const weeklyAverage = trends.length > 0 
    ? Math.round(trends.reduce((sum, item) => sum + item.wordsLearned, 0) / Math.min(trends.length, 7))
    : 0;

  // Get recent growth
  const recentGrowth = trends.length >= 7
    ? trends.slice(-7).reduce((sum, item) => sum + item.wordsLearned, 0)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>📚 Vocabulary Progress</h3>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{totalWords}</div>
          <div className={styles.statLabel}>Total Words Learned</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>{weeklyAverage}</div>
          <div className={styles.statLabel}>Weekly Average</div>
        </div>

        <div className={styles.stat}>
          <div className={styles.statValue}>+{recentGrowth}</div>
          <div className={styles.statLabel}>Last 7 Days</div>
        </div>
      </div>

      <div className={styles.chart}>
        <div className={styles.bars}>
          {trends.slice(-14).map((item, index) => {
            const maxWords = Math.max(...trends.map(t => t.wordsLearned));
            const height = maxWords > 0 ? (item.wordsLearned / maxWords) * 100 : 0;
            
            return (
              <div key={index} className={styles.barWrapper}>
                <div 
                  className={styles.bar}
                  style={{ height: `${height}%` }}
                  title={`${new Date(item.date).toLocaleDateString()}: ${item.wordsLearned} words`}
                >
                  <span className={styles.barTooltip}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br />
                    {item.wordsLearned} words
                  </span>
                </div>
                <div className={styles.barLabel}>
                  {new Date(item.date).getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
