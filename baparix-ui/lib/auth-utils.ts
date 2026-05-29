/**
 * Authentication utility functions (client and server safe)
 * These functions don't depend on Next.js server context
 * 
 * Requirements:
 * - 11.1: Support email, Google, and phone OTP authentication
 */

/**
 * Validates Bangladesh phone number format
 * Supports formats: +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX
 */
export function validateBangladeshPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  
  // Check for different formats
  // +8801XXXXXXXXX or 8801XXXXXXXXX (with country code)
  if (/^(\+880|880)1[3-9]\d{8}$/.test(cleaned)) {
    return true;
  }
  
  // 01XXXXXXXXX (without country code)
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return true;
  }
  
  return false;
}

/**
 * Formats Bangladesh phone number to standard format
 * Output format: +880 1XXX-XXXXXX
 */
export function formatBangladeshPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  
  // Remove country code if present
  let number = cleaned;
  if (cleaned.startsWith('+880')) {
    number = cleaned.substring(4);
  } else if (cleaned.startsWith('880')) {
    number = cleaned.substring(3);
  }

  // Remove leading 0 if present
  if (number.length === 11 && number.startsWith('0')) {
    number = number.substring(1);
  }

  // Format as +880 1XXX-XXXXXX
  return `+880 ${number.substring(0, 4)}-${number.substring(4)}`;
}

/**
 * Normalizes Bangladesh phone number to E.164 format
 * Output format: +8801XXXXXXXXX
 */
export function normalizeBangladeshPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
  
  // Remove country code if present
  let number = cleaned;
  if (cleaned.startsWith('+880')) {
    number = cleaned.substring(4);
  } else if (cleaned.startsWith('880')) {
    number = cleaned.substring(3);
  }

  // Remove leading 0 if present
  if (number.length === 11 && number.startsWith('0')) {
    number = number.substring(1);
  }

  return `+880${number}`;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a secure callback URL for post-authentication redirect
 * Ensures the URL is safe and within the application domain
 */
export function generateCallbackUrl(
  intendedPath: string,
  baseUrl: string
): string {
  try {
    // If the path is empty, return default
    if (!intendedPath || intendedPath.trim() === '') {
      return '/dashboard';
    }
    
    // If it's already a full URL, validate it
    if (intendedPath.startsWith('http://') || intendedPath.startsWith('https://')) {
      const url = new URL(intendedPath);
      const base = new URL(baseUrl);
      
      // Only allow same-origin URLs
      if (url.origin !== base.origin) {
        return '/dashboard';
      }
      
      return url.pathname;
    }
    
    // Ensure the path starts with /
    const path = intendedPath.startsWith('/') ? intendedPath : `/${intendedPath}`;
    
    // Validate that it's a valid path (no spaces, valid characters)
    if (/\s/.test(path) || !/^\/[\w\-\/]*$/.test(path)) {
      return '/dashboard';
    }
    
    // Validate that it's a valid URL path
    try {
      new URL(path, baseUrl);
      return path;
    } catch {
      return '/dashboard';
    }
  } catch {
    // If anything fails, return default
    return '/dashboard';
  }
}

/**
 * Extracts callback URL from request or returns default
 */
export function getCallbackUrl(
  searchParams: URLSearchParams,
  defaultUrl: string = '/dashboard'
): string {
  const callbackUrl = searchParams.get('callbackUrl');
  
  if (!callbackUrl) {
    return defaultUrl;
  }
  
  // Ensure callback URL is safe (starts with /)
  if (!callbackUrl.startsWith('/')) {
    return defaultUrl;
  }
  
  return callbackUrl;
}
