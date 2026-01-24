/**
 * Utility functions for processing XP chart data
 */

import type { 
  ChartDataPoint, 
  XPChartData, 
  TimePeriod, 
  XPTrendData,
  ChartStats 
} from '@/types/xpChart';

/**
 * Format date based on time period
 */
export function formatDateForPeriod(date: Date, period: TimePeriod): string {
  switch (period) {
    case 'daily':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    case 'yearly':
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Generate mock XP data for a given time period
 * In production, this would fetch real data from the API
 */
export function generateMockXPData(period: TimePeriod, days: number = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Generate random XP between 50 and 500 with some variability
    const baseXP = 200;
    const variance = Math.random() * 300;
    const xp = Math.round(baseXP + variance);
    
    data.push({
      date: date.toISOString().split('T')[0],
      xp,
      label: formatDateForPeriod(date, period),
      timestamp: date.getTime()
    });
  }
  
  return data;
}

/**
 * Aggregate data based on time period
 */
export function aggregateDataByPeriod(
  rawData: ChartDataPoint[],
  period: TimePeriod
): ChartDataPoint[] {
  if (period === 'daily') {
    return rawData;
  }
  
  const aggregated = new Map<string, { xp: number; count: number; date: Date }>();
  
  rawData.forEach(point => {
    const date = new Date(point.date);
    let key: string;
    
    switch (period) {
      case 'weekly':
        // Group by week (Sunday to Saturday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        key = date.getFullYear().toString();
        break;
      default:
        key = point.date;
    }
    
    const existing = aggregated.get(key);
    if (existing) {
      existing.xp += point.xp;
      existing.count++;
    } else {
      aggregated.set(key, { xp: point.xp, count: 1, date });
    }
  });
  
  return Array.from(aggregated.entries()).map(([key, value]) => ({
    date: key,
    xp: value.xp,
    label: formatDateForPeriod(value.date, period),
    timestamp: value.date.getTime()
  })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

/**
 * Calculate XP statistics
 */
export function calculateChartStats(data: ChartDataPoint[]): ChartStats {
  if (data.length === 0) {
    return {
      total: 0,
      average: 0,
      peak: 0,
      lowest: 0,
      trend: { trend: 'stable', percentage: 0, comparison: 'No data available' }
    };
  }
  
  const xpValues = data.map(d => d.xp);
  const total = xpValues.reduce((sum, xp) => sum + xp, 0);
  const average = Math.round(total / data.length);
  const peak = Math.max(...xpValues);
  const lowest = Math.min(...xpValues);
  
  const trend = calculateTrend(data);
  
  return {
    total,
    average,
    peak,
    lowest,
    trend
  };
}

/**
 * Calculate trend from data
 */
export function calculateTrend(data: ChartDataPoint[]): XPTrendData {
  if (data.length < 2) {
    return { trend: 'stable', percentage: 0, comparison: 'Not enough data' };
  }
  
  // Compare first half vs second half
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.xp, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.xp, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  const percentage = Math.abs(Math.round((difference / firstAvg) * 100));
  
  let trend: 'up' | 'down' | 'stable';
  let comparison: string;
  
  if (Math.abs(difference) < firstAvg * 0.05) {
    trend = 'stable';
    comparison = 'No significant change';
  } else if (difference > 0) {
    trend = 'up';
    comparison = `Up ${percentage}% from previous period`;
  } else {
    trend = 'down';
    comparison = `Down ${percentage}% from previous period`;
  }
  
  return { trend, percentage, comparison };
}

/**
 * Process raw XP data into chart-ready format
 */
export function processXPData(
  rawData: ChartDataPoint[],
  period: TimePeriod
): XPChartData {
  const aggregatedData = aggregateDataByPeriod(rawData, period);
  const stats = calculateChartStats(aggregatedData);
  
  return {
    data: aggregatedData,
    totalXP: stats.total,
    averageXP: stats.average,
    peakXP: stats.peak,
    period
  };
}

/**
 * Get data for specific time period
 */
export function getDataForPeriod(period: TimePeriod): ChartDataPoint[] {
  const daysMap: Record<TimePeriod, number> = {
    daily: 30,
    weekly: 84, // 12 weeks
    monthly: 365, // 12 months
    yearly: 1825 // 5 years
  };
  
  return generateMockXPData(period, daysMap[period]);
}

/**
 * Add goal line to chart data
 */
export function addGoalToData(
  data: ChartDataPoint[],
  goalValue: number
): ChartDataPoint[] {
  return data.map(point => ({
    ...point,
    goal: goalValue
  }));
}

/**
 * Calculate percentage of goal achieved
 */
export function calculateGoalProgress(
  totalXP: number,
  goalXP: number
): number {
  if (goalXP <= 0) return 0;
  return Math.min(100, Math.round((totalXP / goalXP) * 100));
}

/**
 * Format XP number for display
 */
export function formatChartXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}

/**
 * Get color based on XP value and goal
 */
export function getColorForValue(
  value: number,
  goal?: number,
  primaryColor: string = '#667eea',
  successColor: string = '#10b981'
): string {
  if (goal && value >= goal) {
    return successColor;
  }
  return primaryColor;
}

/**
 * Smooth data using moving average
 */
export function smoothData(
  data: ChartDataPoint[],
  windowSize: number = 3
): ChartDataPoint[] {
  if (data.length < windowSize) return data;
  
  return data.map((point, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const window = data.slice(start, end);
    const smoothedXP = Math.round(
      window.reduce((sum, p) => sum + p.xp, 0) / window.length
    );
    
    return {
      ...point,
      xp: smoothedXP
    };
  });
}
