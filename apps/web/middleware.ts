import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'access_token';
const PUBLIC_PATHS = ['/login', '/register'];

/**
 * - Provides route-protection UX: redirects to /login if no session cookie present
 * - Not the real security boundary — only checks cookie presence, not JWT validity
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasAccessTokenCookie = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasAccessTokenCookie && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasAccessTokenCookie && isPublicPath) {
    // If cookie exists  and trying to visit /login or /register — redirect to the dashboard instead.
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path EXCEPT static assets/Next internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
