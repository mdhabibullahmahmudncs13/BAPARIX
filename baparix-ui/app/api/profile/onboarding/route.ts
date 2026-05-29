import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Save Onboarding Data
 * Requirements: 3.6
 * 
 * POST /api/profile/onboarding
 * Saves onboarding data to user profile and marks onboarding as completed
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    // Note: In a real implementation, you would use getServerSession from next-auth
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      businessType,
      location,
      productIdea,
      totalInvestment,
      teamSize,
      warehouseCapacity,
      accountType,
      targetCountries,
      currencies,
    } = body;

    // Validate required fields
    if (!businessType || !location || !productIdea || !totalInvestment || 
        !teamSize || !warehouseCapacity || !accountType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate international account fields
    if (accountType === 'international' && (!targetCountries || !currencies)) {
      return NextResponse.json(
        { error: 'Target countries and currencies are required for international accounts' },
        { status: 400 }
      );
    }

    // Call backend API to save onboarding data
    // In a real implementation, extract user ID from session
    const userId = 'user-id-from-session';
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/onboarding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          businessType,
          location,
          productIdea,
          totalInvestment: parseFloat(totalInvestment),
          teamSize: parseInt(teamSize, 10),
          warehouseCapacity: parseFloat(warehouseCapacity),
          accountType,
          targetCountries: accountType === 'international' ? targetCountries : null,
          currencies: accountType === 'international' ? currencies : null,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to save onboarding data' },
        { status: response.status }
      );
    }

    const updatedUser = await response.json();

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
