/**
 * XPChart Component
 * Interactive chart for visualizing XP progress over time
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import styles from './XPChart.module.css';
import type {
  ChartType,
  TimePeriod,
  ChartConfig,
  ChartDataPoint,
  ChartTheme,
  XPChartData
} from '@/types/xpChart';
import {
  TIME_PERIODS,
  CHART_TYPES,
  DEFAULT_CHART_CONFIG,
  LIGHT_THEME,
  DARK_THEME,
  TIME_PERIOD_LABELS,
  CHART_TYPE_LABELS
} from '@/types/xpChart';
import {
  processXPData,
  getDataForPeriod,
  addGoalToData,
  formatChartXP,
  calculateChartStats
} from '@/utils/xpChartData';

interface XPChartProps {
  userId?: string;
  initialConfig?: Partial<ChartConfig>;
  goalXP?: number;
  className?: string;
  onPeriodChange?: (period: TimePeriod) => void;
  onTypeChange?: (type: ChartType) => void;
}

export default function XPChart({
  userId,
  initialConfig,
  goalXP,
  className = '',
  onPeriodChange,
  onTypeChange
}: XPChartProps) {
  const [config, setConfig] = useState<ChartConfig>({
    ...DEFAULT_CHART_CONFIG,
    ...initialConfig
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [rawData, setRawData] = useState<ChartDataPoint[]>([]);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    };

    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from API
        const response = await fetch(`/api/dashboard/xp?period=${config.period}&userId=${userId}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data.data)) {
           setRawData(result.data.data);
        } else {
           // Fallback to empty array if no data or error
           setRawData([]);
           if (result.error) console.error('API Error:', result.error);
        }
      } catch (err) {
        setError('Failed to load chart data');
        console.error('Chart data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config.period, userId]);

  // Process data
  const chartData = useMemo(() => {
    const processed = processXPData(rawData, config.period);
    if (config.showGoal && goalXP) {
      return {
        ...processed,
        data: addGoalToData(processed.data, goalXP)
      };
    }
    return processed;
  }, [rawData, config.period, config.showGoal, goalXP]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateChartStats(chartData.data);
  }, [chartData.data]);

  const theme: ChartTheme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  // Event handlers
  const handlePeriodChange = (period: TimePeriod) => {
    setConfig(prev => ({ ...prev, period }));
    onPeriodChange?.(period);
  };

  const handleTypeChange = (type: ChartType) => {
    setConfig(prev => ({ ...prev, type }));
    onTypeChange?.(type);
  };

  const handleGoalToggle = () => {
    setConfig(prev => ({ ...prev, showGoal: !prev.showGoal }));
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={styles.tooltip}
          style={{
            backgroundColor: theme.tooltipBg,
            borderColor: theme.tooltipBorder,
            color: theme.textColor
          }}
        >
          <p className={styles.tooltipLabel}>{label}</p>
          <p className={styles.tooltipValue}>
            <span className={styles.tooltipDot} style={{ backgroundColor: theme.primaryColor }} />
            XP: <strong>{payload[0].value.toLocaleString()}</strong>
          </p>
          {payload[0].payload.goal && (
            <p className={styles.tooltipGoal}>
              <span className={styles.tooltipDot} style={{ backgroundColor: theme.goalColor }} />
              Goal: <strong>{payload[0].payload.goal.toLocaleString()}</strong>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: chartData.data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const xAxisProps = {
      dataKey: 'label' as const,
      stroke: theme.textColor,
      style: { fontSize: '12px' },
      angle: chartData.data.length > 10 ? -45 : 0,
      textAnchor: (chartData.data.length > 10 ? 'end' : 'middle') as 'end' | 'middle',
      height: chartData.data.length > 10 ? 80 : 60
    };

    const yAxisProps = {
      stroke: theme.textColor,
      style: { fontSize: '12px' },
      tickFormatter: formatChartXP
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && <Legend />}
            {config.showGoal && goalXP && (
              <ReferenceLine
                y={goalXP}
                stroke={theme.goalColor}
                strokeDasharray="3 3"
                label={{ value: 'Goal', fill: theme.goalColor, fontSize: 12 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="xp"
              stroke={theme.primaryColor}
              strokeWidth={3}
              dot={{ fill: theme.primaryColor, r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={config.animate ? 1000 : 0}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && <Legend />}
            {config.showGoal && goalXP && (
              <ReferenceLine
                y={goalXP}
                stroke={theme.goalColor}
                strokeDasharray="3 3"
                label={{ value: 'Goal', fill: theme.goalColor, fontSize: 12 }}
              />
            )}
            <defs>
              <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.primaryColor} stopOpacity={0.8} />
                <stop offset="95%" stopColor={theme.primaryColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="xp"
              stroke={theme.primaryColor}
              strokeWidth={2}
              fill="url(#colorXp)"
              animationDuration={config.animate ? 1000 : 0}
            />
          </AreaChart>
        );

      case 'bar':
      default:
        return (
          <BarChart {...commonProps}>
            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && <Legend />}
            {config.showGoal && goalXP && (
              <ReferenceLine
                y={goalXP}
                stroke={theme.goalColor}
                strokeDasharray="3 3"
                label={{ value: 'Goal', fill: theme.goalColor, fontSize: 12 }}
              />
            )}
            <Bar
              dataKey="xp"
              fill={theme.primaryColor}
              radius={[8, 8, 0, 0]}
              animationDuration={config.animate ? 1000 : 0}
            />
          </BarChart>
        );
    }
  };

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.error}>
          <p className={styles.errorIcon}>⚠️</p>
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header with controls */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>XP Progress</h2>
          <p className={styles.subtitle}>{stats.trend.comparison}</p>
        </div>

        <div className={styles.controls}>
          {/* Chart type selector */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Chart Type:</label>
            <div className={styles.buttonGroup}>
              {CHART_TYPES.map(type => (
                <button
                  key={type}
                  className={`${styles.controlButton} ${config.type === type ? styles.active : ''}`}
                  onClick={() => handleTypeChange(type)}
                  aria-label={CHART_TYPE_LABELS[type]}
                  title={CHART_TYPE_LABELS[type]}
                >
                  {type === 'bar' && '📊'}
                  {type === 'line' && '📈'}
                  {type === 'area' && '📉'}
                </button>
              ))}
            </div>
          </div>

          {/* Time period selector */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Period:</label>
            <div className={styles.buttonGroup}>
              {TIME_PERIODS.map(period => (
                <button
                  key={period}
                  className={`${styles.controlButton} ${config.period === period ? styles.active : ''}`}
                  onClick={() => handlePeriodChange(period)}
                >
                  {TIME_PERIOD_LABELS[period]}
                </button>
              ))}
            </div>
          </div>

          {/* Goal toggle */}
          {goalXP && (
            <button
              className={`${styles.goalToggle} ${config.showGoal ? styles.active : ''}`}
              onClick={handleGoalToggle}
              aria-label="Toggle goal line"
              title="Toggle goal line"
            >
              🎯 Goal
            </button>
          )}
        </div>
      </div>

      {/* Stats summary */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total XP</div>
          <div className={styles.statValue}>{stats.total.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Average</div>
          <div className={styles.statValue}>{stats.average.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Peak</div>
          <div className={styles.statValue}>{stats.peak.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Trend</div>
          <div className={`${styles.statValue} ${styles[stats.trend.trend]}`}>
            {stats.trend.trend === 'up' && '↗️'}
            {stats.trend.trend === 'down' && '↘️'}
            {stats.trend.trend === 'stable' && '→'}
            {stats.trend.percentage > 0 ? `${stats.trend.percentage}%` : '—'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={config.height || 400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
