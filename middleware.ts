import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Maintenance Mode Middleware
 * 
 * Environment Variables Required:
 * - MAINTENANCE_MODE: 'true' | 'false' (default: 'false')
 * - MAINTENANCE_SECRET: Secret key for admin bypass
 * 
 * Behavior:
 * - If MAINTENANCE_MODE=false → Site works normally
 * - If MAINTENANCE_MODE=true → Redirect public users to /maintenance
 * - Admin can bypass by visiting /admin-bypass?key=<MAINTENANCE_SECRET>
 * - Cookie maintenance_bypass=true allows full access
 */
export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  const maintenanceSecret = process.env.MAINTENANCE_SECRET || ''
  
  // If maintenance mode is OFF, allow all requests
  if (!maintenanceMode) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Always allow these paths (no redirect)
  const allowedPaths = [
    '/maintenance',           // Maintenance page itself
    '/admin-bypass',          // Admin bypass route
    '/_next',                 // Next.js internal files
    '/api/auth/login',        // Allow admin login during maintenance
    '/api/auth/logout',       // Allow logout
    '/api/auth/me',           // Allow auth check
    '/api/maintenance/bypass', // Allow bypass API
  ]

  // Check if path should be allowed
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

  // Redirect all other requests to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url)
  // Preserve the original URL as a query parameter for redirect after maintenance
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
