import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Server-side JWT Verification Endpoint
 * 
 * This endpoint verifies JWT tokens for embedded ProgressPath views.
 * It validates the token signature, checks expiration, and verifies permissions
 * without exposing any secrets to the client.
 * 
 * Security Features:
 * - Server-side only verification (secrets never exposed to client)
 * - Token expiration validation
 * - Permission-based access control
 * - Same secret hierarchy as generation endpoint
 * - Detailed error responses for debugging (without exposing secrets)
 */

/**
 * Get JWT secret using the same hierarchy as the generation endpoint
 * Priority order:
 * 1. JWT_EMBED_SECRET - Dedicated secret for embed tokens
 * 2. JWT_SECRET - Alternative naming convention
 * 3. SUPABASE_SERVICE_ROLE_KEY - Fallback for backward compatibility
 */
function getJWTSecret() {
  const secret = 
    process.env.JWT_EMBED_SECRET || 
    process.env.JWT_SECRET || 
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!secret) {
    throw new Error('JWT secret not configured. Please set JWT_EMBED_SECRET, JWT_SECRET, or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  }
  
  return secret;
}

/**
 * Verify JWT token and extract payload
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    const secret = getJWTSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'], // Only allow HMAC SHA-256
      complete: false // Return payload only, not full token
    });
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token signature');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    } else {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }
}

/**
 * Validate permissions from decoded token
 * @param {Object} payload - Decoded JWT payload
 * @returns {Object} Validation result with user data or error
 */
function validatePermissions(payload) {
  // Check required fields
  if (!payload.userId) {
    return {
      valid: false,
      error: 'Token missing required userId field'
    };
  }

  // Validate token type if present
  if (payload.type && payload.type !== 'embed') {
    return {
      valid: false,
      error: 'Invalid token type. Expected "embed" token.'
    };
  }

  // Check if token has expired (additional check beyond jwt.verify)
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return {
      valid: false,
      error: 'Token has expired'
    };
  }

  // Extract safe user data (never include sensitive fields)
  const userData = {
    userId: payload.userId,
    username: payload.username || null,
    email: payload.email || null,
    permissions: payload.permissions || ['read'], // Default to read-only
    issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
  };

  return {
    valid: true,
    userData
  };
}

/**
 * GET /api/embed/verify
 * 
 * Verifies a JWT token and returns the verified user data.
 * 
 * Query Parameters:
 * - token: JWT token to verify (required)
 * 
 * Response:
 * - 200: Token valid, returns user data
 * - 400: Missing or invalid token
 * - 401: Token expired or invalid signature
 * - 403: Insufficient permissions
 * - 500: Server error
 */
export async function GET(request) {
  try {
    // Extract token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        {
          error: 'Missing token parameter',
          message: 'Please provide a token in the query string: ?token=YOUR_TOKEN'
        },
        { status: 400 }
      );
    }

    // Verify token signature and expiration
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Token verification failed',
          message: error.message
        },
        { status: 401 }
      );
    }

    // Validate permissions
    const validation = validatePermissions(payload);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Permission validation failed',
          message: validation.error
        },
        { status: 403 }
      );
    }

    // Return verified user data
    return NextResponse.json(
      {
        success: true,
        verified: true,
        user: validation.userData,
        message: 'Token verified successfully'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('JWT verification error:', error);
    
    // Return generic error without exposing internal details
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during token verification'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/embed/verify
 * 
 * Alternative method for token verification via POST body.
 * Useful when token is too long for URL or for better security.
 * 
 * Body:
 * - token: JWT token to verify (required)
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const token = body.token;

    // Validate token presence
    if (!token) {
      return NextResponse.json(
        {
          error: 'Missing token in request body',
          message: 'Please provide a token in the request body: { "token": "YOUR_TOKEN" }'
        },
        { status: 400 }
      );
    }

    // Verify token signature and expiration
    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Token verification failed',
          message: error.message
        },
        { status: 401 }
      );
    }

    // Validate permissions
    const validation = validatePermissions(payload);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Permission validation failed',
          message: validation.error
        },
        { status: 403 }
      );
    }

    // Return verified user data
    return NextResponse.json(
      {
        success: true,
        verified: true,
        user: validation.userData,
        message: 'Token verified successfully'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );

  } catch (error) {
    console.error('JWT verification error:', error);
    
    // Return generic error without exposing internal details
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during token verification'
      },
      { status: 500 }
    );
  }
}
