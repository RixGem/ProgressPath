import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/books', '/french']

// Routes that should redirect to home if user is authenticated
const authRoutes = ['/auth/login', '/auth/signup']

export async function middleware(req) {
  const res = NextResponse.next()
  
  try {
    // For now, we'll use a simpler approach without auth-helpers-nextjs
    // This is a basic implementation that checks session client-side
    const { pathname } = req.nextUrl
    
    // If accessing protected route, redirect to login
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      // We'll handle this client-side for now
      return res
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
