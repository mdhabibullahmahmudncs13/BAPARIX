'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  teamInviteSchema,
  TeamInviteFormData,
  INVITE_ROLES,
} from '@/lib/validations/teamInvite';

export interface TeamInviteFormProps {
  locale: 'bn' | 'en';
  onSubmit?: (data: TeamInviteFormData) => Promise<void> | void;
  isLoading?: boolean;
}

export function TeamInviteForm({
  locale,
  onSubmit,
  isLoading = false,
}: TeamInviteFormProps) {
  const t = useTranslations('teamInvite');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamInviteFormData>({
    resolver: zodResolver(teamInviteSchema),
    defaultValues: {
      contact: '',
      role: '',
    },
  });

  const roleOptions = INVITE_ROLES.map((role) => ({
    value: role,
    label: t(`roles.${role}`),
  }));

  const handleFormSubmit = async (data: TeamInviteFormData) => {
    setSubmitStatus('idle');
    setSubmitError(null);

    try {
      await onSubmit?.(data);
      setSubmitStatus('success');
      reset();
    } catch (err) {
      setSubmitStatus('error');
      setSubmitError(
        err instanceof Error ? err.message : t('errors.generic')
      );
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('title')}
      </h2>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
        aria-label={t('ariaLabel')}
      >
        {/* Contact (email or phone) */}
        <div>
          <Input
            label={t('contact')}
            type="text"
            placeholder={t('contactPlaceholder')}
            error={
              errors.contact?.message
                ? t(`validation.${errors.contact.message}`)
                : undefined
            }
            required
            aria-describedby="contact-helper"
            {...register('contact')}
          />
          <p id="contact-helper" className="mt-1 text-xs text-gray-500">
            {t('contactHelper')}
          </p>
        </div>

        {/* Role Selector */}
        <Select
          label={t('role')}
          placeholder={t('rolePlaceholder')}
          options={roleOptions}
          error={
            errors.role?.message
              ? t(`validation.${errors.role.message}`)
              : undefined
          }
          required
          {...register('role')}
        />

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div
            className="p-3 rounded-md bg-green-50 border border-green-200"
            role="status"
            aria-live="polite"
            data-testid="invite-success"
          >
            <p className="text-sm text-green-800">{t('success')}</p>
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div
            className="p-3 rounded-md bg-red-50 border border-red-200"
            role="alert"
            aria-live="assertive"
            data-testid="invite-error"
          >
            <p className="text-sm text-red-800">
              {submitError || t('errors.generic')}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? t('sending') : t('send')}
        </Button>
      </form>
    </Card>
  );
}
