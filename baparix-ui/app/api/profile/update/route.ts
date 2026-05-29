import { NextRequest, NextResponse } from 'next/server';
import { profileUpdateSchema } from '@/lib/validations/profile';

/**
 * API Route: Update User Profile
 * Requirements: 11.3, 11.4
 * 
 * PUT /api/profile/update
 * Updates user profile information with validation
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    // Note: In a real implementation, you would use getServerSession from next-auth
    // For now, we'll use a placeholder that checks headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const profileData = validationResult.data;

    // Call backend API to update profile
    // In a real implementation, extract user ID from session
    const userId = 'user-id-from-session';
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/profile`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(profileData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to update profile' },
        { status: response.status }
      );
    }

    const updatedUser = await response.json();

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
