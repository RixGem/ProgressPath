import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, SignJWT } from 'jose';

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
    let session, sessionError;

    // Strategy 1: Admin createSession (Best, if available)
    if (typeof supabaseAdmin.auth.admin.createSession === 'function') {
      const result = await supabaseAdmin.auth.admin.createSession({
        user_id: userId
      });
      session = result.data?.session;
      sessionError = result.error;
    } else {
      console.log('[Auth] createSession missing, attempting fallback strategies');
      
      // Strategy 2: Manual JWT Minting (Robust, requires valid JWT_SECRET)
      // This bypasses the need for Supabase to generate a session in the DB, 
      // as Supabase Auth is stateless with JWTs anyway.
      try {
        const secretStr = getJWTSecret();
        // Only attempt if we have a secret to sign with
        if (secretStr) {
          console.log('[Auth] Attempting manual JWT minting');
          const secret = new TextEncoder().encode(secretStr);
          const now = Math.floor(Date.now() / 1000);
          
          // Construct standard Supabase Access Token payload
          // These claims are what Supabase GoTrue issues
          const accessToken = await new SignJWT({
            aud: 'authenticated',
            sub: userData.user.id,
            email: userData.user.email,
            phone: userData.user.phone || '',
            app_metadata: userData.user.app_metadata || { provider: 'email', providers: ['email'] },
            user_metadata: userData.user.user_metadata || {},
            role: 'authenticated',
            aal: 'aal1',
            amr: [{ method: 'password', timestamp: now }],
            session_id: crypto.randomUUID()
          })
          .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
          .setIssuedAt(now)
          .setExpirationTime(now + 3600) // 1 hour expiration
          .sign(secret);

          session = {
            access_token: accessToken,
            // Provide a dummy refresh token. The client won't be able to refresh 
            // automatically without a DB session, but the initial load will work.
            refresh_token: 'dummy_refresh_token_manual_mint', 
            expires_in: 3600,
            expires_at: now + 3600,
            token_type: 'bearer',
            user: userData.user
          };
        }
      } catch (mintError) {
        console.error('[Auth] Manual minting failed:', mintError);
        // Fall through to Strategy 3
      }

      // Strategy 3: Magic Link Fallback (Last resort)
      // Only run if manual minting didn't produce a session
      if (!session) {
        console.log('[Auth] Attempting fallback to generateLink flow');
        try {
          const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.user.email
          });

          if (linkError) throw linkError;

          const actionLink = linkData?.properties?.action_link;
          if (!actionLink) throw new Error('No action link generated');

          console.log('[Auth] Generated Link params:', actionLink.split('?')[1]);

          const linkUrl = new URL(actionLink);
          const authCode = linkUrl.searchParams.get('code');
          const verifyToken = linkUrl.searchParams.get('token');
          const tokenHash = linkUrl.searchParams.get('token_hash');

          if (authCode) {
            console.log('[Auth] Using PKCE code flow');
            const result = await supabaseAdmin.auth.exchangeCodeForSession(authCode);
            session = result.data?.session;
            sessionError = result.error;
          } else if (tokenHash) {
            console.log('[Auth] Using token_hash flow');
            const result = await supabaseAdmin.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email',
              email: userData.user.email
            });
            session = result.data?.session;
            sessionError = result.error;
          } else if (verifyToken) {
            console.log('[Auth] Using legacy token flow');
            const result = await supabaseAdmin.auth.verifyOtp({
              email: userData.user.email,
              token: verifyToken,
              type: 'magiclink'
            });
            session = result.data?.session;
            sessionError = result.error;
          } else {
            throw new Error('No valid token/code found in link');
          }
        } catch (e) {
          console.error('[Auth] Fallback failed:', e);
          sessionError = e;
        }
      }
    }

    if (sessionError) {
      console.error('Session creation failed:', sessionError);
      return NextResponse.json(
        { error: 'Session creation failed', message: 'Unable to create Supabase session', details: sessionError.message },
        { status: 500 }
      );
    }

    if (!session) {
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
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
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