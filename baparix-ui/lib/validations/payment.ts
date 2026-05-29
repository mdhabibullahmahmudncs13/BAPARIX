import { z } from 'zod';

/**
 * Validation schemas for payment form
 * Requirements: 18.2, 18.3
 */

// Payment method options
export const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'sslcommerz'] as const;

// Mobile payment methods that require a phone number
export const MOBILE_PAYMENT_METHODS = ['bkash', 'nagad', 'rocket'] as const;

// Subscription tiers with pricing
export const SUBSCRIPTION_TIERS = {
  pro: { price: 999, label: 'Pro' },
  enterprise: { price: 3499, label: 'Enterprise' },
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type MobilePaymentMethod = (typeof MOBILE_PAYMENT_METHODS)[number];
export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Check if a payment method is a mobile payment method (requires phone number).
 */
export function isMobilePaymentMethod(method: string): method is MobilePaymentMethod {
  return MOBILE_PAYMENT_METHODS.includes(method as MobilePaymentMethod);
}

// Bangladesh phone number regex
const BD_PHONE_REGEX = /^(\+880|880|0)?1[3-9]\d{8}$/;

// Payment form schema with conditional phone validation
export const paymentFormSchema = z.object({
  paymentMethod: z
    .string({ required_error: 'Payment method is required' })
    .refine((val) => PAYMENT_METHODS.includes(val as PaymentMethod), {
      message: 'Invalid payment method',
    }),
  phoneNumber: z.string().optional(),
  tierId: z
    .string({ required_error: 'Subscription tier is required' })
    .refine((val) => val === 'pro' || val === 'enterprise', {
      message: 'Invalid subscription tier',
    }),
}).refine(
  (data) => {
    // Phone number is required for mobile payment methods
    if (isMobilePaymentMethod(data.paymentMethod)) {
      return !!data.phoneNumber && BD_PHONE_REGEX.test(data.phoneNumber);
    }
    return true;
  },
  {
    message: 'Valid Bangladesh phone number is required for mobile payments',
    path: ['phoneNumber'],
  }
);

// Type exports
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
