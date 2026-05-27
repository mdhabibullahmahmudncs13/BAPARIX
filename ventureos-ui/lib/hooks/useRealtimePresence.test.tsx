import { renderHook, act } from '@testing-library/react';
import {
  useRealtimePresence,
  UseRealtimePresenceOptions,
  SupabaseRealtimeClient,
  RealtimeChannel,
} from './useRealtimePresence';

/**
 * Creates a mock Supabase Realtime channel
 */
function createMockChannel(): RealtimeChannel & {
  _handlers: Record<string, (payload: unknown) => void>;
  _subscribeCallback: ((status: string) => void) | null;
  _trackedState: Record<string, unknown> | null;
} {
  const handlers: Record<string, (payload: unknown) => void> = {};
  let subscribeCallback: ((status: string) => void) | null = null;
  let trackedState: Record<string, unknown> | null = null;

  return {
    _handlers: handlers,
    _subscribeCallback: subscribeCallback,
    _trackedState: trackedState,
    on(event: string, filter: Record<string, unknown>, callback: (payload: unknown) => void) {
      const key = `${event}:${(filter as { event?: string }).event || 'default'}`;
      handlers[key] = callback;
      return this;
    },
    subscribe(callback?: (status: string) => void) {
      subscribeCallback = callback || null;
      // Store for external access
      (this as any)._subscribeCallback = subscribeCallback;
      return this;
    },
    unsubscribe() {},
    track(state: Record<string, unknown>) {
      trackedState = state;
      (this as any)._trackedState = trackedState;
    },
    untrack() {
      trackedState = null;
      (this as any)._trackedState = null;
    },
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
    channel(_name: string, _opts?: Record<string, unknown>) {
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

const defaultUser = {
  userId: 'user-1',
  name: 'Alice',
  avatarUrl: 'https://example.com/alice.jpg',
};

describe('useRealtimePresence', () => {
  it('should return initial state when disabled', () => {
    const { result } = renderHook(() =>
      useRealtimePresence({
        client: null,
        workspaceId: 'ws-1',
        user: defaultUser,
        enabled: false,
      })
    );

    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.currentSection).toBe('dashboard');
    expect(result.current.isConnected).toBe(false);
  });

  it('should return initial state when client is null', () => {
    const { result } = renderHook(() =>
      useRealtimePresence({
        client: null,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('should return initial state when user is null', () => {
    const mockClient = createMockClient();
    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: null,
      })
    );

    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('should connect and track presence when all params provided', () => {
    const mockClient = createMockClient();

    renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
        initialSection: 'financial',
      })
    );

    // Channel should have been created
    expect(mockClient._lastChannel).not.toBeNull();
  });

  it('should set isConnected to true when subscription succeeds', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    // Simulate successful subscription
    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should set isConnected to false on channel error', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    // Simulate successful subscription first
    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate channel error
    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('CHANNEL_ERROR');
      }
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should track presence state on successful subscription', () => {
    const mockClient = createMockClient();

    renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
        initialSection: 'products',
      })
    );

    // Simulate successful subscription
    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    // Verify track was called with user info
    const trackedState = mockClient._lastChannel!._trackedState;
    expect(trackedState).toMatchObject({
      userId: 'user-1',
      name: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      currentSection: 'products',
    });
  });

  it('should update online users on presence sync', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    // Simulate presence sync event
    act(() => {
      const channel = mockClient._lastChannel!;
      const syncHandler = channel._handlers['presence:sync'];
      if (syncHandler) {
        syncHandler({
          'user-1': [
            {
              userId: 'user-1',
              name: 'Alice',
              currentSection: 'dashboard',
              lastSeen: new Date().toISOString(),
            },
          ],
          'user-2': [
            {
              userId: 'user-2',
              name: 'Bob',
              currentSection: 'financial',
              lastSeen: new Date().toISOString(),
            },
          ],
        });
      }
    });

    expect(result.current.onlineUsers).toHaveLength(2);
    expect(result.current.onlineUsers[0].userId).toBe('user-1');
    expect(result.current.onlineUsers[1].userId).toBe('user-2');
  });

  it('should add users on presence join', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    // Simulate join event
    act(() => {
      const channel = mockClient._lastChannel!;
      const joinHandler = channel._handlers['presence:join'];
      if (joinHandler) {
        joinHandler({
          newPresences: [
            {
              userId: 'user-3',
              name: 'Charlie',
              currentSection: 'shipping',
              lastSeen: new Date().toISOString(),
            },
          ],
        });
      }
    });

    expect(result.current.onlineUsers).toHaveLength(1);
    expect(result.current.onlineUsers[0].name).toBe('Charlie');
  });

  it('should remove users on presence leave', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    // First add a user
    act(() => {
      const channel = mockClient._lastChannel!;
      const joinHandler = channel._handlers['presence:join'];
      if (joinHandler) {
        joinHandler({
          newPresences: [
            {
              userId: 'user-3',
              name: 'Charlie',
              currentSection: 'shipping',
              lastSeen: new Date().toISOString(),
            },
          ],
        });
      }
    });

    expect(result.current.onlineUsers).toHaveLength(1);

    // Then remove the user
    act(() => {
      const channel = mockClient._lastChannel!;
      const leaveHandler = channel._handlers['presence:leave'];
      if (leaveHandler) {
        leaveHandler({
          leftPresences: [{ userId: 'user-3' }],
        });
      }
    });

    expect(result.current.onlineUsers).toHaveLength(0);
  });

  it('should update current section and re-track presence', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
        initialSection: 'dashboard',
      })
    );

    // Simulate subscription
    act(() => {
      const channel = mockClient._lastChannel!;
      if (channel._subscribeCallback) {
        channel._subscribeCallback('SUBSCRIBED');
      }
    });

    // Change section
    act(() => {
      result.current.setCurrentSection('financial');
    });

    expect(result.current.currentSection).toBe('financial');

    // Verify track was called with new section
    const trackedState = mockClient._lastChannel!._trackedState;
    expect(trackedState).toMatchObject({
      currentSection: 'financial',
    });
  });

  it('should use initialSection as default currentSection', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
        initialSection: 'market-intelligence',
      })
    );

    expect(result.current.currentSection).toBe('market-intelligence');
  });

  it('should cleanup channel on unmount', () => {
    const mockClient = createMockClient();

    const { unmount } = renderHook(() =>
      useRealtimePresence({
        client: mockClient,
        workspaceId: 'ws-1',
        user: defaultUser,
      })
    );

    unmount();

    expect(mockClient._removedChannels).toHaveLength(1);
  });
});
