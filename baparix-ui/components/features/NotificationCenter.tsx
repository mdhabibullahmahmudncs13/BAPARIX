'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BellIcon,
  CheckIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CogIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

export interface Notification {
  id: string;
  userId: string;
  type: 'price_drop' | 'trend_alert' | 'reorder' | 'team_activity' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'price_drop':
      return <CurrencyDollarIcon className="w-5 h-5 text-green-600" aria-hidden="true" />;
    case 'trend_alert':
      return <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />;
    case 'reorder':
      return <ArrowPathIcon className="w-5 h-5 text-orange-600" aria-hidden="true" />;
    case 'team_activity':
      return <UserGroupIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />;
    case 'system':
      return <CogIcon className="w-5 h-5 text-gray-600" aria-hidden="true" />;
  }
}

function getPriorityVariant(priority: Notification['priority']): 'info' | 'warning' | 'error' {
  switch (priority) {
    case 'low':
      return 'info';
    case 'medium':
      return 'warning';
    case 'high':
      return 'error';
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDateGroupLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDate.getTime() === today.getTime()) return 'Today';
  if (notifDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationCenterProps) {
  const t = useTranslations('notifications');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const groupedNotifications = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const groups: Record<string, Notification[]> = {};
    for (const notification of sorted) {
      const label = getDateGroupLabel(new Date(notification.createdAt));
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(notification);
    }

    return groups;
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  return (
    <Card className="w-full max-w-md" padding="none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-gray-700" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">
            {t('title')}
          </h2>
          {unreadCount > 0 && (
            <span aria-label={`${unreadCount} unread notifications`}>
              <Badge variant="error" size="sm">
                {unreadCount}
              </Badge>
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            aria-label={t('markAllAsRead')}
          >
            <CheckIcon className="w-4 h-4 mr-1" aria-hidden="true" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto" role="list" aria-label={t('title')}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <InboxIcon className="w-12 h-12 text-gray-300 mb-3" aria-hidden="true" />
            <p className="text-gray-500 text-sm">{t('empty')}</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  {dateLabel}
                </p>
              </div>
              {items.map((notification) => (
                <div
                  key={notification.id}
                  role="listitem"
                  className={`
                    flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer
                    transition-colors duration-150
                    hover:bg-gray-50
                    ${!notification.read ? 'bg-blue-50/50' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${notification.read ? '' : 'Unread: '}${notification.title}`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        className={`text-sm truncate ${
                          !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </p>
                      {notification.priority === 'high' && (
                        <Badge variant={getPriorityVariant(notification.priority)} size="sm">
                          {t('priority.high')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(new Date(notification.createdAt))}
                      </span>
                      {notification.actionLabel && (
                        <span className="text-xs text-blue-600 font-medium">
                          {notification.actionLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="flex-shrink-0 mt-2">
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

/**
 * Unread count badge for use in navigation bar.
 */
export interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
}

export function NotificationBadge({ count, onClick }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
      type="button"
    >
      <BellIcon className="w-6 h-6" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
