import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, access-denied page, and public assets
  // Authentication is handled client-side in OwnerLayout
  if (
    pathname === '/owner/login' || 
    pathname === '/owner/access-denied' ||
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // For all other /owner routes, let them through
  // Client-side auth checks in OwnerLayout will handle redirects
  return NextResponse.next();
}

export const config = {
  matcher: '/owner/:path*',
};

