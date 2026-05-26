'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export interface TrendAlertProps {
  trend: {
    id: string;
    productCategory: string;
    trendName: string;
    trajectory: 'rising' | 'stable' | 'declining';
    startDate: string;
    peakPeriod: string;
    estimatedLifespan: string;
    seasonal?: boolean;
    seasonalFlag?: string;
    isNew?: boolean;
  };
  onDismiss?: (id: string) => void;
  onLearnMore?: (id: string) => void;
  dismissible?: boolean;
  showNotificationBadge?: boolean;
}

export function TrendAlert({
  trend,
  onDismiss,
  onLearnMore,
  dismissible = true,
  showNotificationBadge = false,
}: TrendAlertProps) {
  const t = useTranslations('marketIntelligence');
  const [isDismissing, setIsDismissing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    if (!dismissible || !onDismiss) return;

    setIsDismissing(true);
    // Wait for animation to complete before calling onDismiss
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(trend.id);
    }, 300);
  };

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore(trend.id);
    }
  };

  // Get trajectory icon and color
  const getTrajectoryIcon = () => {
    switch (trend.trajectory) {
      case 'rising':
        return (
          <ArrowTrendingUpIcon
            className="w-5 h-5 text-green-600"
            aria-hidden="true"
          />
        );
      case 'declining':
        return (
          <ArrowTrendingDownIcon
            className="w-5 h-5 text-red-600"
            aria-hidden="true"
          />
        );
      case 'stable':
        return (
          <MinusIcon
            className="w-5 h-5 text-blue-600"
            aria-hidden="true"
          />
        );
    }
  };

  const getTrajectoryBadgeVariant = (): 'success' | 'warning' | 'info' => {
    switch (trend.trajectory) {
      case 'rising':
        return 'success';
      case 'declining':
        return 'warning';
      case 'stable':
        return 'info';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        relative p-4 border border-gray-200 rounded-lg 
        hover:border-blue-300 hover:shadow-md 
        transition-all duration-300 ease-in-out
        ${isDismissing ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}
      `}
      role="article"
      aria-label={`${t('sections.trendAlerts')}: ${trend.trendName}`}
    >
      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={`Dismiss ${trend.trendName} alert`}
          type="button"
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      {/* Header Section */}
      <div className="flex items-start justify-between mb-3 pr-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* New Notification Badge */}
            {showNotificationBadge && trend.isNew && (
              <Badge variant="primary" size="sm" className="animate-pulse">
                <BellIcon className="w-3 h-3 mr-1" aria-hidden="true" />
                New
              </Badge>
            )}

            {/* Trend Name */}
            <h3 className="font-semibold text-gray-900 text-lg">
              {trend.trendName}
            </h3>

            {/* Trajectory Badge */}
            <Badge variant={getTrajectoryBadgeVariant()} size="sm">
              <span className="flex items-center gap-1">
                {getTrajectoryIcon()}
                <span className="sr-only">Trajectory: </span>
                {t(`trajectory.${trend.trajectory}`)}
              </span>
            </Badge>

            {/* Seasonal Badge */}
            {trend.seasonal && trend.seasonalFlag && (
              <Badge variant="warning" size="sm">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78.409 1.574 1.195 1.574H6.34a.75.75 0 00.707-.504l.847-2.54a.75.75 0 00-.707-.996H5.813a.75.75 0 00-.707.504l-.106.41z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {trend.seasonalFlag}
                </span>
              </Badge>
            )}
          </div>

          {/* Category */}
          <p className="text-sm text-gray-600">{trend.productCategory}</p>
        </div>
      </div>

      {/* Trend Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-xs text-gray-500 mb-1 font-medium">
            {t('trendDetails.startDate')}
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            {trend.startDate}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-xs text-gray-500 mb-1 font-medium">
            {t('trendDetails.peakPeriod')}
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            {trend.peakPeriod}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-xs text-gray-500 mb-1 font-medium">
            {t('trendDetails.lifespan')}
          </p>
          <p className="text-sm text-gray-900 font-semibold">
            {trend.estimatedLifespan}
          </p>
        </div>
      </div>

      {/* Action Button */}
      {onLearnMore && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLearnMore}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Learn More
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
