import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  otpSchema,
  loginSchema,
  signupSchema,
  phoneOTPLoginSchema,
  sendOTPSchema,
} from './auth';

describe('Auth Validation Schemas', () => {
  describe('emailSchema', () => {
    it('validates correct email', () => {
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com');
    });

    it('rejects invalid email', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
    });

    it('rejects empty email', () => {
      expect(() => emailSchema.parse('')).toThrow('Email is required');
    });
  });

  describe('passwordSchema', () => {
    it('validates correct password', () => {
      expect(passwordSchema.parse('Password123')).toBe('Password123');
    });

    it('rejects password without uppercase', () => {
      expect(() => passwordSchema.parse('password123')).toThrow();
    });

    it('rejects password without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow();
    });

    it('rejects password without number', () => {
      expect(() => passwordSchema.parse('Password')).toThrow();
    });

    it('rejects password shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow();
    });
  });

  describe('phoneSchema', () => {
    it('validates Bangladesh phone number with +880', () => {
      expect(phoneSchema.parse('+8801712345678')).toBe('+8801712345678');
    });

    it('validates Bangladesh phone number with 880', () => {
      expect(phoneSchema.parse('8801712345678')).toBe('8801712345678');
    });

    it('validates Bangladesh phone number with 0', () => {
      expect(phoneSchema.parse('01712345678')).toBe('01712345678');
    });

    it('rejects invalid Bangladesh phone number', () => {
      expect(() => phoneSchema.parse('1234567890')).toThrow();
    });

    it('rejects empty phone number', () => {
      expect(() => phoneSchema.parse('')).toThrow();
    });
  });

  describe('otpSchema', () => {
    it('validates 6-digit OTP', () => {
      expect(otpSchema.parse('123456')).toBe('123456');
    });

    it('rejects OTP with less than 6 digits', () => {
      expect(() => otpSchema.parse('12345')).toThrow();
    });

    it('rejects OTP with more than 6 digits', () => {
      expect(() => otpSchema.parse('1234567')).toThrow();
    });

    it('rejects OTP with non-numeric characters', () => {
      expect(() => otpSchema.parse('12345a')).toThrow();
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(loginSchema.parse(data)).toEqual(data);
    });

    it('rejects login without email', () => {
      const data = {
        email: '',
        password: 'password123',
      };
      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('rejects login without password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
      };
      expect(() => loginSchema.parse(data)).toThrow();
    });
  });

  describe('signupSchema', () => {
    it('validates correct signup data', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      expect(signupSchema.parse(data)).toEqual(data);
    });

    it('validates signup data with optional phone', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        phone: '+8801712345678',
      };
      expect(signupSchema.parse(data)).toEqual(data);
    });

    it('rejects signup with mismatched passwords', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
      };
      expect(() => signupSchema.parse(data)).toThrow();
    });

    it('rejects signup with short name', () => {
      const data = {
        name: 'J',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      expect(() => signupSchema.parse(data)).toThrow();
    });

    it('rejects signup with weak password', () => {
      const data = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };
      expect(() => signupSchema.parse(data)).toThrow();
    });
  });

  describe('phoneOTPLoginSchema', () => {
    it('validates correct phone OTP login data', () => {
      const data = {
        phone: '+8801712345678',
        otp: '123456',
      };
      expect(phoneOTPLoginSchema.parse(data)).toEqual(data);
    });

    it('rejects phone OTP login without phone', () => {
      const data = {
        phone: '',
        otp: '123456',
      };
      expect(() => phoneOTPLoginSchema.parse(data)).toThrow();
    });

    it('rejects phone OTP login without OTP', () => {
      const data = {
        phone: '+8801712345678',
        otp: '',
      };
      expect(() => phoneOTPLoginSchema.parse(data)).toThrow();
    });
  });

  describe('sendOTPSchema', () => {
    it('validates correct send OTP data', () => {
      const data = {
        phone: '+8801712345678',
      };
      expect(sendOTPSchema.parse(data)).toEqual(data);
    });

    it('rejects send OTP without phone', () => {
      const data = {
        phone: '',
      };
      expect(() => sendOTPSchema.parse(data)).toThrow();
    });

    it('rejects send OTP with invalid phone', () => {
      const data = {
        phone: '1234567890',
      };
      expect(() => sendOTPSchema.parse(data)).toThrow();
    });
  });
});
