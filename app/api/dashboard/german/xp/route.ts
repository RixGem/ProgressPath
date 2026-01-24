/**
 * Next.js API Route for fetching German XP data
 * GET /api/dashboard/german/xp
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TimePeriod } from '@/types/xpChart';
import { getDailyXP, getStreakInfo, getActivityBreakdown } from '@/lib/db/queries';
import { getXPStats } from '@/utils/xpCalculations';

/**
 * GET handler for German XP data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default-user';
    const period = (searchParams.get('period') as TimePeriod) || 'weekly';

    // Validate period
    const validPeriods: TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: daily, weekly, monthly, yearly' },
        { status: 400 }
      );
    }

    // Fetch German-specific dashboard data
    const [chartData, streakData, activities] = await Promise.all([
      getDailyXP(period, 'German'),
      getStreakInfo('German'),
      getActivityBreakdown('German')
    ]);

    // Calculate total XP for German
    const totalXP = chartData.reduce((sum, point) => sum + point.xp, 0);
    const xpStats = getXPStats(totalXP);

    const timeStats = {
      totalMinutes: Math.round(totalXP / 10),
      todayMinutes: 0,
      weekMinutes: 0,
      monthMinutes: 0,
      averageDaily: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        stats: xpStats,
        chartData,
        activities,
        timeStats,
        streakData
      },
      metadata: {
        userId,
        language: 'german',
        period,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching German XP data:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for adding German XP data points
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, xp, activityType, description } = body;

    if (!userId || typeof xp !== 'number' || !activityType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, xp, activityType' },
        { status: 400 }
      );
    }

    if (xp < 0) {
      return NextResponse.json(
        { error: 'XP amount must be non-negative' },
        { status: 400 }
      );
    }

    // TODO: Save to database with language tag
    // const result = await saveXPActivity(userId, xp, activityType, description, 'german');

    return NextResponse.json({
      success: true,
      message: 'German XP added successfully',
      data: {
        xp,
        activityType,
        language: 'german',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding German XP data:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
