import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

// Initialize Supabase client with service role for server-side operations
// NEXT_PUBLIC_SUPABASE_URL: URL of your Supabase project instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Environment Variable Compatibility Layer
// Supports multiple naming conventions to work across different deployment environments
// Priority order: primary convention -> alternative convention -> fallback

// Service Role Key: Server-side Supabase admin access key
// Used for privileged operations that bypass RLS (Row Level Security)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// JWT Secret: Secret key for signing JWT tokens
// Used to cryptographically sign and verify embed tokens
// Falls back to service key if no dedicated JWT secret is configured
const jwtSecret = process.env.JWT_EMBED_SECRET || process.env.JWTEMBEDSECRET || process.env.JWT_SECRET || supabaseServiceKey;

// NEXTPUBLICSUPABASE_URL是Supabase项目URL，而NEXT_PUBLIC_APP_URL是应用部署URL
// 这两个变量用途不同，但我们可以提供更好的错误信息
// NEXT_PUBLIC_APP_URL: Your application's deployment URL
// Used for generating embed URLs that point to your application
// Falls back to VERCEL_URL (Vercel deployment) or default production URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://progress-path-one.vercel.app';

// JWT token configuration
const JWT_EXPIRATION = '7d'; // Token valid for 7 days

// Environment validation with detailed error logging for debugging
if (!supabaseServiceKey) {
  console.error('Missing Supabase service key: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY must be set');
}
if (!jwtSecret) {
  console.error('Missing JWT secret: JWT_EMBED_SECRET, JWTEMBEDSECRET, JWT_SECRET or Supabase service key must be set');
}
if (!supabaseUrl) {
  console.error('Missing Supabase URL: NEXT_PUBLIC_SUPABASE_URL must be set');
}

/**
 * POST /api/auth/generate-embed-token
 * 
 * Generates a JWT token for embed authentication with read-only permissions.
 * This token can be used to embed ProgressPath dashboards in external applications like Notion.
 * 
 * Request body:
 * - userId: string (optional) - User ID to generate token for. If not provided, uses authenticated user.
 * - duration: string (optional) - Token expiration duration (e.g., '7d', '30d', '1h'). Default: '7d'
 * 
 * Response:
 * - token: string - JWT token for embed authentication
 * - embedUrl: string - Complete embed URL with token
 * - expiresAt: string - ISO timestamp of token expiration
 * - user: object - User information included in token
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { userId, duration = JWT_EXPIRATION } = body;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify user authentication with Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // Use provided userId or authenticated user's ID
    const targetUserId = userId || user.id;

    // CRITICAL FIX: Changed from 'users' table to 'user_profiles' table
    // user_profiles schema: id, display_name, created_at (no email field)
    // Email is retrieved from auth.users via the authenticated user object
    // Note: 'full_name' was changed to 'display_name' to match user_profiles schema
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, created_at')
      .eq('id', targetUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User profile not found in user_profiles table' },
        { status: 404 }
      );
    }

    // Calculate expiration timestamp
    const expirationMs = parseDuration(duration);
    const expiresAt = new Date(Date.now() + expirationMs);

    // Create JWT payload with read-only permissions
    // Email comes from auth.users (user.email), not from user_profiles table
    const payload = {
      userId: userData.id,
      email: user.email, // Retrieved from auth.users, not user_profiles
      fullName: userData.display_name, // Changed from full_name to display_name
      permissions: ['read'], // Read-only access for embed
      type: 'embed',
      createdAt: new Date().toISOString(),
    };

    // Sign JWT token using jose library
    // Uses compatible JWT secret from environment variables
    const secret = new TextEncoder().encode(jwtSecret);
    const embedToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setSubject(userData.id)
      .sign(secret);

    // Generate embed URL with compatibility for different hosting environments
    const embedUrl = `${appUrl}/embed?token=${embedToken}`;

    // Return response with token and embed URL
    return NextResponse.json({
      success: true,
      token: embedToken,
      embedUrl,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userData.id,
        email: user.email, // From auth.users
        fullName: userData.display_name, // From user_profiles
      },
      permissions: ['read'],
      type: 'embed',
    });

  } catch (error) {
    console.error('Error generating embed token:', error);
    return NextResponse.json(
      { error: 'Failed to generate embed token', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/generate-embed-token
 * 
 * Alternative method for generating embed token via GET request with query parameters.
 * Useful for simple integrations where POST is not convenient.
 * 
 * Query parameters:
 * - duration: string (optional) - Token expiration duration. Default: '7d'
 * 
 * Requires Authorization header with Bearer token.
 */
export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const duration = searchParams.get('duration') || JWT_EXPIRATION;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user authentication with Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // CRITICAL FIX: Changed from 'users' table to 'user_profiles' table
    // user_profiles schema: id, display_name, created_at (no email field)
    // Email is retrieved from auth.users via the authenticated user object
    // Note: 'full_name' was changed to 'display_name' to match user_profiles schema
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('id, display_name, created_at')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User profile not found in user_profiles table' },
        { status: 404 }
      );
    }

    // Calculate expiration timestamp
    const expirationMs = parseDuration(duration);
    const expiresAt = new Date(Date.now() + expirationMs);

    // Create JWT payload with read-only permissions
    // Email comes from auth.users (user.email), not from user_profiles table
    const payload = {
      userId: userData.id,
      email: user.email, // Retrieved from auth.users, not user_profiles
      fullName: userData.display_name, // Changed from full_name to display_name
      permissions: ['read'],
      type: 'embed',
      createdAt: new Date().toISOString(),
    };

    // Sign JWT token using compatible JWT secret
    const secret = new TextEncoder().encode(jwtSecret);
    const embedToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setSubject(userData.id)
      .sign(secret);

    // Generate embed URL with compatibility for different hosting environments
    const embedUrl = `${appUrl}/embed?token=${embedToken}`;

    // Return response
    return NextResponse.json({
      success: true,
      token: embedToken,
      embedUrl,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: userData.id,
        email: user.email, // From auth.users
        fullName: userData.display_name, // From user_profiles
      },
      permissions: ['read'],
      type: 'embed',
    });

  } catch (error) {
    console.error('Error generating embed token:', error);
    return NextResponse.json(
      { error: 'Failed to generate embed token', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Parse duration string to milliseconds
 * Supports formats like: '7d', '30d', '12h', '60m'
 * 
 * @param {string} duration - Duration string to parse
 * @returns {number} Duration in milliseconds
 */
function parseDuration(duration) {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 7 days if invalid format
    return 7 * 24 * 60 * 60 * 1000;
  }

  const [, value, unit] = match;
  return parseInt(value) * (units[unit] || units.d);
}
