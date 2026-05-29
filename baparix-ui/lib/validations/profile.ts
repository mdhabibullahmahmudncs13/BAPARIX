import { z } from 'zod';

/**
 * Validation schemas for user profile forms
 * Requirements: 11.3, 11.4
 */

// Business type enum
export const businessTypeSchema = z.enum([
  'reseller',
  'importer',
  'sme',
  'manufacturer',
]);

// Language preference enum
export const languageSchema = z.enum(['bn', 'en']);

// Currency preference enum
export const currencySchema = z.enum(['BDT', 'USD', 'CNY']);

// Business information schema
export const businessInfoSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  type: businessTypeSchema,
  location: z.string().min(2, 'Location is required'),
  teamSize: z.number().int().min(1, 'Team size must be at least 1'),
  warehouseCapacity: z.number().int().optional(),
});

// User preferences schema
export const preferencesSchema = z.object({
  locale: languageSchema,
  currency: currencySchema,
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
    .optional()
    .or(z.literal('')),
  businessInfo: businessInfoSchema,
  preferences: preferencesSchema,
});

// Type exports
export type BusinessType = z.infer<typeof businessTypeSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
