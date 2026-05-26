'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  loginSchema,
  phoneOTPLoginSchema,
  sendOTPSchema,
  type LoginFormData,
  type PhoneOTPLoginFormData,
  type SendOTPFormData,
} from '@/lib/validations/auth';

/**
 * Login page with email, Google, and phone OTP options
 * Requirements: 11.1, 11.2, 11.7
 */

type LoginMethod = 'email' | 'google' | 'phone';

export default function LoginPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  
  const { login, sendOTP, isLoading } = useAuth();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(error);

  // Email login form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Phone OTP form
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: phoneErrors },
    watch,
  } = useForm<PhoneOTPLoginFormData>({
    resolver: zodResolver(phoneOTPLoginSchema),
  });

  // Send OTP form
  const {
    register: registerSendOTP,
    handleSubmit: handleSubmitSendOTP,
    formState: { errors: sendOTPErrors },
  } = useForm<SendOTPFormData>({
    resolver: zodResolver(sendOTPSchema),
  });

  const phoneValue = watch('phone');

  const onEmailLogin = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      await login('credentials', data, callbackUrl);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t('errors.invalidCredentials'));
    }
  };

  const onGoogleLogin = async () => {
    try {
      setAuthError(null);
      await login('google', undefined, callbackUrl);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google login failed');
    }
  };

  const onSendOTP = async (data: SendOTPFormData) => {
    try {
      setAuthError(null);
      await sendOTP(data.phone);
      setOtpSent(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  };

  const onPhoneLogin = async (data: PhoneOTPLoginFormData) => {
    try {
      setAuthError(null);
      await login('phone-otp', data, callbackUrl);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid OTP');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('welcomeBack')}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {t('getStarted')}
        </p>
      </div>

      {authError && (
        <div
          className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded"
          role="alert"
        >
          <p className="text-sm">{authError}</p>
        </div>
      )}

      {/* Login method tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            loginMethod === 'email'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('email')}
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('google')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            loginMethod === 'google'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod('phone');
            setOtpSent(false);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            loginMethod === 'phone'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('phone')}
        </button>
      </div>

      {/* Email login form */}
      {loginMethod === 'email' && (
        <form onSubmit={handleSubmitEmail(onEmailLogin)} className="space-y-4">
          <Input
            {...registerEmail('email')}
            type="email"
            label={t('email')}
            placeholder="you@example.com"
            error={emailErrors.email?.message}
            autoComplete="email"
            required
          />

          <Input
            {...registerEmail('password')}
            type="password"
            label={t('password')}
            placeholder="••••••••"
            error={emailErrors.password?.message}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                {t('rememberMe')}
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            {t('loginWithEmail')}
          </Button>
        </form>
      )}

      {/* Google login */}
      {loginMethod === 'google' && (
        <div className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onGoogleLogin}
            isLoading={isLoading}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('loginWithGoogle')}
          </Button>
        </div>
      )}

      {/* Phone OTP login */}
      {loginMethod === 'phone' && !otpSent && (
        <form onSubmit={handleSubmitSendOTP(onSendOTP)} className="space-y-4">
          <Input
            {...registerSendOTP('phone')}
            type="tel"
            label={t('phone')}
            placeholder="+880 1XXX-XXXXXX"
            error={sendOTPErrors.phone?.message}
            autoComplete="tel"
            required
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            {t('sendOTP')}
          </Button>
        </form>
      )}

      {loginMethod === 'phone' && otpSent && (
        <form onSubmit={handleSubmitPhone(onPhoneLogin)} className="space-y-4">
          <Input
            {...registerPhone('phone')}
            type="tel"
            label={t('phone')}
            value={phoneValue}
            disabled
          />

          <Input
            {...registerPhone('otp')}
            type="text"
            label={t('otp')}
            placeholder="123456"
            error={phoneErrors.otp?.message}
            maxLength={6}
            required
          />

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('resendOTP')}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            {t('verifyOTP')}
          </Button>
        </form>
      )}

      {/* Sign up link */}
      <div className="text-center text-sm">
        <span className="text-gray-600">{t('dontHaveAccount')} </span>
        <Link
          href="/signup"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          {t('signup')}
        </Link>
      </div>
    </div>
  );
}
