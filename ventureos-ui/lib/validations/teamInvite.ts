import { z } from 'zod';
import type { MemberRole } from '@/lib/utils/permissions';

/**
 * Validation schemas for team member invitation form
 * Requirements: 10.5
 */

/**
 * Regex for validating email addresses.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Regex for validating phone numbers.
 * Accepts formats: +8801XXXXXXXXX, 01XXXXXXXXX, or international formats with +.
 */
const PHONE_REGEX = /^(\+?\d{1,4})?[\s-]?\d{7,14}$/;

/**
 * All roles available for invitation.
 */
export const INVITE_ROLES: MemberRole[] = ['owner', 'co-founder', 'manager', 'analyst', 'guest'];

/**
 * Determines if a string is a valid email address.
 */
export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/**
 * Determines if a string is a valid phone number.
 */
export function isPhoneNumber(value: string): boolean {
  return PHONE_REGEX.test(value.trim().replace(/[\s-]/g, ''));
}

/**
 * Team invite form schema.
 * The contact field accepts either a valid email or a valid phone number.
 */
export const teamInviteSchema = z.object({
  contact: z
    .string({ required_error: 'contactRequired' })
    .min(1, 'contactRequired')
    .refine(
      (value) => isEmail(value) || isPhoneNumber(value),
      { message: 'contactInvalid' }
    ),
  role: z
    .string({ required_error: 'roleRequired' })
    .min(1, 'roleRequired')
    .refine(
      (value) => INVITE_ROLES.includes(value as MemberRole),
      { message: 'roleInvalid' }
    ),
});

export type TeamInviteFormData = z.infer<typeof teamInviteSchema>;
