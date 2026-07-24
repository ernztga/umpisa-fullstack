import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'access_token';
const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Edge middleware providing route-protection UX: redirects to /login
 * if there's obviously no session cookie present, BEFORE the page
 * itself renders (avoiding a flash of protected content).
 *
 * This is NOT the real security boundary — it only checks cookie
 * PRESENCE, not JWT validity (see architectural decision 2.1). The
 * actual authorization enforcement happens server-side, on every
 * GraphQL request, via the API's requireAuth wrapper (Step 4) — this
 * middleware existing or not existing has zero effect on whether an
 * attacker could access another user's data, because the API never
 * trusts the frontend's judgment about who's logged in.
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
    // Already have a session cookie and trying to visit /login or
    // /register — bounce to the dashboard instead. (Still just a UX
    // nicety: if the cookie turns out to be expired, the dashboard's
    // own `me` check will catch that and redirect back appropriately.)
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every path EXCEPT static assets/Next internals — no point
  // spending edge middleware cycles on files that were never protected.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
