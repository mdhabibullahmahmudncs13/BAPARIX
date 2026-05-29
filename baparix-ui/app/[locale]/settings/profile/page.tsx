'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { profileUpdateSchema, type ProfileUpdateData } from '@/lib/validations/profile';
import { useState } from 'react';
import React from 'react';

/**
 * User Profile Settings Page
 * Requirements: 11.3, 11.4, 11.5, 11.6
 * 
 * Features:
 * - Display and edit user profile information
 * - Display and edit business information
 * - Language and currency preferences
 * - Display subscription tier and usage quota
 * - Optimistic updates for instant feedback
 */
export default function ProfileSettingsPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      businessInfo: {
        name: user?.businessInfo?.name || '',
        type: user?.businessInfo?.type || 'reseller',
        location: user?.businessInfo?.location || '',
        teamSize: user?.businessInfo?.teamSize || 1,
        warehouseCapacity: user?.businessInfo?.warehouseCapacity || undefined,
      },
      preferences: {
        locale: user?.preferences?.locale || 'en',
        currency: user?.preferences?.currency || 'BDT',
      },
    },
  });

  // Reset form when user data changes
  React.useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        businessInfo: {
          name: user.businessInfo?.name || '',
          type: user.businessInfo?.type || 'reseller',
          location: user.businessInfo?.location || '',
          teamSize: user.businessInfo?.teamSize || 1,
          warehouseCapacity: user.businessInfo?.warehouseCapacity || undefined,
        },
        preferences: {
          locale: user.preferences?.locale || 'en',
          currency: user.preferences?.currency || 'BDT',
        },
      });
    }
  }, [user, reset]);

  // Profile update mutation with optimistic updates
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user'] });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(['user']);

      // Optimistically update to the new value
      queryClient.setQueryData(['user'], (old: unknown) => ({
        ...(old as Record<string, unknown>),
        ...newData,
      }));

      return { previousUser };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['user'], context.previousUser);
      }
      setErrorMessage(t('profile.updateFailed'));
      setSuccessMessage('');
    },
    onSuccess: () => {
      setSuccessMessage(t('profile.profileUpdated'));
      setErrorMessage('');
      // Clear message after 4 seconds
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const onSubmit = (data: ProfileUpdateData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('profile.title')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Success/Error Messages */}
          {successMessage && (
            <div
              className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md"
              role="alert"
            >
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('profile.personalInfo')}
            </h2>
            <div className="space-y-4">
              <Input
                label={t('profile.name')}
                {...register('name')}
                error={errors.name?.message}
                required
              />
              <Input
                label={t('profile.email')}
                type="email"
                value={user.email}
                disabled
                helperText="Email cannot be changed"
              />
              <Input
                label={t('profile.phone')}
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="+880 1XXX-XXXXXX"
              />
            </div>
          </div>

          {/* Business Information Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('profile.businessInfo')}
            </h2>
            <div className="space-y-4">
              <Input
                label={t('profile.businessName')}
                {...register('businessInfo.name')}
                error={errors.businessInfo?.name?.message}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.businessType')}
                  <span className="text-error-500 ml-1">*</span>
                </label>
                <select
                  {...register('businessInfo.type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="reseller">{t('profile.businessTypes.reseller')}</option>
                  <option value="importer">{t('profile.businessTypes.importer')}</option>
                  <option value="sme">{t('profile.businessTypes.sme')}</option>
                  <option value="manufacturer">{t('profile.businessTypes.manufacturer')}</option>
                </select>
                {errors.businessInfo?.type && (
                  <p className="mt-1 text-sm text-error-500" role="alert">
                    {errors.businessInfo.type.message}
                  </p>
                )}
              </div>
              <Input
                label={t('profile.location')}
                {...register('businessInfo.location')}
                error={errors.businessInfo?.location?.message}
                required
              />
              <Input
                label={t('profile.teamSize')}
                type="number"
                {...register('businessInfo.teamSize', { valueAsNumber: true })}
                error={errors.businessInfo?.teamSize?.message}
                min={1}
                required
              />
              <Input
                label={t('profile.warehouseCapacity')}
                type="number"
                {...register('businessInfo.warehouseCapacity', { valueAsNumber: true })}
                error={errors.businessInfo?.warehouseCapacity?.message}
                min={0}
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('profile.preferences')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.language')}
                  <span className="text-error-500 ml-1">*</span>
                </label>
                <select
                  {...register('preferences.locale')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="en">{t('profile.languages.en')}</option>
                  <option value="bn">{t('profile.languages.bn')}</option>
                </select>
                {errors.preferences?.locale && (
                  <p className="mt-1 text-sm text-error-500" role="alert">
                    {errors.preferences.locale.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.currency')}
                  <span className="text-error-500 ml-1">*</span>
                </label>
                <select
                  {...register('preferences.currency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="BDT">{t('profile.currencies.BDT')}</option>
                  <option value="USD">{t('profile.currencies.USD')}</option>
                  <option value="CNY">{t('profile.currencies.CNY')}</option>
                </select>
                {errors.preferences?.currency && (
                  <p className="mt-1 text-sm text-error-500" role="alert">
                    {errors.preferences.currency.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Subscription & Usage Section (Read-only) */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('profile.subscription')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.currentPlan')}
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <span className="font-semibold text-gray-900">
                    {t(`profile.subscriptionTiers.${user.subscription?.tier || 'free'}`)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.usageQuota')}
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('profile.blueprintsUsed')}</span>
                      <span className="font-medium text-gray-900">
                        {user.subscription?.usageQuota?.blueprintsGenerated || 0} {t('profile.of')}{' '}
                        {user.subscription?.usageQuota?.blueprintsLimit || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            ((user.subscription?.usageQuota?.blueprintsGenerated || 0) /
                              (user.subscription?.usageQuota?.blueprintsLimit || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('profile.apiCallsUsed')}</span>
                      <span className="font-medium text-gray-900">
                        {user.subscription?.usageQuota?.apiCallsUsed || 0} {t('profile.of')}{' '}
                        {user.subscription?.usageQuota?.apiCallsLimit || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            ((user.subscription?.usageQuota?.apiCallsUsed || 0) /
                              (user.subscription?.usageQuota?.apiCallsLimit || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfileMutation.isPending}
              disabled={!isDirty || updateProfileMutation.isPending}
            >
              {t('profile.updateProfile')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
