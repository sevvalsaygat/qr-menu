import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Check if the path is the dashboard or any dashboard sub-routes
  if (pathname.startsWith('/dashboard')) {
    // For now, we'll let the client-side handle auth checks
    // In production, you might want to verify Firebase tokens here
    return NextResponse.next()
  }

  // Redirect root path to auth page
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
