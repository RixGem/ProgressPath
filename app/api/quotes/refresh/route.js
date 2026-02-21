import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Manual Quote Refresh API
 * 
 * Allows users to manually refresh their daily quote
 * without waiting for the cron job
 * 
 * GET /api/quotes/refresh - Get a new random quote
 * POST /api/quotes/refresh - Force fetch from specific category/language
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * GET - Fetch a random quote
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const category = searchParams.get('category')

    // Build query
    let query = supabase
      .from('daily_quotes')
      .select('quote, author, language, translation, category')

    // Apply filters
    if (language) {
      query = query.eq('language', language)
    }
    if (category) {
      query = query.eq('category', category)
    }

    // Get count for random selection
    const countQuery = supabase
      .from('daily_quotes')
      .select('*', { count: 'exact', head: true })

    if (language) countQuery.eq('language', language)
    if (category) countQuery.eq('category', category)

    const { count, error: countError } = await countQuery

    if (countError) {
      throw new Error(`Count error: ${countError.message}`)
    }

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'No quotes found matching criteria' },
        { status: 404 }
      )
    }

    // Get random quote
    const randomOffset = Math.floor(Math.random() * count)
    const { data, error } = await query
      .range(randomOffset, randomOffset)
      .single()

    if (error) {
      throw new Error(`Fetch error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      quote: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Get multiple quotes (for prefetching)
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { language, category, count = 5 } = body

    // Validate count
    const requestCount = Math.min(Math.max(1, count), 20) // Limit between 1-20

    // Build query
    let query = supabase
      .from('daily_quotes')
      .select('quote, author, language, translation, category')

    if (language) query = query.eq('language', language)
    if (category) query = query.eq('category', category)

    // Get total count
    const countQuery = supabase
      .from('daily_quotes')
      .select('*', { count: 'exact', head: true })

    if (language) countQuery.eq('language', language)
    if (category) countQuery.eq('category', category)

    const { count: totalCount, error: countError } = await countQuery

    if (countError) {
      throw new Error(`Count error: ${countError.message}`)
    }

    if (!totalCount || totalCount === 0) {
      return NextResponse.json(
        { error: 'No quotes found' },
        { status: 404 }
      )
    }

    // Generate random offsets
    const quotes = []
    const usedOffsets = new Set()

    while (quotes.length < requestCount && usedOffsets.size < totalCount) {
      const offset = Math.floor(Math.random() * totalCount)
      
      if (!usedOffsets.has(offset)) {
        usedOffsets.add(offset)
        
        const { data, error } = await query
          .range(offset, offset)
          .single()

        if (!error && data) {
          quotes.push(data)
        }
      }
    }

    return NextResponse.json({
      success: true,
      quotes,
      count: quotes.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
