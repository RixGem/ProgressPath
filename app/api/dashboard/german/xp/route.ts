/**
 * Next.js API Route for fetching German XP data
 * GET /api/dashboard/german/xp
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TimePeriod } from '@/types/xpChart';
import { getDailyXP, getStreakInfo, getActivityBreakdown, getTimeStats, getVocabularyStats, TARGET_USER_ID } from '@/lib/db/queries';
import { getXPStats } from '@/utils/xpCalculations';

/**
 * GET handler for German XP data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Always use TARGET_USER_ID to match database records
    const userId = TARGET_USER_ID;
    const period = (searchParams.get('period') as TimePeriod) || 'weekly';
    const languageCode = 'de'; // Use language_code instead of language name

    // Validate period
    const validPeriods: TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: daily, weekly, monthly, yearly' },
        { status: 400 }
      );
    }

    // Fetch German-specific dashboard data using language_code
    const [chartData, streakData, activities, timeStats, vocabStats] = await Promise.all([
      getDailyXP(userId, period, languageCode),
      getStreakInfo(userId, languageCode),
      getActivityBreakdown(userId, languageCode),
      getTimeStats(userId, languageCode),
      getVocabularyStats(userId, languageCode)
    ]);

    // Calculate total XP for German
    const totalXP = chartData.reduce((sum, point) => sum + point.xp, 0);
    const xpStats = getXPStats(totalXP);

    return NextResponse.json({
      success: true,
      data: {
        stats: xpStats,
        chartData,
        activities,
        timeStats,
        streakData,
        vocabularyStats: vocabStats
      },
      metadata: {
        userId,
        language: 'german',
        languageCode,
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
    // const result = await saveXPActivity(userId, xp, activityType, description, 'de');

    return NextResponse.json({
      success: true,
      message: 'German XP added successfully',
      data: {
        xp,
        activityType,
        language: 'german',
        languageCode: 'de',
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
