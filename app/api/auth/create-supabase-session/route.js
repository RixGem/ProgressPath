import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

/**
 * Get JWT secret using the same hierarchy as the generation endpoint
 * Priority order:
 * 1. JWT_EMBED_SECRET - Dedicated secret for embed tokens
 * 2. JWTEMBEDSECRET - Alternative naming
 * 3. JWT_SECRET - Alternative naming convention
 * 4. SUPABASE_SERVICE_ROLE_KEY - Fallback for backward compatibility
 * 5. SUPABASE_SERVICE_KEY - Alternative fallback
 */
function getJWTSecret() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const secret = 
    process.env.JWT_EMBED_SECRET || 
    process.env.JWTEMBEDSECRET || 
    process.env.JWT_SECRET || 
    supabaseServiceKey;
  
  if (!secret) {
    throw new Error('JWT secret not configured');
  }
  
  return secret;
}

/**
 * POST /api/auth/create-supabase-session
 * 
 * Converts a JWT token to a Supabase session
 * Handles JWT verification, user validation, and session creation
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { token } = body;

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token', message: 'JWT token is required' },
        { status: 400 }
      );
    }

    // Verify environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables for Supabase');
      return NextResponse.json(
        { error: 'Configuration error', message: 'Server configuration is incomplete' },
        { status: 500 }
      );
    }

    // Step 1: JWT Verification
    let payload;
    try {
      const secret = getJWTSecret();
      const secretKey = new TextEncoder().encode(secret);
      const verified = await jwtVerify(token, secretKey);
      payload = verified.payload;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      
      if (jwtError.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json(
          { error: 'Token expired', message: 'The provided token has expired' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Authentication failed', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Extract user information from decoded token
    const { userId, email } = payload;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token payload', message: 'Token does not contain user information' },
        { status: 400 }
      );
    }

    // Step 2: Create Supabase Admin Client with Service Role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Step 3: User Validation - Verify user exists in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User validation failed', message: 'Unable to validate user' },
        { status: 500 }
      );
    }

    if (!userData || !userData.user) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found', message: 'The specified user does not exist' },
        { status: 404 }
      );
    }

    // Verify email matches if provided in token
    if (email && userData.user.email !== email) {
      console.error('Email mismatch:', { tokenEmail: email, userEmail: userData.user.email });
      return NextResponse.json(
        { error: 'User mismatch', message: 'Token user information does not match' },
        { status: 403 }
      );
    }

    // Step 4: Session Creation - Create a new Supabase session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId
    });

    if (sessionError) {
      console.error('Session creation failed:', sessionError);
      return NextResponse.json(
        { error: 'Session creation failed', message: 'Unable to create Supabase session' },
        { status: 500 }
      );
    }

    if (!sessionData || !sessionData.session) {
      console.error('Session data missing after creation');
      return NextResponse.json(
        { error: 'Session creation failed', message: 'Session was not properly created' },
        { status: 500 }
      );
    }

    // Return successful response with session tokens
    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
        token_type: sessionData.session.token_type,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          role: userData.user.role
        }
      }
    }, { status: 200 });

  } catch (error) {
    // Catch-all error handler
    console.error('Unexpected error in create-supabase-session:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'An unexpected error occurred while processing the request' 
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';