import { getServerSession } from 'next-auth';
import { authConfig } from './auth';
import { redirect } from 'next/navigation';

/**
 * Authentication helper utilities
 * 
 * Requirements:
 * - 11.1: Support email, Google, and phone OTP authentication
 * - 11.2: Authenticate and redirect to Dashboard within 1 second
 * - 11.7: Preserve intended destination on session expiry
 */

// Re-export utility functions from auth-utils
export {
  validateBangladeshPhone,
  formatBangladeshPhone,
  normalizeBangladeshPhone,
  validateEmail,
  validatePassword,
  generateCallbackUrl,
  getCallbackUrl,
} from './auth-utils';

/**
 * Server-side helper to get the current session
 * Throws an error if not authenticated
 */
export async function getRequiredSession() {
  const session = await getServerSession(authConfig);

  if (!session) {
    throw new Error('Not authenticated');
  }

  return session;
}

/**
 * Server-side helper to get the current session or redirect to login
 * Use in Server Components that require authentication
 */
export async function getSessionOrRedirect(callbackUrl?: string) {
  const session = await getServerSession(authConfig);

  if (!session) {
    const loginUrl = callbackUrl
      ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/auth/login';
    redirect(loginUrl);
  }

  return session;
}

/**
 * Server-side helper to check if user is authenticated
 * Returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authConfig);
  return !!session;
}

/**
 * Server-side helper to get user ID from session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authConfig);
  return session?.user?.id || null;
}

/**
 * Server-side helper to check if user has completed onboarding
 * Returns false if not authenticated or onboarding not completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const session = await getServerSession(authConfig);
  return session?.user?.onboardingCompleted === true;
}
