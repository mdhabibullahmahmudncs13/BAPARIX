'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Custom hook for authentication operations
 * Provides login, logout, and session management
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (
    provider: 'credentials' | 'google' | 'phone-otp',
    credentials?: {
      email?: string;
      password?: string;
      phone?: string;
      otp?: string;
    },
    callbackUrl?: string
  ) => {
    setIsLoading(true);
    try {
      const result = await signIn(provider, {
        ...credentials,
        redirect: false,
        callbackUrl: callbackUrl || '/dashboard',
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.url) {
        router.push(result.url);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (callbackUrl?: string) => {
    setIsLoading(true);
    try {
      await signOut({
        redirect: true,
        callbackUrl: callbackUrl || '/auth/login',
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const result = await response.json();

      // Automatically log in after successful signup
      await login('credentials', {
        email: data.email,
        password: data.password,
      });

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phone: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }

      return await response.json();
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    session,
    user: session?.user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || isLoading,
    login,
    logout,
    signup,
    sendOTP,
  };
}
