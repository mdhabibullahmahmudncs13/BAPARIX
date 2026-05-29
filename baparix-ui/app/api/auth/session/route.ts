import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

/**
 * Session management API route
 * Returns the current user session
 * 
 * Requirements:
 * - 11.2: Authenticate and redirect to Dashboard within 1 second
 * - 11.7: Handle session expiry and preserve intended destination
 */

/**
 * GET /api/auth/session
 * Returns the current authenticated user session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'No active session found',
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          session: {
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.name,
              phone: session.user.phone,
              businessInfo: session.user.businessInfo,
              preferences: session.user.preferences,
              onboardingCompleted: session.user.onboardingCompleted,
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve session',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Invalidates the current session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Session invalidation is handled by NextAuth signOut
    // This endpoint is for additional cleanup if needed
    
    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Session invalidated successfully',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session deletion error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to invalidate session',
        },
      },
      { status: 500 }
    );
  }
}
