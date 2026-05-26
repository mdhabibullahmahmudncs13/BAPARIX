import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Unit tests for useAuth hook
 * 
 * Requirements:
 * - 11.1: Support email, Google, and phone OTP authentication
 * - 11.2: Authenticate and redirect to Dashboard within 1 second
 */

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('useAuth', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('session state', () => {
    it('should return authenticated state when session exists', () => {
      const mockSession = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      (useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should return unauthenticated state when no session exists', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
      expect(result.current.session).toBeNull();
    });

    it('should return loading state during session check', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should login with email credentials', async () => {
      (signIn as jest.Mock).mockResolvedValue({
        error: null,
        url: '/dashboard',
      });

      const { result } = renderHook(() => useAuth());

      await result.current.login('credentials', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
        callbackUrl: '/dashboard',
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });

    it('should login with Google OAuth', async () => {
      (signIn as jest.Mock).mockResolvedValue({
        error: null,
        url: '/dashboard',
      });

      const { result } = renderHook(() => useAuth());

      await result.current.login('google', undefined, '/products');

      expect(signIn).toHaveBeenCalledWith('google', {
        redirect: false,
        callbackUrl: '/products',
      });
    });

    it('should login with phone OTP', async () => {
      (signIn as jest.Mock).mockResolvedValue({
        error: null,
        url: '/dashboard',
      });

      const { result } = renderHook(() => useAuth());

      await result.current.login('phone-otp', {
        phone: '+8801712345678',
        otp: '123456',
      });

      expect(signIn).toHaveBeenCalledWith('phone-otp', {
        phone: '+8801712345678',
        otp: '123456',
        redirect: false,
        callbackUrl: '/dashboard',
      });
    });

    it('should handle login errors', async () => {
      (signIn as jest.Mock).mockResolvedValue({
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.login('credentials', {
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '1' } },
        status: 'authenticated',
      });

      (signOut as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await result.current.logout();

      expect(signOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: '/auth/login',
      });
    });

    it('should logout with custom callback URL', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: { id: '1' } },
        status: 'authenticated',
      });

      (signOut as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await result.current.logout('/');

      expect(signOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: '/',
      });
    });
  });

  describe('signup', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should signup successfully and auto-login', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: '1', email: 'test@example.com' } },
        }),
      });

      (signIn as jest.Mock).mockResolvedValue({
        error: null,
        url: '/dashboard',
      });

      const { result } = renderHook(() => useAuth());

      await result.current.signup({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        }),
      });

      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'Password123',
        redirect: false,
        callbackUrl: '/dashboard',
      });
    });

    it('should handle signup errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Email already exists',
        }),
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signup({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('sendOTP', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should send OTP successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'OTP sent' },
        }),
      });

      const { result } = renderHook(() => useAuth());

      const response = await result.current.sendOTP('+8801712345678');

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+8801712345678' }),
      });

      expect(response).toEqual({
        success: true,
        data: { message: 'OTP sent' },
      });
    });

    it('should handle OTP send errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Invalid phone number',
        }),
      });

      const { result } = renderHook(() => useAuth());

      await expect(result.current.sendOTP('invalid')).rejects.toThrow(
        'Invalid phone number'
      );
    });
  });
});
