import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;
const EMBED_ROUTES = ['/embed', '/api/embed'];

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
async function verifyJWTToken(token) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
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
 * Check if the request is for an embed route
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if embed route
 */
function isEmbedRoute(pathname) {
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

  // Only apply authentication to embed routes
  if (!isEmbedRoute(pathname)) {
    return NextResponse.next();
  }

  // Extract token from request
  const token = extractToken(request);

  // If no token is provided for embed routes, deny access
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
