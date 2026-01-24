/**
 * Next.js Dynamic API Route for fetching virtual level data
 * GET /api/dashboard/[language]/virtual-level
 * 
 * Supports dynamic language routes (french, german, etc.)
 * Uses language_code field from duolingo_activity table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVirtualLevel, TARGET_USER_ID } from '@/lib/db/queries';

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
 * GET handler for virtual level data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { language: string } }
) {
  try {
    const language = params.language.toLowerCase();
    const userId = TARGET_USER_ID;

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

    // Fetch virtual level data using language_code
    const levelData = await getVirtualLevel(userId, languageCode);

    if (!levelData) {
      return NextResponse.json(
        { 
          error: 'No data found',
          message: `No virtual level data available for language: ${language}`
        },
        { status: 404 }
      );
    }

    // Calculate additional metrics
    const xpForNextLevel = Math.ceil(levelData.virtualLevel * 100 * 1.1); // Estimated XP for next level
    const progressToNextLevel = levelData.totalXP % xpForNextLevel;
    const progressPercentage = Math.round((progressToNextLevel / xpForNextLevel) * 100);

    return NextResponse.json({
      success: true,
      data: {
        virtualLevel: levelData.virtualLevel,
        totalXP: levelData.totalXP,
        estimatedHours: levelData.estimatedHours,
        languageCode: levelData.languageCode,
        progress: {
          xpForNextLevel,
          progressToNextLevel,
          progressPercentage
        }
      },
      metadata: {
        userId,
        language,
        languageCode,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error fetching virtual level for ${params.language}:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
