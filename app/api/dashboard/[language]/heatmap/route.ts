/**
 * Next.js Dynamic API Route for fetching activity heatmap data
 * GET /api/dashboard/[language]/heatmap
 * 
 * Supports dynamic language routes (french, german, etc.)
 * Uses language_code field from duolingo_activity table
 * Accepts optional 'days' query parameter (default: 30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActivityHeatmap, TARGET_USER_ID } from '@/lib/db/queries';

// Language mapping: route parameter -> language_code
const LANGUAGE_CODE_MAP: Record<string, string> = {
  'french': 'fr',
  'german': 'de',
  'spanish': 'es',
  'italian': 'it',
  'portuguese': 'pt',
  'dutch': 'nl',
  'japanese': 'ja',
  'korean': 'ko',
  'chinese': 'zh'
};

/**
 * GET handler for activity heatmap data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const language = params.language.toLowerCase();
    const userId = TARGET_USER_ID;

    // Parse days parameter (default to 30)
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { 
          error: 'Invalid days parameter',
          message: 'Days must be a number between 1 and 365'
        },
        { status: 400 }
      );
    }

    // Map language name to language_code
    const languageCode = LANGUAGE_CODE_MAP[language];

    if (!languageCode) {
      return NextResponse.json(
        { 
          error: 'Invalid language parameter',
          message: `Language '${language}' is not supported. Valid languages: ${Object.keys(LANGUAGE_CODE_MAP).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Fetch activity heatmap data using language_code
    const heatmapData = await getActivityHeatmap(userId, languageCode, days);

    // Calculate summary statistics
    const totalXP = heatmapData.reduce((sum, point) => sum + point.xpGained, 0);
    const totalLessons = heatmapData.reduce((sum, point) => sum + point.lessonsCompleted, 0);
    const totalMinutes = heatmapData.reduce((sum, point) => sum + point.timeSpentMinutes, 0);
    const activeDays = heatmapData.filter(point => point.xpGained > 0).length;
    const averageXPPerDay = activeDays > 0 ? Math.round(totalXP / activeDays) : 0;

    return NextResponse.json({
      success: true,
      data: {
        heatmap: heatmapData,
        summary: {
          totalXP,
          totalLessons,
          totalMinutes,
          activeDays,
          averageXPPerDay,
          periodDays: days
        },
        languageCode
      },
      metadata: {
        userId,
        language,
        languageCode,
        days,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error fetching activity heatmap for ${params.language}:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
