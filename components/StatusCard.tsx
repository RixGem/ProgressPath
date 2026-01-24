/**
 * StatusCard Component
 * Displays a single status metric with icon and value
 */

import React from 'react';
import styles from './StatusCard.module.css';

interface StatusCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatusCard({ 
  icon, 
  label, 
  value, 
  subValue, 
  trend, 
  trendValue 
}: StatusCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
      </div>
      
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {subValue && <div className={styles.subValue}>{subValue}</div>}
        
        {trend && trendValue && (
          <div className={`${styles.trend} ${styles[trend]}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
            {' '}{trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
