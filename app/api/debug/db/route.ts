import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TARGET_USER_ID } from '@/lib/db/queries';

export async function GET() {
  try {
    // List all tables - using information_schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    // Check duolingo_activity with no user filter
    const { data: activityData, error: activityError } = await supabase
      .from('duolingo_activity')
      .select('*')
      .limit(10);

    // Try to get table columns from the first record
    let columns: string[] = [];
    if (activityData && activityData.length > 0) {
      columns = Object.keys(activityData[0]);
    }

    // Check if maybe user_id column has different name
    const { data: allRecords, error: allError } = await supabase
      .from('duolingo_activity')
      .select('*');

    return NextResponse.json({
      targetUserId: TARGET_USER_ID,
      tablesCheck: {
        error: tablesError?.message,
        tables: tables
      },
      duolingo_activity: {
        error: activityError?.message,
        totalRecords: allRecords?.length || 0,
        sampleData: activityData,
        columns: columns,
        // Check for different user ID fields
        uniqueUserIds: allRecords ? Array.from(new Set(allRecords.map((r: any) => r.user_id || r.userId || 'no_user_field'))) : []
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
