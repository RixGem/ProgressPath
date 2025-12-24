import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Generate 30 motivational quotes using OpenRouter API
 * @returns {Promise<Array>} Array of quote objects
 */
async function generateQuotes() {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://progresspath.vercel.app',
        'X-Title': 'ProgressPath Daily Quotes'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are a motivational quote generator. Generate exactly 30 unique, inspiring, and meaningful quotes about learning, growth, perseverance, success, and personal development. Each quote should be original, concise (under 150 characters), and attributed to a relevant author or source. Format your response as a JSON array of objects with "text" and "author" properties.'
          },
          {
            role: 'user',
            content: 'Generate 30 motivational quotes in JSON format: [{"text": "quote text", "author": "Author Name"}, ...]'
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenRouter API');
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const quotes = JSON.parse(jsonStr);
    
    if (!Array.isArray(quotes) || quotes.length < 30) {
      throw new Error(`Expected 30 quotes, got ${quotes?.length || 0}`);
    }

    return quotes.slice(0, 30); // Ensure exactly 30 quotes
  } catch (error) {
    console.error('Error generating quotes:', error);
    throw error;
  }
}

/**
 * Delete previous day's quotes from the database
 * @returns {Promise<Object>} Deletion result
 */
async function deletePreviousQuotes() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error, count } = await supabaseAdmin
      .from('daily_quotes')
      .delete()
      .neq('created_date', today)
      .select('id', { count: 'exact' });

    if (error) {
      throw error;
    }

    console.log(`Deleted ${count || 0} previous quotes`);
    return { success: true, deletedCount: count || 0 };
  } catch (error) {
    console.error('Error deleting previous quotes:', error);
    throw error;
  }
}

/**
 * Insert new quotes into the database
 * @param {Array} quotes - Array of quote objects
 * @returns {Promise<Object>} Insertion result
 */
async function insertNewQuotes(quotes) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const quotesWithDate = quotes.map((quote, index) => ({
      text: quote.text,
      author: quote.author,
      created_date: today,
      order_index: index + 1,
      is_active: true
    }));

    const { data, error } = await supabaseAdmin
      .from('daily_quotes')
      .insert(quotesWithDate)
      .select('id');

    if (error) {
      throw error;
    }

    console.log(`Inserted ${data.length} new quotes for ${today}`);
    return { success: true, insertedCount: data.length };
  } catch (error) {
    console.error('Error inserting new quotes:', error);
    throw error;
  }
}

/**
 * Main cron job handler
 * Runs daily at midnight to refresh quotes
 */
export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Security: Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting daily quote generation cron job...');

    // Step 1: Generate new quotes
    console.log('📝 Generating 30 new quotes...');
    const quotes = await generateQuotes();
    console.log(`✅ Generated ${quotes.length} quotes`);

    // Step 2: Delete previous quotes
    console.log('🗑️  Deleting previous quotes...');
    const deleteResult = await deletePreviousQuotes();
    console.log(`✅ Deleted ${deleteResult.deletedCount} old quotes`);

    // Step 3: Insert new quotes
    console.log('💾 Inserting new quotes...');
    const insertResult = await insertNewQuotes(quotes);
    console.log(`✅ Inserted ${insertResult.insertedCount} new quotes`);

    const duration = Date.now() - startTime;
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      deleted: deleteResult.deletedCount,
      inserted: insertResult.insertedCount,
      message: 'Daily quotes successfully refreshed'
    };

    console.log('✨ Cron job completed successfully:', result);
    return NextResponse.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Cron job failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;
