'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type {
  SupabaseRealtimeClient,
  RealtimeChannel,
  RealtimePayload,
} from './useRealtimeUpdates';

/**
 * Notification interface matching the one defined in NotificationCenter.
 */
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

export interface UseRealtimeNotificationsOptions {
  /** Supabase client instance */
  client: SupabaseRealtimeClient | null;
  /** User ID to filter notifications for */
  userId: string;
  /** Table to subscribe to for notification changes */
  table?: string;
  /** Schema to listen on */
  schema?: string;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

export interface UseRealtimeNotificationsReturn {
  /** List of notifications (newest first) */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Whether the realtime connection is active */
  isConnected: boolean;
  /** Mark a single notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Dismiss (remove) a notification from the list */
  dismiss: (id: string) => void;
}

/**
 * Parses a raw notification record from Supabase into a typed Notification object.
 */
function parseNotification(record: Record<string, unknown>): Notification {
  return {
    id: (record.id as string) ?? '',
    userId: (record.user_id as string) ?? (record.userId as string) ?? '',
    type: (record.type as Notification['type']) ?? 'system',
    title: (record.title as string) ?? '',
    message: (record.message as string) ?? '',
    data: (record.data as Record<string, any>) ?? undefined,
    priority: (record.priority as Notification['priority']) ?? 'low',
    read: (record.read as boolean) ?? false,
    actionUrl: (record.action_url as string) ?? (record.actionUrl as string) ?? undefined,
    actionLabel: (record.action_label as string) ?? (record.actionLabel as string) ?? undefined,
    createdAt: record.created_at
      ? new Date(record.created_at as string)
      : record.createdAt
        ? new Date(record.createdAt as string | number)
        : new Date(),
    expiresAt: record.expires_at
      ? new Date(record.expires_at as string)
      : record.expiresAt
        ? new Date(record.expiresAt as string | number)
        : undefined,
  };
}

/**
 * Custom hook for subscribing to real-time notifications via Supabase Realtime.
 *
 * Subscribes to INSERT events on the notifications table and maintains a local
 * state array of notifications. Provides methods to mark as read and dismiss.
 *
 * Satisfies Requirements:
 * - 12.1: Price drop notifications within 30 seconds
 * - 12.2: Trend alert notifications
 * - 12.3: Reorder threshold notifications
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, dismiss } =
 *   useRealtimeNotifications({
 *     client: supabaseClient,
 *     userId: 'user-123',
 *   });
 * ```
 */
export function useRealtimeNotifications({
  client,
  userId,
  table = 'notifications',
  schema = 'public',
  enabled = true,
}: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to Supabase Realtime channel for notifications
  useEffect(() => {
    if (!client || !userId || !enabled) {
      setIsConnected(false);
      return;
    }

    const channelName = `realtime:${table}:${userId}`;
    const channel = client.channel(channelName);

    channelRef.current = channel;

    // Listen for INSERT events on the notifications table for this user
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema,
        table,
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePayload) => {
        const newNotification = parseNotification(payload.new);
        setNotifications((prev) => [newNotification, ...prev]);
      }
    );

    // Subscribe to the channel
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      client.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, userId, table, schema, enabled]);

  // Compute unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark a single notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Dismiss (remove) a notification from the list
  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    dismiss,
  };
}
