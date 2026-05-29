import { z } from 'zod';

/**
 * Validation schemas for shipping calculator form
 * Requirements: 7.1
 */

// Bangladesh cities for destination dropdown
export const BANGLADESH_CITIES = [
  'Dhaka',
  'Chittagong',
  'Khulna',
  'Rajshahi',
  'Sylhet',
  'Rangpur',
  'Barisal',
  'Comilla',
  'Gazipur',
  'Narayanganj',
  'Mymensingh',
  'Bogra',
  'Cox\'s Bazar',
  'Jessore',
  'Dinajpur',
  'Brahmanbaria',
  'Tangail',
  'Narsingdi',
  'Savar',
  'Tongi',
] as const;

// Product categories for shipping
export const PRODUCT_CATEGORIES = [
  'electronics',
  'fashion',
  'home_lifestyle',
  'beauty',
  'sports',
  'food_beverage',
  'machinery',
  'textiles',
  'chemicals',
  'other',
] as const;

// Dimensions schema
export const dimensionsSchema = z.object({
  length: z
    .number({ required_error: 'Length is required', invalid_type_error: 'Length must be a number' })
    .positive('Length must be greater than 0')
    .max(500, 'Length cannot exceed 500 cm'),
  width: z
    .number({ required_error: 'Width is required', invalid_type_error: 'Width must be a number' })
    .positive('Width must be greater than 0')
    .max(500, 'Width cannot exceed 500 cm'),
  height: z
    .number({ required_error: 'Height is required', invalid_type_error: 'Height must be a number' })
    .positive('Height must be greater than 0')
    .max(500, 'Height cannot exceed 500 cm'),
});

// Shipping form schema
export const shippingFormSchema = z.object({
  weight: z
    .number({ required_error: 'Weight is required', invalid_type_error: 'Weight must be a number' })
    .positive('Weight must be greater than 0')
    .max(10000, 'Weight cannot exceed 10,000 kg'),
  dimensions: dimensionsSchema,
  destination: z
    .string({ required_error: 'Destination is required' })
    .min(1, 'Destination is required'),
  productCategory: z
    .string({ required_error: 'Product category is required' })
    .min(1, 'Product category is required'),
});

// Type exports
export type ShippingFormData = z.infer<typeof shippingFormSchema>;
export type Dimensions = z.infer<typeof dimensionsSchema>;
export type BangladeshCity = (typeof BANGLADESH_CITIES)[number];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
