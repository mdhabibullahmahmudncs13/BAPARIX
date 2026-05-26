import {
  validateBangladeshPhone,
  formatBangladeshPhone,
  normalizeBangladeshPhone,
  validateEmail,
  validatePassword,
  generateCallbackUrl,
  getCallbackUrl,
} from './auth-utils';

/**
 * Unit tests for authentication utility functions
 * 
 * Requirements:
 * - 11.1: Support email, Google, and phone OTP authentication
 * 
 * Note: Server-side functions (getRequiredSession, getSessionOrRedirect, etc.)
 * are not tested here as they require Next.js server context.
 * They will be tested in integration tests.
 */

describe('Auth Utils - Utility Functions', () => {
  describe('validateBangladeshPhone', () => {
    it('should validate correct Bangladesh phone numbers', () => {
      expect(validateBangladeshPhone('+8801712345678')).toBe(true);
      expect(validateBangladeshPhone('8801712345678')).toBe(true);
      expect(validateBangladeshPhone('01712345678')).toBe(true);
      expect(validateBangladeshPhone('+880 1712345678')).toBe(true);
    });

    it('should reject invalid Bangladesh phone numbers', () => {
      expect(validateBangladeshPhone('1712345678')).toBe(false); // Missing country code
      expect(validateBangladeshPhone('+88017123456')).toBe(false); // Too short
      expect(validateBangladeshPhone('+880171234567890')).toBe(false); // Too long
      expect(validateBangladeshPhone('+8800712345678')).toBe(false); // Invalid operator code
      expect(validateBangladeshPhone('+8802712345678')).toBe(false); // Invalid operator code
      expect(validateBangladeshPhone('invalid')).toBe(false);
    });

    it('should handle phone numbers with spaces', () => {
      expect(validateBangladeshPhone('+880 171 234 5678')).toBe(true);
      expect(validateBangladeshPhone('0171 234 5678')).toBe(true);
    });
  });

  describe('formatBangladeshPhone', () => {
    it('should format phone numbers correctly', () => {
      expect(formatBangladeshPhone('+8801712345678')).toBe('+880 1712-345678');
      expect(formatBangladeshPhone('8801712345678')).toBe('+880 1712-345678');
      expect(formatBangladeshPhone('01712345678')).toBe('+880 1712-345678');
    });

    it('should handle phone numbers with spaces', () => {
      expect(formatBangladeshPhone('+880 1712345678')).toBe('+880 1712-345678');
      expect(formatBangladeshPhone('0171 234 5678')).toBe('+880 1712-345678');
    });
  });

  describe('normalizeBangladeshPhone', () => {
    it('should normalize phone numbers to E.164 format', () => {
      expect(normalizeBangladeshPhone('+8801712345678')).toBe('+8801712345678');
      expect(normalizeBangladeshPhone('8801712345678')).toBe('+8801712345678');
      expect(normalizeBangladeshPhone('01712345678')).toBe('+8801712345678');
      expect(normalizeBangladeshPhone('+880 1712-345678')).toBe('+8801712345678');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@example.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateCallbackUrl', () => {
    const baseUrl = 'http://localhost:3000';

    it('should generate valid callback URLs', () => {
      expect(generateCallbackUrl('/dashboard', baseUrl)).toBe('/dashboard');
      expect(generateCallbackUrl('/products', baseUrl)).toBe('/products');
      expect(generateCallbackUrl('dashboard', baseUrl)).toBe('/dashboard');
    });

    it('should reject URLs from different origins', () => {
      expect(generateCallbackUrl('http://evil.com/dashboard', baseUrl)).toBe('/dashboard');
      expect(generateCallbackUrl('https://example.com/page', baseUrl)).toBe('/dashboard');
    });

    it('should handle invalid URLs', () => {
      expect(generateCallbackUrl('not a url', baseUrl)).toBe('/dashboard');
      expect(generateCallbackUrl('', baseUrl)).toBe('/dashboard');
    });
  });

  describe('getCallbackUrl', () => {
    it('should extract callback URL from search params', () => {
      const params = new URLSearchParams('callbackUrl=/dashboard');
      expect(getCallbackUrl(params)).toBe('/dashboard');
    });

    it('should return default URL when no callback URL is provided', () => {
      const params = new URLSearchParams();
      expect(getCallbackUrl(params)).toBe('/dashboard');
      expect(getCallbackUrl(params, '/home')).toBe('/home');
    });

    it('should reject callback URLs that do not start with /', () => {
      const params = new URLSearchParams('callbackUrl=http://evil.com');
      expect(getCallbackUrl(params)).toBe('/dashboard');
    });

    it('should handle valid relative URLs', () => {
      const params = new URLSearchParams('callbackUrl=/products/search');
      expect(getCallbackUrl(params)).toBe('/products/search');
    });
  });
});
