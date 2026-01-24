/**
 * Next.js Dynamic API Route for fetching completion rate data
 * GET /api/dashboard/[language]/completion
 * 
 * Supports dynamic language routes (french, german, etc.)
 * Uses language_code field from duolingo_activity table
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompletionRate, TARGET_USER_ID } from '@/lib/db/queries';

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
 * GET handler for completion rate data
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

    // Fetch completion rate data using language_code
    const completionData = await getCompletionRate(userId, languageCode);

    if (!completionData) {
      return NextResponse.json(
        { 
          error: 'No data found',
          message: `No completion data available for language: ${language}`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        completionRate: completionData.completionRate,
        totalSkills: completionData.totalSkills,
        completedSkills: completionData.completedSkills,
        activeSkills: completionData.totalSkills - completionData.completedSkills,
        languageCode: completionData.languageCode
      },
      metadata: {
        userId,
        language,
        languageCode,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error fetching completion rate for ${params.language}:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
