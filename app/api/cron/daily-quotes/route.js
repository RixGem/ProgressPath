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
 * Generates multilingual quotes with translations
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
            content: `You are a multilingual motivational quote generator. Generate exactly 30 unique, inspiring quotes about learning, growth, perseverance, success, and personal development.

CRITICAL REQUIREMENTS:
1. ONLY use quotes from REAL historical figures or contemporary celebrities
2. NEVER fabricate or create fictional quotes
3. Verify that each quote is authentic and correctly attributed
4. Include quotes in Chinese (zh), English (en), and French (fr) languages

LANGUAGE AND TRANSLATION RULES:
- Chinese quotes (zh): Use original Chinese text, set translation to null
- English quotes (en): Use original English text, set translation to null  
- French quotes (fr): Use original French text, MUST include Chinese translation in the translation field

IMPORTANT OUTPUT FORMAT:
- Return ONLY a valid JSON array
- Each quote object MUST have these exact fields:
  * "quote": the quote text in its original language (authentic quote only)
  * "author": the real author's name (must be a real person)
  * "language": ISO 639-1 language code (zh, en, or fr)
  * "translation": Chinese translation for French quotes, null for Chinese/English quotes

EXAMPLE FORMAT:
[
  {
    "quote": "学习之路没有尽头，只有新的起点",
    "author": "林语堂",
    "language": "zh",
    "translation": null
  },
  {
    "quote": "La vie est un mystère qu'il faut vivre, et non un problème à résoudre",
    "author": "Gandhi",
    "language": "fr",
    "translation": "生活是一个需要体验的奥秘，而非一个需要解决的问题"
  },
  {
    "quote": "Education is the most powerful weapon which you can use to change the world",
    "author": "Nelson Mandela",
    "language": "en",
    "translation": null
  }
]

LANGUAGE DISTRIBUTION:
Generate a diverse mix: ~60% English (en), ~25% Chinese (zh), ~15% French (fr)

VERIFICATION CHECKLIST:
✓ All quotes are from real, verifiable people
✓ All quotes are authentic and correctly attributed
✓ Chinese quotes have translation: null
✓ English quotes have translation: null
✓ French quotes have Chinese translation in translation field
✓ All quotes include language field (zh, en, or fr)
✓ Total of exactly 30 quotes`
          },
          {
            role: 'user',
            content: 'Generate 30 authentic motivational quotes from real historical figures and contemporary celebrities in the exact JSON format specified. Remember: Chinese and English quotes need no translation (null), but French quotes MUST include Chinese translation.'
          }
        ],
        temperature: 0.9,
        max_tokens: 3000
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

    // Validate quote structure
    for (const quote of quotes) {
      if (!quote.quote || !quote.author || !quote.language) {
        throw new Error('Invalid quote structure: missing required fields');
      }
      // Validate translation field exists (can be null)
      if (!('translation' in quote)) {
        throw new Error('Invalid quote structure: missing translation field');
      }
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
      .neq('day_id', today)
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
    
    const quotesWithDate = quotes.map((quote) => ({
      quote: quote.quote,
      author: quote.author,
      language: quote.language || 'en',
      translation: quote.translation || null,
      day_id: today
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
    console.log('📝 Generating 30 new multilingual quotes...');
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
