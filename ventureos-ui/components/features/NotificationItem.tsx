'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  XMarkIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import type { Notification } from './NotificationCenter';

export interface NotificationItemProps {
  notification: Notification;
  onDismiss?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  isNew?: boolean;
}

/**
 * Formats a relative timestamp for display.
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

/**
 * Returns the highlight color class based on notification type.
 */
function getTypeStyles(type: Notification['type']) {
  switch (type) {
    case 'price_drop':
      return {
        border: 'border-l-green-500',
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      };
    case 'trend_alert':
      return {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      };
    case 'reorder':
      return {
        border: 'border-l-orange-500',
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
      };
    default:
      return {
        border: 'border-l-gray-500',
        bg: 'bg-gray-50',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
      };
  }
}

/**
 * Returns the icon component for the notification type.
 */
function getTypeIcon(type: Notification['type'], trajectory?: string) {
  switch (type) {
    case 'price_drop':
      return <CurrencyDollarIcon className="w-5 h-5" aria-hidden="true" />;
    case 'trend_alert':
      if (trajectory === 'declining') {
        return <ArrowTrendingDownIcon className="w-5 h-5" aria-hidden="true" />;
      }
      if (trajectory === 'stable') {
        return <MinusIcon className="w-5 h-5" aria-hidden="true" />;
      }
      return <ArrowTrendingUpIcon className="w-5 h-5" aria-hidden="true" />;
    case 'reorder':
      return <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />;
    default:
      return <CurrencyDollarIcon className="w-5 h-5" aria-hidden="true" />;
  }
}

/**
 * Renders the price drop notification content.
 */
function PriceDropContent({ data }: { data?: Record<string, any> }) {
  const t = useTranslations('notifications');

  if (!data) return null;

  const { productName, oldPrice, newPrice, percentageDrop } = data;

  return (
    <div className="mt-1 space-y-1">
      {productName && (
        <p className="text-sm font-medium text-gray-900">{productName}</p>
      )}
      <div className="flex items-center gap-2 text-sm">
        {oldPrice !== undefined && (
          <span className="text-gray-500 line-through">৳{oldPrice}</span>
        )}
        {newPrice !== undefined && (
          <span className="text-green-700 font-semibold">৳{newPrice}</span>
        )}
        {percentageDrop !== undefined && (
          <span className="text-green-600 text-xs font-medium bg-green-100 px-1.5 py-0.5 rounded">
            -{percentageDrop}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the trend alert notification content.
 */
function TrendAlertContent({ data }: { data?: Record<string, any> }) {
  if (!data) return null;

  const { trendName, category, trajectory } = data;

  return (
    <div className="mt-1 space-y-1">
      {trendName && (
        <p className="text-sm font-medium text-gray-900">{trendName}</p>
      )}
      <div className="flex items-center gap-2 text-sm">
        {category && (
          <span className="text-blue-700 text-xs font-medium bg-blue-100 px-1.5 py-0.5 rounded">
            {category}
          </span>
        )}
        {trajectory && (
          <span className="text-blue-600 text-xs capitalize flex items-center gap-1">
            {trajectory === 'rising' && '↑'}
            {trajectory === 'stable' && '→'}
            {trajectory === 'declining' && '↓'}
            {trajectory}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the reorder notification content.
 */
function ReorderContent({ data }: { data?: Record<string, any> }) {
  if (!data) return null;

  const { productName, currentStock, reorderThreshold } = data;

  return (
    <div className="mt-1 space-y-1">
      {productName && (
        <p className="text-sm font-medium text-gray-900">{productName}</p>
      )}
      <div className="flex items-center gap-3 text-sm">
        {currentStock !== undefined && (
          <span className="text-orange-700">
            <span className="text-gray-500">Stock:</span>{' '}
            <span className="font-semibold">{currentStock}</span>
          </span>
        )}
        {reorderThreshold !== undefined && (
          <span className="text-orange-600">
            <span className="text-gray-500">Threshold:</span>{' '}
            <span className="font-semibold">{reorderThreshold}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * NotificationItem component renders individual notifications with type-specific layouts.
 * Supports price drops (green), trend alerts (blue), and reorder alerts (orange).
 * Includes click-to-navigate, dismiss, timestamp, and animation for new items.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.7
 */
export function NotificationItem({
  notification,
  onDismiss,
  onClick,
  isNew = false,
}: NotificationItemProps) {
  const t = useTranslations('notifications');
  const router = useRouter();
  const styles = getTypeStyles(notification.type);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(notification);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }, [notification, onClick, router]);

  const handleDismiss = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (onDismiss) {
        onDismiss(notification.id);
      }
    },
    [notification.id, onDismiss]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleDismissKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDismiss(e);
      }
    },
    [handleDismiss]
  );

  const renderContent = () => {
    switch (notification.type) {
      case 'price_drop':
        return <PriceDropContent data={notification.data} />;
      case 'trend_alert':
        return <TrendAlertContent data={notification.data} />;
      case 'reorder':
        return <ReorderContent data={notification.data} />;
      default:
        return null;
    }
  };

  return (
    <div
      role="article"
      aria-label={notification.title}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative flex items-start gap-3 p-4 border-l-4 rounded-md cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${styles.border} ${styles.bg}
        ${isNew ? 'animate-slideIn' : ''}
        ${!notification.read ? 'ring-1 ring-inset ring-gray-200' : ''}
      `}
    >
      {/* Type Icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}
      >
        {getTypeIcon(notification.type, notification.data?.trajectory)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`text-sm leading-5 ${
              !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            }`}
          >
            {notification.title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
          {notification.message}
        </p>

        {/* Type-specific content */}
        {renderContent()}

        {/* Timestamp */}
        <time
          className="block text-xs text-gray-500 mt-2"
          dateTime={new Date(notification.createdAt).toISOString()}
        >
          {formatTimestamp(notification.createdAt)}
        </time>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          onKeyDown={handleDismissKeyDown}
          className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label={t('dismiss')}
        >
          <XMarkIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
