import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Verify OTP API route
 * Verifies the OTP sent to user's phone number
 * 
 * Requirements:
 * - 11.1: Support phone OTP authentication via bKash number
 */

// Validation schema for OTP verification
const verifyOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+880|880)?1[3-9]\d{8}$/,
      'Invalid Bangladesh phone number format'
    ),
  otp: z
    .string()
    .min(4, 'OTP must be at least 4 characters')
    .max(6, 'OTP must be at most 6 characters')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = verifyOtpSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { phone, otp } = validationResult.data;

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, '');
    const formattedPhone = normalizedPhone.startsWith('+880')
      ? normalizedPhone
      : normalizedPhone.startsWith('880')
      ? `+${normalizedPhone}`
      : `+880${normalizedPhone.substring(1)}`;

    // Call backend API to verify OTP
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          otp,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_OTP',
              message: 'Invalid or expired OTP',
            },
          },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many verification attempts. Please try again later.',
            },
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code || 'VERIFICATION_FAILED',
            message: error.message || 'Failed to verify OTP',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'OTP verified successfully',
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            phone: data.user.phone,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      },
      { status: 500 }
    );
  }
}
