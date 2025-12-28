import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ============================================================================
// SECURITY FIX #1: JWT Secret Protection
// ============================================================================
// REMOVED: process.env.NEXT_PUBLIC_JWT_SECRET fallback
// The JWT secret MUST be server-side only to prevent client exposure
// Using NEXT_PUBLIC_ prefix exposes the secret to client-side JavaScript

/**
 * Get JWT secret using the same hierarchy as other endpoints
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
  
  return secret;
}

/**
 * Embed routes that REQUIRE authentication
 * These routes need a valid JWT token to access
 */
const EMBED_ROUTES = ['/embed', '/api/embed'];

/**
 * Public embed routes that DO NOT require authentication
 * /embed/settings is public because users need to access it to generate tokens
 * This is intentional - users must visit this page to create authentication tokens
 * for embedding their progress dashboards elsewhere.
 */
const PUBLIC_EMBED_ROUTES = ['/embed/settings'];

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
async function verifyJWTToken(token) {
  const secretKey = getJWTSecret();
  
  // SECURITY: Fail if no secret is configured
  if (!secretKey) {
    console.error('[SECURITY] JWT secret is not configured');
    console.error('[SECURITY] Set JWT_EMBED_SECRET, JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('[SECURITY] JWT verification failed:', error.message);
    return null;
  }
}

/**
 * Extract JWT token from request
 * @param {Request} request - Next.js request object
 * @returns {string|null} JWT token or null
 */
function extractToken(request) {
  const { searchParams } = new URL(request.url);
  const cookies = request.cookies;

  // 1. Check URL parameter (for initial embed authentication)
  const tokenFromUrl = searchParams.get('token');
  if (tokenFromUrl) {
    return tokenFromUrl;
  }

  // 2. Check cookie (for subsequent requests after authentication)
  const tokenFromCookie = cookies.get('embed_auth_token')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // 3. Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Check if the request is for a public embed route (no authentication required)
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if public embed route
 */
function isPublicEmbedRoute(pathname) {
  return PUBLIC_EMBED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if the request is for an embed route that requires authentication
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if authenticated embed route
 */
function isAuthenticatedEmbedRoute(pathname) {
  return EMBED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Create response with secure authentication cookie
 * @param {NextResponse} response - Response object
 * @param {string} token - JWT token to store
 * @returns {NextResponse} Response with cookie set
 */
function setAuthCookie(response, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set('embed_auth_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none', // Required for iframe/embed scenarios
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}

/**
 * Main middleware function
 * @param {Request} request - Next.js request object
 * @returns {Promise<NextResponse>} Response object
 */
export async function middleware(request) {
  const { pathname } = new URL(request.url);

  // Skip middleware for static files, API routes (except embed API), and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/embed'))
  ) {
    return NextResponse.next();
  }

  // Allow public access to /embed/settings (no authentication required)
  // This is necessary because users need to access this page to generate tokens
  if (isPublicEmbedRoute(pathname)) {
    return NextResponse.next();
  }

  // Only apply authentication to protected embed routes
  if (!isAuthenticatedEmbedRoute(pathname)) {
    return NextResponse.next();
  }

  // Extract token from request
  const token = extractToken(request);

  // If no token is provided for authenticated embed routes, deny access
  if (!token) {
    return new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication token is required for embed access',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY', // Prevent unauthorized embedding
        },
      }
    );
  }

  // Verify the token
  const payload = await verifyJWTToken(token);

  if (!payload) {
    return new NextResponse(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Token is valid - proceed with the request
  const response = NextResponse.next();

  // Set authentication cookie if token was provided via URL parameter
  const { searchParams } = new URL(request.url);
  if (searchParams.get('token')) {
    setAuthCookie(response, token);
  }

  // Add custom headers for embed context
  response.headers.set('X-Embed-Authenticated', 'true');
  response.headers.set('X-Frame-Options', 'ALLOWALL'); // Allow embedding in iframes
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://notion.so https://*.notion.so");
  
  // Add user information to headers for downstream use
  if (payload.userId) {
    response.headers.set('X-User-Id', payload.userId.toString());
  }
  if (payload.email) {
    response.headers.set('X-User-Email', payload.email);
  }

  return response;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
