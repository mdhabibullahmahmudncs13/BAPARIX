'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

export type NotificationType = 'price_drop' | 'trend_alert' | 'reorder' | 'team_activity' | 'system';

export interface NotificationPreferencesState {
  price_drop: boolean;
  trend_alert: boolean;
  reorder: boolean;
  team_activity: boolean;
  system: boolean;
}

export interface NotificationPreferencesProps {
  preferences: NotificationPreferencesState;
  onPreferenceChange?: (type: NotificationType, enabled: boolean) => void;
}

const NOTIFICATION_TYPES: {
  type: NotificationType;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    type: 'price_drop',
    icon: <CurrencyDollarIcon className="w-5 h-5 text-green-600" aria-hidden="true" />,
    labelKey: 'types.price_drop',
    descriptionKey: 'descriptions.price_drop',
  },
  {
    type: 'trend_alert',
    icon: <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />,
    labelKey: 'types.trend_alert',
    descriptionKey: 'descriptions.trend_alert',
  },
  {
    type: 'reorder',
    icon: <ArrowPathIcon className="w-5 h-5 text-orange-600" aria-hidden="true" />,
    labelKey: 'types.reorder',
    descriptionKey: 'descriptions.reorder',
  },
  {
    type: 'team_activity',
    icon: <UserGroupIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />,
    labelKey: 'types.team_activity',
    descriptionKey: 'descriptions.team_activity',
  },
  {
    type: 'system',
    icon: <CogIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />,
    labelKey: 'types.system',
    descriptionKey: 'descriptions.system',
  },
];

export function NotificationPreferences({
  preferences,
  onPreferenceChange,
}: NotificationPreferencesProps) {
  const t = useTranslations('notifications.preferences');

  const handleToggle = (type: NotificationType) => {
    if (onPreferenceChange) {
      onPreferenceChange(type, !preferences[type]);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </CardHeader>

      <div className="space-y-1" role="group" aria-label={t('title')}>
        {NOTIFICATION_TYPES.map(({ type, icon, labelKey, descriptionKey }) => (
          <div
            key={type}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t(labelKey)}
                </p>
                <p className="text-xs text-gray-500">
                  {t(descriptionKey)}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              role="switch"
              aria-checked={preferences[type]}
              aria-label={`${t(labelKey)} notifications`}
              onClick={() => handleToggle(type)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${preferences[type] ? 'bg-blue-600' : 'bg-gray-200'}
              `}
              type="button"
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
                  transition-transform duration-200 ease-in-out
                  ${preferences[type] ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
