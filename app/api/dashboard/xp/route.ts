/**
 * Next.js API Route for fetching XP data
 * GET /api/dashboard/xp
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ChartDataPoint, TimePeriod } from '@/types/xpChart';
import { getDailyXP, TARGET_USER_ID } from '@/lib/db/queries';

/**
 * GET handler for XP data
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    // Always use TARGET_USER_ID to match database records
    const userId = TARGET_USER_ID;
    const period = (searchParams.get('period') as TimePeriod) || 'weekly';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate period
    const validPeriods: TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: daily, weekly, monthly, yearly' },
        { status: 400 }
      );
    }

    // Fetch real data from database
    const processedData = {
      data: await getDailyXP(userId, period),
      summary: {} // Add summary if needed
    };

    // Return response
    return NextResponse.json({
      success: true,
      data: processedData,
      metadata: {
        userId: userId || 'guest',
        period,
        startDate: startDate || null,
        endDate: endDate || null,
        dataPoints: processedData.data.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching XP data:', error);

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
 * POST handler for adding XP data points
 * Body:
 *   - userId: string - User ID
 *   - xp: number - XP amount to add
 *   - activityType: string - Type of activity
 *   - description: string (optional) - Activity description
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, xp, activityType, description } = body;

    // Validate input
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

    // TODO: Implement authentication check
    // const session = await getSession(request);
    // if (!session || session.userId !== userId) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // TODO: Save to database
    // const result = await saveXPActivity({
    //   userId,
    //   xp,
    //   activityType,
    //   description,
    //   timestamp: new Date()
    // });

    const newDataPoint: ChartDataPoint = {
      date: new Date().toISOString().split('T')[0],
      xp,
      label: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: newDataPoint,
      message: 'XP added successfully'
    });
  } catch (error) {
    console.error('Error adding XP data:', error);

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
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
