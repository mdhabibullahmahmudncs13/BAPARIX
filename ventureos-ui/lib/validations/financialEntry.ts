import { z } from 'zod';

/**
 * Validation schemas for financial entry form
 * Requirements: 8.8
 */

// Revenue categories
export const REVENUE_CATEGORIES = [
  'product_sales',
  'service_income',
  'wholesale',
  'retail',
  'online_sales',
  'export_income',
  'commission',
  'other_revenue',
] as const;

// Expense categories
export const EXPENSE_CATEGORIES = [
  'product_cost',
  'shipping',
  'customs_duty',
  'marketing',
  'rent',
  'utilities',
  'salary',
  'packaging',
  'platform_fees',
  'tax',
  'other_expense',
] as const;

// Subcategories mapped by category
export const SUBCATEGORIES: Record<string, readonly string[]> = {
  product_sales: ['electronics', 'fashion', 'home_lifestyle', 'beauty', 'food'],
  service_income: ['consulting', 'delivery', 'installation', 'maintenance'],
  wholesale: ['bulk_order', 'distributor', 'b2b'],
  retail: ['store', 'online', 'marketplace'],
  online_sales: ['facebook', 'daraz', 'shajgoj', 'website'],
  export_income: ['direct_export', 'agent_export'],
  product_cost: ['raw_materials', 'finished_goods', 'samples'],
  shipping: ['domestic', 'international', 'courier', 'freight'],
  customs_duty: ['import_duty', 'vat', 'supplementary_duty'],
  marketing: ['social_media', 'google_ads', 'print', 'influencer'],
  rent: ['warehouse', 'office', 'store'],
  utilities: ['electricity', 'internet', 'phone', 'water'],
  salary: ['full_time', 'part_time', 'freelancer'],
  packaging: ['boxes', 'labels', 'wrapping'],
  platform_fees: ['daraz_commission', 'payment_gateway', 'subscription'],
  tax: ['income_tax', 'vat', 'trade_license'],
} as const;

// Payment methods
export const PAYMENT_METHODS = [
  'cash',
  'bkash',
  'nagad',
  'rocket',
  'bank_transfer',
  'card',
  'other',
] as const;

// Financial entry form schema
export const financialEntrySchema = z.object({
  type: z.enum(['revenue', 'expense'], {
    required_error: 'Type is required',
  }),
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .max(100000000, 'Amount cannot exceed ৳10,00,00,000'),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required'),
  subcategory: z.string().optional(),
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters'),
  date: z
    .string({ required_error: 'Date is required' })
    .min(1, 'Date is required'),
  productId: z.string().optional(),
  paymentMethod: z.string().optional(),
});

// Type exports
export type FinancialEntryFormData = z.infer<typeof financialEntrySchema>;
export type RevenueCategory = (typeof REVENUE_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
