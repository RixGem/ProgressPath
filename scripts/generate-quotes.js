const { createClient } = require('@supabase/supabase-js');

// ============================================================================ 
// CONSTANTS & CONFIGURATION
// ============================================================================ 

const BATCH_SIZE = 5; // Process quotes in batches of 5
const TOTAL_QUOTES = 30;
const API_TIMEOUT_MS = 60000; // 60 second timeout for API calls
const DB_TIMEOUT_MS = 30000; // 30 second timeout for DB operations
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// ============================================================================ 
// ENVIRONMENT VALIDATION
// ============================================================================ 

/**
 * Validate all required environment variables at startup
 * @throws {Error} If any required variables are missing
 */
function validateEnvironment() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: supabaseServiceKey,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  };

  const missing = [];
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ Environment validation passed');
}

// ============================================================================ 
// SUPABASE CLIENT INITIALIZATION
// ============================================================================ 

let supabaseAdmin = null;

function initializeSupabase() {
  if (supabaseAdmin) return supabaseAdmin;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });

    console.log('✅ Supabase client initialized successfully');
    return supabaseAdmin;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    throw error;
  }
}

// ============================================================================ 
// UTILITY FUNCTIONS
// ============================================================================ 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function calculateBackoff(attempt) {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

// ============================================================================ 
// QUOTE GENERATION WITH RETRY
// ============================================================================ 

async function generateQuotesWithRetry(count, attempt = 0) {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  
  try {
    console.log(`📝 Generating ${count} quotes (attempt ${attempt + 1}/${MAX_RETRIES + 1})...
`);
    
    // Using fetch (available in Node.js 18+)
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://progresspath.vercel.app',
          'X-Title': 'ProgressPath Daily Quotes'
        },
        body: JSON.stringify({
          // Use faster model as default
          model: process.env.OPENROUTER_MODEL_ID || 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'system',
              content: `You are a multilingual motivational quote generator. Generate exactly ${count} unique, inspiring quotes about learning, growth, perseverance, success, and personal development.

Include quotes in multiple languages (English, Chinese, French, Spanish, etc.) to provide diverse cultural perspectives.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON array
- NO markdown formatting, NO code blocks, NO additional text
- Quotes should be SHORT to MEDIUM length (under 30 words) to ensure valid JSON generation.
- Each quote object MUST have these exact fields:
  * "quote": the quote text in its original language
  * "author": the author's name  
  * "language": ISO 639-1 language code (en, zh, fr, es, etc.)
  * "translation": English or Chinese translation (null if quote is already in English or Chinese)

Example:
[
  {
    "quote": "学习之路没有尽头，只有新的起点",
    "author": "林语堂",
    "language": "zh",
    "translation": null
  },
  {
    "quote": "La vie est un mystère qu'il faut vivre",
    "author": "Gandhi",
    "language": "fr",
    "translation": "Life is a mystery to be lived"
  }
]

Generate a diverse mix: ~60% English, ~15% Chinese, ~15% French, ~10% other languages.`
            },
            {
              role: 'user',
              content: `Generate exactly ${count} motivational quotes in valid JSON array format. Return ONLY the JSON array, no other text.`
            }
          ],
          temperature: 0.7,
          max_tokens: count * 250
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenRouter API');
    }

    // Extract and parse JSON
    let jsonStr = content.trim();
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '');
    
    // Find the first '[' and last ']' to isolate the JSON array
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
    } else {
      console.warn('⚠️ Could not find JSON array brackets in response, attempting to parse raw content');
    }

    let quotes;
    try {
      quotes = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('Raw content snippet (first 200 chars):', content.substring(0, 200) + '...');
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
    
    if (!Array.isArray(quotes)) {
      throw new Error('Response is not a valid JSON array');
    }

    if (quotes.length < count) {
      throw new Error(`Expected ${count} quotes, got ${quotes.length}`);
    }

    // Validate and sanitize quote structure
    const validatedQuotes = quotes.slice(0, count).map((quote, index) => {
      if (!quote.quote || !quote.author || !quote.language) {
        throw new Error(`Quote ${index + 1} missing required fields`);
      }

      return {
        quote: String(quote.quote).trim(),
        author: String(quote.author).trim(),
        language: String(quote.language).toLowerCase().trim(),
        translation: quote.translation ? String(quote.translation).trim() : null
      };
    });

    console.log(`✅ Successfully generated ${validatedQuotes.length} quotes`);
    return validatedQuotes;

  } catch (error) {
    console.error(`❌ Quote generation failed (attempt ${attempt + 1}):`, error.message);

    if (attempt < MAX_RETRIES) {
      const delay = calculateBackoff(attempt);
      console.log(`⏳ Retrying in ${delay}ms...
`);
      await sleep(delay);
      return generateQuotesWithRetry(count, attempt + 1);
    }

    throw new Error(`Failed to generate quotes after ${MAX_RETRIES + 1} attempts: ${error.message}`);
  }
}

async function generateQuotesInBatches() {
  const allQuotes = [];
  const batches = Math.ceil(TOTAL_QUOTES / BATCH_SIZE);
  
  console.log(`📦 Generating ${TOTAL_QUOTES} quotes in ${batches} batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < batches; i++) {
    const remaining = TOTAL_QUOTES - allQuotes.length;
    // Don't request more than needed, but also handle case where previous batches failed
    // Actually, if a batch failed, we still want to try to get as close to TOTAL_QUOTES as possible?
    // Or just fill the "slots" for this batch?
    // Simple approach: Each batch tries to get BATCH_SIZE.
    // If batch 1 fails, we have 0. Batch 2 tries to get 5. Total 5.
    // If we want to "catch up", logic is more complex. Let's stick to "best effort" for now.
    // So just ask for BATCH_SIZE each time until we run out of scheduled batches.
    
    const batchSize = BATCH_SIZE; 
    
    console.log(`\n🔄 Processing batch ${i + 1}/${batches} (${batchSize} quotes)...`);
    
    try {
      const batchQuotes = await generateQuotesWithRetry(batchSize);
      allQuotes.push(...batchQuotes);
      
      if (i < batches - 1) {
        await sleep(1000); // Increased delay to 1s to be nicer to API
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error.message);
      console.warn(`⚠️ Continuing with remaining batches...`);
    }
  }

  if (allQuotes.length === 0) {
    throw new Error('Failed to generate any quotes across all batches');
  }

  if (allQuotes.length < TOTAL_QUOTES) {
    console.warn(`\n⚠️ Partial success: Generated ${allQuotes.length}/${TOTAL_QUOTES} quotes`);
  } else {
    console.log(`\n✅ All batches completed: ${allQuotes.length} total quotes generated`);
  }
  
  return allQuotes;
}

// ============================================================================ 
// DATABASE OPERATIONS
// ============================================================================ 

async function deletePreviousQuotes(client) {
  let deletedCount = 0;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🗑️  Deleting quotes from previous days (keeping ${today})...
`);

    const { data, error, count } = await client
      .from('daily_quotes')
      .delete()
      .neq('day_id', today)
      .select('id', { count: 'exact' });

    if (error) throw error;

    deletedCount = count || 0;
    console.log(`✅ Deleted ${deletedCount} previous quotes
`);
    
    return { success: true, deletedCount, date: today };

  } catch (error) {
    console.error('❌ Error deleting previous quotes:', error.message);
    throw new Error(`Database deletion failed: ${error.message}`);
  }
}

async function insertQuotesWithRollback(client, quotes) {
  const today = new Date().toISOString().split('T')[0];
  const insertedIds = [];
  
  try {
    console.log(`💾 Inserting ${quotes.length} quotes for ${today}...
`);

    const quotesWithDate = quotes.map((quote) => ({
      quote: quote.quote,
      author: quote.author,
      language: quote.language || 'en',
      translation: quote.translation || null,
      day_id: today,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await client
      .from('daily_quotes')
      .insert(quotesWithDate)
      .select('id');

    if (error) throw error;

    insertedIds.push(...data.map(r => r.id));
    console.log(`✅ Successfully inserted ${insertedIds.length} quotes
`);
    
    return { success: true, insertedCount: insertedIds.length, insertedIds, date: today };

  } catch (error) {
    console.error('❌ Error inserting quotes:', error.message);
    
    if (insertedIds.length > 0) {
      console.log(`⚠️  Attempting rollback of ${insertedIds.length} partially inserted quotes...
`);
      try {
        await client.from('daily_quotes').delete().in('id', insertedIds);
        console.log(`✅ Rollback successful
`);
      } catch (rollbackError) {
        console.error(`❌ Rollback failed:`, rollbackError.message);
      }
    }
    
    throw new Error(`Database insertion failed: ${error.message}`);
  }
}

// ============================================================================ 
// MAIN EXECUTION
// ============================================================================ 

async function main() {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(80)}
`);
  console.log(`🚀 DAILY QUOTES GENERATOR STARTED`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}
`);

  try {
    validateEnvironment();
    const client = initializeSupabase();
    
    const quotes = await generateQuotesInBatches();
    await deletePreviousQuotes(client);
    await insertQuotesWithRollback(client, quotes);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${'='.repeat(80)}
`);
    console.log(`✨ COMPLETED SUCCESSFULLY in ${duration}s`);
    console.log(`${'='.repeat(80)}
`);
    process.exit(0);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${'='.repeat(80)}
`);
    console.error(`❌ FAILED in ${duration}s`);
    console.error(`Error: ${error.message}`);
    console.log(`${'='.repeat(80)}
`);
    process.exit(1);
  }
}

main();
