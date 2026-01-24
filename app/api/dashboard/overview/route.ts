/**
 * Next.js API Route for fetching complete dashboard data
 * GET /api/dashboard/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TimePeriod } from '@/types/xpChart';
import {
    getDailyXP,
    getStreakInfo,
    getActivityBreakdown,
    getLanguageSummary,
    getTimeStats,
    getVocabularyStats,
    TARGET_USER_ID
} from '@/lib/db/queries';
import { getXPStats } from '@/utils/xpCalculations';

export const dynamic = 'force-dynamic';

/**
 * GET handler for complete dashboard overview data
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const period = (searchParams.get('period') as TimePeriod) || 'weekly';

        // Use fixed TARGET_USER_ID
        const userId = TARGET_USER_ID;

        // Fetch all data in parallel
        const [dailyXP, streakInfo, activities, languages, timeStats, vocabStats] = await Promise.all([
            getDailyXP(userId, period),
            getStreakInfo(userId),
            getActivityBreakdown(userId),
            getLanguageSummary(userId),
            getTimeStats(userId),
            getVocabularyStats(userId)
        ]);

        // Calculate aggregated stats
        const totalXP = languages.reduce((sum, lang) => sum + lang.totalXP, 0);
        const xpStats = getXPStats(totalXP);

        return NextResponse.json({
            success: true,
            data: {
                xpStats,
                chartData: dailyXP,
                streakData: streakInfo,
                recentActivities: activities,
                languageStats: languages,
                timeStats,
                vocabularyStats: vocabStats
            },
            metadata: {
                userId,
                period,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

