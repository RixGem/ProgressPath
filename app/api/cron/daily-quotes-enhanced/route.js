import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Enhanced Daily Quotes Cron Job
 * 
 * Features:
 * - Multiple motivational categories
 * - Balanced language distribution
 * - Quality quote generation with context
 * - Error recovery and logging
 * 
 * Runs daily at midnight UTC
 */

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Quote categories with detailed prompts
const QUOTE_CATEGORIES = {
  motivation: {
    count: 8,
    prompt: "inspirational quotes about motivation, determination, and perseverance"
  },
  learning: {
    count: 7,
    prompt: "quotes about education, continuous learning, and intellectual growth"
  },
  wisdom: {
    count: 5,
    prompt: "philosophical quotes about life wisdom and deep insights"
  },
  success: {
    count: 5,
    prompt: "quotes about achievement, success, and reaching goals"
  },
  creativity: {
    count: 3,
    prompt: "quotes about creativity, innovation, and thinking differently"
  },
  resilience: {
    count: 2,
    prompt: "quotes about overcoming challenges and building resilience"
  }
}

// Language distribution for diverse content
const LANGUAGE_CONFIG = {
  en: { weight: 0.50, name: "English" },
  fr: { weight: 0.30, name: "French" },
  zh: { weight: 0.15, name: "Chinese" },
  es: { weight: 0.05, name: "Spanish" }
}

/**
 * Generate quotes for a specific category and language
 */
async function generateQuotesForCategory(category, categoryData, language, count) {
  const modelId = process.env.OPENROUTER_MODEL_ID || 'meta-llama/llama-3.1-8b-instruct:free'
  
  const prompt = `Generate ${count} unique ${categoryData.prompt}.

Requirements:
- Language: ${LANGUAGE_CONFIG[language].name} (${language})
- All quotes must be in ${LANGUAGE_CONFIG[language].name}
- For non-English quotes, provide English translation
- Include diverse authors (historical figures, philosophers, writers, leaders)
- Ensure quotes are meaningful and culturally appropriate
- Category: ${category}

Return ONLY a valid JSON array with this exact format:
[
  {
    "quote": "The actual quote in ${LANGUAGE_CONFIG[language].name}",
    "author": "Author Name",
    "language": "${language}",
    "translation": ${language === 'en' ? 'null' : '"English translation here"'},
    "category": "${category}"
  }
]

IMPORTANT:
- Return ONLY the JSON array, no other text
- Each quote must have all 5 fields: quote, author, language, translation, category
- English quotes should have translation: null
- Non-English quotes must have English translation
- Ensure proper JSON formatting with escaped quotes if needed`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ProgressPath - Daily Quotes'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim()
    }
    
    const quotes = JSON.parse(jsonContent)
    
    // Validate quotes
    const validQuotes = quotes.filter(q => 
      q.quote && q.author && q.language && q.category &&
      q.language === language && q.category === category
    )

    if (validQuotes.length === 0) {
      throw new Error('No valid quotes generated')
    }

    return validQuotes
  } catch (error) {
    console.error(`Error generating quotes for ${category}/${language}:`, error)
    return []
  }
}

/**
 * Main cron job handler
 */
export async function GET(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting enhanced daily quotes generation...')
    const startTime = Date.now()
    const today = new Date().toISOString().split('T')[0]
    
    // Delete old quotes (keep last 2 days for safety)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const cutoffDate = twoDaysAgo.toISOString().split('T')[0]
    
    const { error: deleteError } = await supabase
      .from('daily_quotes')
      .delete()
      .lt('day_id', cutoffDate)
    
    if (deleteError) {
      console.error('Error deleting old quotes:', deleteError)
    } else {
      console.log(`✅ Deleted quotes older than ${cutoffDate}`)
    }

    // Generate quotes for each category and language
    const allGeneratedQuotes = []
    const generationStats = {
      byCategory: {},
      byLanguage: {},
      total: 0,
      errors: []
    }

    for (const [category, categoryData] of Object.entries(QUOTE_CATEGORIES)) {
      generationStats.byCategory[category] = 0
      
      // Distribute quotes across languages based on weights
      for (const [language, langConfig] of Object.entries(LANGUAGE_CONFIG)) {
        const quotesToGenerate = Math.ceil(categoryData.count * langConfig.weight)
        
        if (quotesToGenerate > 0) {
          console.log(`📝 Generating ${quotesToGenerate} ${language} quotes for ${category}...`)
          
          const quotes = await generateQuotesForCategory(
            category,
            categoryData,
            language,
            quotesToGenerate
          )
          
          if (quotes.length > 0) {
            allGeneratedQuotes.push(...quotes)
            generationStats.byCategory[category] += quotes.length
            generationStats.byLanguage[language] = (generationStats.byLanguage[language] || 0) + quotes.length
            generationStats.total += quotes.length
          } else {
            generationStats.errors.push(`Failed to generate ${category}/${language}`)
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // Insert all quotes into database
    if (allGeneratedQuotes.length > 0) {
      const quotesWithDayId = allGeneratedQuotes.map(q => ({
        ...q,
        day_id: today,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('daily_quotes')
        .insert(quotesWithDayId)

      if (insertError) {
        throw new Error(`Failed to insert quotes: ${insertError.message}`)
      }

      console.log(`✅ Inserted ${allGeneratedQuotes.length} quotes for ${today}`)
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dayId: today,
      duration: `${duration}s`,
      stats: generationStats,
      message: `Generated ${generationStats.total} quotes across ${Object.keys(QUOTE_CATEGORIES).length} categories`
    })

  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
