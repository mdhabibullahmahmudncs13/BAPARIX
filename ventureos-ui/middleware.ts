import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { getToken } from 'next-auth/jwt';

/**
 * Combined middleware for internationalization and authentication
 * 
 * Requirements:
 * - 11.7: Preserve intended destination on session expiry
 * - Validates locale and applies i18n
 * - Checks authentication for protected routes
 * - Redirects unauthenticated users to login with callbackUrl
 */

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Locale detection strategy
  localeDetection: true,

  // Locale prefix strategy
  localePrefix: 'always',
});

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/products',
  '/market-intelligence',
  '/blueprint',
  '/shipping',
  '/financial',
  '/seo',
  '/team',
  '/settings',
  '/onboarding',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/error',
  '/auth/verify',
];

/**
 * Validates if a locale is supported
 */
function isValidLocale(locale: string): boolean {
  return locales.includes(locale);
}

/**
 * Extracts locale from pathname
 */
function extractLocale(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return isValidLocale(potentialLocale) ? potentialLocale : 'en';
}

/**
 * Removes locale prefix from pathname
 */
function removeLocalePrefix(pathname: string, locale: string): string {
  return pathname.replace(`/${locale}`, '') || '/';
}

/**
 * Checks if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Checks if a route is protected (requires authentication)
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and special Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply internationalization middleware first
  const intlResponse = intlMiddleware(request);

  // Extract and validate locale
  const locale = extractLocale(pathname);
  
  // If locale is invalid, redirect to default locale
  if (!isValidLocale(locale) && !pathname.startsWith(`/${locales[0]}`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locales[0]}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Remove locale prefix to check route
  const pathnameWithoutLocale = removeLocalePrefix(pathname, locale);

  // Skip auth check for public routes
  if (isPublicRoute(pathnameWithoutLocale)) {
    return intlResponse;
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathnameWithoutLocale)) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token) {
        // Redirect to login with callback URL to preserve intended destination (Requirement 11.7)
        const loginUrl = new URL(`/${locale}/auth/login`, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        
        const response = NextResponse.redirect(loginUrl);
        
        // Set a cookie to remember the intended destination
        response.cookies.set('intended-destination', pathname, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 10, // 10 minutes
        });
        
        return response;
      }

      // Check if user has completed onboarding for non-onboarding routes
      if (
        !pathnameWithoutLocale.startsWith('/onboarding') &&
        token.onboardingCompleted === false
      ) {
        const onboardingUrl = new URL(`/${locale}/onboarding`, request.url);
        return NextResponse.redirect(onboardingUrl);
      }
    } catch (error) {
      console.error('Middleware authentication error:', error);
      // On error, redirect to login
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set('error', 'AuthenticationError');
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)',
  ],
};
