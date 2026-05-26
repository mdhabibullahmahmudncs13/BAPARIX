import { z } from 'zod';

/**
 * Validation schemas for authentication forms
 * Requirements: 11.1, 11.2
 */

// Email validation schema
export const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email address');

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Phone validation schema (Bangladesh format)
export const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Invalid Bangladesh phone number');

// OTP validation schema
export const otpSchema = z.string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Signup form schema
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: phoneSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Phone OTP login schema
export const phoneOTPLoginSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

// Send OTP schema
export const sendOTPSchema = z.object({
  phone: phoneSchema,
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PhoneOTPLoginFormData = z.infer<typeof phoneOTPLoginSchema>;
export type SendOTPFormData = z.infer<typeof sendOTPSchema>;
