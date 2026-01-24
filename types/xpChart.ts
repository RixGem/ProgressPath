/**
 * TypeScript types for XP Chart visualization
 */

export type ChartType = 'bar' | 'line' | 'area';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ChartDataPoint {
  date: string;
  xp: number;
  label: string;
  timestamp?: number;
  goal?: number;
}

export interface XPChartData {
  data: ChartDataPoint[];
  totalXP: number;
  averageXP: number;
  peakXP: number;
  period: TimePeriod;
}

export interface ChartGoal {
  value: number;
  label: string;
  color?: string;
  enabled: boolean;
}

export interface ChartConfig {
  type: ChartType;
  period: TimePeriod;
  showGoal: boolean;
  goal?: ChartGoal;
  showGrid: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  animate: boolean;
  height?: number;
}

export interface ChartTheme {
  primaryColor: string;
  secondaryColor: string;
  goalColor: string;
  gridColor: string;
  textColor: string;
  tooltipBg: string;
  tooltipBorder: string;
}

export interface XPTrendData {
  trend: 'up' | 'down' | 'stable';
  percentage: number;
  comparison: string;
}

export interface ChartStats {
  total: number;
  average: number;
  peak: number;
  lowest: number;
  trend: XPTrendData;
}

export const CHART_TYPES: readonly ChartType[] = ['bar', 'line', 'area'] as const;

export const TIME_PERIODS: readonly TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly'
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  area: 'Area Chart'
};

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  period: 'weekly',
  showGoal: true,
  showGrid: true,
  showTooltip: true,
  showLegend: true,
  animate: true,
  height: 400
};

export const LIGHT_THEME: ChartTheme = {
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  goalColor: '#f59e0b',
  gridColor: '#e5e7eb',
  textColor: '#374151',
  tooltipBg: '#ffffff',
  tooltipBorder: '#d1d5db'
};

export const DARK_THEME: ChartTheme = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#6366f1',
  goalColor: '#fbbf24',
  gridColor: '#374151',
  textColor: '#e5e7eb',
  tooltipBg: '#1f2937',
  tooltipBorder: '#4b5563'
};
