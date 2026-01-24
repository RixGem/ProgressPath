/**
 * Debug API route to test database connection and query
 */
import { NextResponse } from 'next/server';
import { supabaseServer, createServerSupabaseClient } from '@/lib/supabaseServer';
import { TARGET_USER_ID } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if supabaseServer is initialized
    const serverClientStatus = {
      supabaseServer: supabaseServer ? 'initialized' : 'null',
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasServiceKeyAlt: !!process.env.SUPABASE_SERVICE_KEY,
    };

    // Try to create a fresh client
    const freshClient = createServerSupabaseClient();

    if (!freshClient) {
      return NextResponse.json({
        error: 'Could not create Supabase server client',
        serverClientStatus,
        targetUserId: TARGET_USER_ID
      }, { status: 500 });
    }

    // Query with fresh client
    const { data, error } = await freshClient
      .from('duolingo_activity')
      .select('*')
      .eq('user_id', TARGET_USER_ID)
      .limit(5);

    // Also try without user filter
    const { data: allData, error: allError } = await freshClient
      .from('duolingo_activity')
      .select('*')
      .limit(5);

    return NextResponse.json({
      serverClientStatus,
      targetUserId: TARGET_USER_ID,
      withUserFilter: {
        error: error?.message,
        count: data?.length || 0,
        data: data
      },
      withoutUserFilter: {
        error: allError?.message,
        count: allData?.length || 0,
        data: allData
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
