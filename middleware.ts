import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

/**
 * Unified Authentication & Maintenance Mode Middleware
 * 
 * Environment Variables Required:
 * - MAINTENANCE_MODE: 'true' | 'false' (default: 'false')
 * - MAINTENANCE_SECRET: Secret key for admin bypass
 * - JWT_SECRET: Secret key for JWT tokens
 * 
 * Behavior:
 * 1. Authentication Check:
 *    - All routes except public ones require authentication
 *    - Unauthenticated users are redirected to /login
 * 
 * 2. Maintenance Mode:
 *    - If MAINTENANCE_MODE=true → Redirect public users to /maintenance
 *    - Admin can bypass by visiting /admin-bypass?key=<MAINTENANCE_SECRET>
 *    - Cookie maintenance_bypass=true allows full access
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login',                  // Login page
    '/maintenance',            // Maintenance page
    '/admin-bypass',          // Admin bypass route
    '/_next',                 // Next.js internal files
    '/api/auth/login',        // Login API
    '/api/auth/logout',       // Logout API
    '/api/auth/me',           // Auth check API
    '/api/maintenance/bypass', // Maintenance bypass API
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  // If public path, skip authentication check
  if (isPublicPath) {
    // Still check maintenance mode for public paths
    return handleMaintenanceMode(request)
  }

  // Check authentication for protected paths
  const authToken = request.cookies.get('auth_token')?.value
  
  if (!authToken) {
    // Not authenticated - redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const decoded = verifyToken(authToken)
  if (!decoded) {
    // Invalid token - redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    // Clear invalid token
    response.cookies.delete('auth_token')
    return response
  }

  // Authenticated - check maintenance mode
  return handleMaintenanceMode(request)
}

/**
 * Handle maintenance mode check
 */
function handleMaintenanceMode(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  
  // If maintenance mode is OFF, allow request
  if (!maintenanceMode) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Always allow these paths during maintenance
  const allowedPaths = [
    '/maintenance',
    '/admin-bypass',
    '/_next',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/maintenance/bypass',
  ]

  const isAllowedPath = allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  if (isAllowedPath) {
    return NextResponse.next()
  }

  // Check for maintenance bypass cookie
  const bypassCookie = request.cookies.get('maintenance_bypass')
  if (bypassCookie?.value === 'true') {
    return NextResponse.next()
  }

  // Redirect to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url)
  maintenanceUrl.searchParams.set('redirect', pathname)
  
  return NextResponse.redirect(maintenanceUrl)
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
