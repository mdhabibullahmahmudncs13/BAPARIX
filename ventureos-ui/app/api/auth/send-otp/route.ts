import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Send OTP API route
 * Sends a one-time password to the user's phone number via bKash
 * 
 * Requirements:
 * - 11.1: Support phone OTP authentication via bKash number
 */

// Validation schema for phone number
const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^(\+880|880)?1[3-9]\d{8}$/,
      'Invalid Bangladesh phone number format. Expected format: +8801XXXXXXXXX or 01XXXXXXXXX'
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = phoneSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { phone } = validationResult.data;

    // Normalize phone number (remove spaces and ensure +880 prefix)
    const normalizedPhone = phone.replace(/\s/g, '');
    const formattedPhone = normalizedPhone.startsWith('+880')
      ? normalizedPhone
      : normalizedPhone.startsWith('880')
      ? `+${normalizedPhone}`
      : `+880${normalizedPhone.substring(1)}`;

    // Call backend API to send OTP
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error cases
      if (response.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many OTP requests. Please try again later.',
            },
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code || 'OTP_SEND_FAILED',
            message: error.message || 'Failed to send OTP',
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
          message: 'OTP sent successfully',
          phone: formattedPhone,
          expiresIn: data.expiresIn || 300, // 5 minutes default
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    
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
