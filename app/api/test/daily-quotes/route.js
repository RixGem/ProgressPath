import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Test endpoint to manually trigger daily quote generation
 * This endpoint should be protected in production
 */
export async function POST(request) {
  try {
    // Security: Check for test authorization
    const authHeader = request.headers.get('authorization');
    const testSecret = process.env.TEST_SECRET || process.env.CRON_SECRET;
    
    if (testSecret && authHeader !== `Bearer ${testSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid test secret' },
        { status: 401 }
      );
    }

    // Call the cron endpoint internally
    const cronUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/daily-quotes`;
    const cronSecret = process.env.CRON_SECRET;
    
    console.log('🧪 Testing daily quotes cron job...');
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    return NextResponse.json({
      testRun: true,
      timestamp: new Date().toISOString(),
      cronResponse: data,
      status: response.status
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to view current quotes in the database
 */
export async function GET(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    // Fetch current quotes
    const { data: quotes, error } = await supabaseAdmin
      .from('daily_quotes')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayQuotes = quotes.filter(q => q.created_date === today);
    const otherQuotes = quotes.filter(q => q.created_date !== today);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      today: today,
      todayQuotesCount: todayQuotes.length,
      otherQuotesCount: otherQuotes.length,
      totalQuotes: quotes.length,
      todayQuotes: todayQuotes,
      otherQuotes: otherQuotes.length > 0 ? otherQuotes : undefined
    });

  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
