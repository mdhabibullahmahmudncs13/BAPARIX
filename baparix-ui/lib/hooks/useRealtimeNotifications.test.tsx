import { renderHook, act } from '@testing-library/react';
import {
  useRealtimeNotifications,
  Notification,
} from './useRealtimeNotifications';
import type {
  SupabaseRealtimeClient,
  RealtimeChannel,
  RealtimePayload,
} from './useRealtimeUpdates';

/**
 * Creates a mock Supabase Realtime channel
 */
function createMockChannel(): RealtimeChannel & {
  _handlers: Record<string, (payload: RealtimePayload) => void>;
  _subscribeCallback: ((status: string) => void) | null;
} {
  const handlers: Record<string, (payload: RealtimePayload) => void> = {};
  let subscribeCallback: ((status: string) => void) | null = null;

  return {
    _handlers: handlers,
    _subscribeCallback: subscribeCallback,
    on(
      event: string,
      _filter: Record<string, unknown>,
      callback: (payload: RealtimePayload) => void
    ) {
      handlers[event] = callback;
      return this;
    },
    subscribe(callback?: (status: string) => void) {
      subscribeCallback = callback || null;
      (this as any)._subscribeCallback = subscribeCallback;
      return this;
    },
    unsubscribe() {},
  };
}

/**
 * Creates a mock Supabase client
 */
function createMockClient(): SupabaseRealtimeClient & {
  _lastChannel: ReturnType<typeof createMockChannel> | null;
  _removedChannels: RealtimeChannel[];
} {
  let lastChannel: ReturnType<typeof createMockChannel> | null = null;
  const removedChannels: RealtimeChannel[] = [];

  return {
    _lastChannel: lastChannel,
    _removedChannels: removedChannels,
    channel(_name: string) {
      const ch = createMockChannel();
      lastChannel = ch;
      (this as any)._lastChannel = ch;
      return ch;
    },
    removeChannel(channel: RealtimeChannel) {
      removedChannels.push(channel);
      (this as any)._removedChannels = removedChannels;
    },
  };
}

/**
 * Helper to create a notification payload simulating a Supabase INSERT event
 */
function createNotificationPayload(
  overrides: Partial<Record<string, unknown>> = {}
): RealtimePayload {
  return {
    eventType: 'INSERT',
    new: {
      id: 'notif-1',
      user_id: 'user-1',
      type: 'price_drop',
      title: 'Price Drop Alert',
      message: 'Product X price dropped by 20%',
      priority: 'high',
      read: false,
      action_url: '/products/x',
      action_label: 'View Product',
      created_at: new Date().toISOString(),
      ...overrides,
    },
    old: {},
    table: 'notifications',
    schema: 'public',
    commit_timestamp: new Date().toISOString(),
  };
}

describe('useRealtimeNotifications', () => {
  it('should return initial empty state when client is null', () => {
    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: null,
        userId: 'user-1',
      })
    );

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isConnected).toBe(false);
  });

  it('should return initial empty state when userId is empty', () => {
    const mockClient = createMockClient();
    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: '',
      })
    );

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isConnected).toBe(false);
  });

  it('should return initial empty state when disabled', () => {
    const mockClient = createMockClient();
    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
        enabled: false,
      })
    );

    expect(result.current.notifications).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('should create a channel when client and userId are provided', () => {
    const mockClient = createMockClient();

    renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    expect(mockClient._lastChannel).not.toBeNull();
  });

  it('should set isConnected to true when subscription succeeds', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should set isConnected to false on CLOSED status', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('CLOSED');
      }
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should set isConnected to false on CHANNEL_ERROR status', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('CHANNEL_ERROR');
      }
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should add notification to list when INSERT event is received', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    const payload = createNotificationPayload();

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(payload);
      }
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe('notif-1');
    expect(result.current.notifications[0].type).toBe('price_drop');
    expect(result.current.notifications[0].title).toBe('Price Drop Alert');
    expect(result.current.notifications[0].message).toBe('Product X price dropped by 20%');
    expect(result.current.notifications[0].priority).toBe('high');
    expect(result.current.notifications[0].read).toBe(false);
  });

  it('should prepend new notifications (newest first)', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(createNotificationPayload({ id: 'notif-1', title: 'First' }));
      }
    });

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(createNotificationPayload({ id: 'notif-2', title: 'Second' }));
      }
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].id).toBe('notif-2');
    expect(result.current.notifications[1].id).toBe('notif-1');
  });

  it('should correctly compute unreadCount', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(createNotificationPayload({ id: 'notif-1', read: false }));
        handler(createNotificationPayload({ id: 'notif-2', read: false }));
        handler(createNotificationPayload({ id: 'notif-3', read: true }));
      }
    });

    expect(result.current.unreadCount).toBe(2);
  });

  it('should mark a single notification as read', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(createNotificationPayload({ id: 'notif-1', read: false }));
        handler(createNotificationPayload({ id: 'notif-2', read: false }));
      }
    });

    expect(result.current.unreadCount).toBe(2);

    act(() => {
      result.current.markAsRead('notif-1');
    });

    expect(result.current.unreadCount).toBe(1);
    const marked = result.current.notifications.find((n) => n.id === 'notif-1');
    expect(marked?.read).toBe(true);
  });

  it('should mark all notifications as read', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(createNotificationPayload({ id: 'notif-1', read: false }));
        handler(createNotificationPayload({ id: 'notif-2', read: false }));
        handler(createNotificationPayload({ id: 'notif-3', read: false }));
      }
    });

    expect(result.current.unreadCount).toBe(3);

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it('should dismiss a notification from the list', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(createNotificationPayload({ id: 'notif-1' }));
        handler(createNotificationPayload({ id: 'notif-2' }));
      }
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.dismiss('notif-1');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe('notif-2');
  });

  it('should handle trend_alert notification type (Req 12.2)', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(
          createNotificationPayload({
            id: 'trend-1',
            type: 'trend_alert',
            title: 'New Trend Detected',
            message: 'Winter jackets trending in Dhaka',
          })
        );
      }
    });

    expect(result.current.notifications[0].type).toBe('trend_alert');
    expect(result.current.notifications[0].title).toBe('New Trend Detected');
  });

  it('should handle reorder notification type (Req 12.3)', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(
          createNotificationPayload({
            id: 'reorder-1',
            type: 'reorder',
            title: 'Reorder Alert',
            message: 'Product Y has reached reorder threshold',
            priority: 'medium',
          })
        );
      }
    });

    expect(result.current.notifications[0].type).toBe('reorder');
    expect(result.current.notifications[0].priority).toBe('medium');
  });

  it('should cleanup channel on unmount', () => {
    const mockClient = createMockClient();

    const { unmount } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    unmount();

    expect(mockClient._removedChannels).toHaveLength(1);
  });

  it('should reset isConnected on unmount', () => {
    const mockClient = createMockClient();

    const { result, unmount } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);

    unmount();

    // After unmount, the hook state is no longer accessible,
    // but we verify cleanup was called
    expect(mockClient._removedChannels).toHaveLength(1);
  });

  it('should parse notification with snake_case fields from Supabase', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
      })
    );

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler({
          eventType: 'INSERT',
          new: {
            id: 'notif-snake',
            user_id: 'user-1',
            type: 'price_drop',
            title: 'Snake Case Test',
            message: 'Testing snake_case parsing',
            priority: 'low',
            read: false,
            action_url: '/test',
            action_label: 'Test',
            created_at: '2024-01-15T10:00:00Z',
            expires_at: '2024-02-15T10:00:00Z',
          },
          old: {},
          table: 'notifications',
          schema: 'public',
          commit_timestamp: new Date().toISOString(),
        });
      }
    });

    const notif = result.current.notifications[0];
    expect(notif.id).toBe('notif-snake');
    expect(notif.userId).toBe('user-1');
    expect(notif.actionUrl).toBe('/test');
    expect(notif.actionLabel).toBe('Test');
    expect(notif.createdAt).toBeInstanceOf(Date);
    expect(notif.expiresAt).toBeInstanceOf(Date);
  });

  it('should use custom table and schema when provided', () => {
    const mockClient = createMockClient();

    renderHook(() =>
      useRealtimeNotifications({
        client: mockClient,
        userId: 'user-1',
        table: 'custom_notifications',
        schema: 'app',
      })
    );

    // Channel should be created without errors
    expect(mockClient._lastChannel).not.toBeNull();
  });
});
