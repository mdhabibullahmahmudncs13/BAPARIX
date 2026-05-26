import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * User signup API route
 * Creates a new user account with email and password
 * 
 * Requirements:
 * - 11.1: Support email authentication option
 */

// Validation schema for signup request
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^(\+880|880)?1[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = signupSchema.safeParse(body);
    
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

    const { email, password, name, phone } = validationResult.data;

    // Call backend API for user creation
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error cases
      if (response.status === 409) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_EXISTS',
              message: 'An account with this email already exists',
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code || 'SIGNUP_FAILED',
            message: error.message || 'Failed to create account',
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
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            phone: data.user.phone,
          },
          message: 'Account created successfully',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    
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
