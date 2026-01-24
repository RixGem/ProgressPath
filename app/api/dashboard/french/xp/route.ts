/**
 * Next.js API Route for fetching French XP data
 * GET /api/dashboard/french/xp
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TimePeriod } from '@/types/xpChart';
import { fetchDashboardData } from '@/lib/db/queries';

/**
 * GET handler for French XP data
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

    // TODO: Implement authentication check
    // const session = await getSession(request);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch French-specific dashboard data
    const dashboardData = await fetchDashboardData(userId, 'french');

    return NextResponse.json({
      success: true,
      data: {
        stats: dashboardData.xpStats,
        chartData: dashboardData.chartData,
        activities: dashboardData.recentActivities,
        timeStats: dashboardData.timeStats,
        streakData: dashboardData.streakData
      },
      metadata: {
        userId,
        language: 'french',
        period,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching French XP data:', error);
    
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
 * POST handler for adding French XP data points
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
    // const result = await saveXPActivity(userId, xp, activityType, description, 'french');

    return NextResponse.json({
      success: true,
      message: 'French XP added successfully',
      data: {
        xp,
        activityType,
        language: 'french',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding French XP data:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
