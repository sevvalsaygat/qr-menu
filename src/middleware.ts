import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/admin'];

// Define auth routes that should redirect to dashboard if already authenticated
// In App Router, route group names like (auth) do not appear in URL paths
const authRoutes = ['/signin', '/signup'];

// Define public routes that don't require authentication
// const publicRoutes = ['/menu', '/api/public'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the Firebase auth token from cookies
  const authToken = request.cookies.get('__session')?.value;
  const isAuthenticated = Boolean(authToken);

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is a public route
  // const isPublicRoute = publicRoutes.some(route => 
  //   pathname.startsWith(route)
  // );

  // Handle protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Handle auth routes - redirect to dashboard if already authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle root redirect
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  // Allow all other routes to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};