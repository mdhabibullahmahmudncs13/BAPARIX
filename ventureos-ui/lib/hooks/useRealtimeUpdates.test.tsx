import { renderHook, act } from '@testing-library/react';
import {
  useRealtimeUpdates,
  SupabaseRealtimeClient,
  RealtimeChannel,
  RealtimePayload,
  QueryClientLike,
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
 * Creates a mock query client
 */
function createMockQueryClient(): QueryClientLike & {
  _invalidatedKeys: string[][];
} {
  const invalidatedKeys: string[][] = [];

  return {
    _invalidatedKeys: invalidatedKeys,
    invalidateQueries(options: { queryKey: string[] }) {
      invalidatedKeys.push(options.queryKey);
    },
  };
}

describe('useRealtimeUpdates', () => {
  it('should return initial state when disabled', () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: null,
        queryClient: null,
        workspaceId: 'ws-1',
        enabled: false,
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
  });

  it('should return initial state when client is null', () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: null,
        queryClient: null,
        workspaceId: 'ws-1',
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
  });

  it('should return initial state when workspaceId is empty', () => {
    const mockClient = createMockClient();
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: null,
        workspaceId: '',
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdate).toBeNull();
  });

  it('should connect when all params provided', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();

    renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
      })
    );

    expect(mockClient._lastChannel).not.toBeNull();
  });

  it('should set isConnected to true when subscription succeeds', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();

    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
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
    const mockQueryClient = createMockQueryClient();

    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
      })
    );

    // Simulate subscription then error
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

  it('should invalidate query cache when change is received', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();

    renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
        queryKeys: [['workspace'], ['team']],
      })
    );

    // Simulate a database change
    const payload: RealtimePayload = {
      eventType: 'UPDATE',
      new: { id: '1', name: 'Updated' },
      old: { id: '1', name: 'Original' },
      table: 'workspace_data',
      schema: 'public',
      commit_timestamp: new Date().toISOString(),
    };

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(payload);
      }
    });

    expect(mockQueryClient._invalidatedKeys).toContainEqual(['workspace']);
    expect(mockQueryClient._invalidatedKeys).toContainEqual(['team']);
  });

  it('should update lastUpdate timestamp when change is received', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();

    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
      })
    );

    expect(result.current.lastUpdate).toBeNull();

    const payload: RealtimePayload = {
      eventType: 'INSERT',
      new: { id: '2', name: 'New Item' },
      old: {},
      table: 'workspace_data',
      schema: 'public',
      commit_timestamp: new Date().toISOString(),
    };

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(payload);
      }
    });

    expect(result.current.lastUpdate).toBeInstanceOf(Date);
  });

  it('should call onUpdate callback when change is received', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();
    const onUpdate = jest.fn();

    renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
        onUpdate,
      })
    );

    const payload: RealtimePayload = {
      eventType: 'DELETE',
      new: {},
      old: { id: '3', name: 'Deleted' },
      table: 'workspace_data',
      schema: 'public',
      commit_timestamp: new Date().toISOString(),
    };

    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(payload);
      }
    });

    expect(onUpdate).toHaveBeenCalledWith(payload);
  });

  it('should cleanup channel on unmount', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();

    const { unmount } = renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
      })
    );

    unmount();

    expect(mockClient._removedChannels).toHaveLength(1);
  });

  it('should use default table and schema values', () => {
    const mockClient = createMockClient();
    const mockQueryClient = createMockQueryClient();

    renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: mockQueryClient,
        workspaceId: 'ws-1',
      })
    );

    // Channel should be created (verifies defaults don't cause issues)
    expect(mockClient._lastChannel).not.toBeNull();
  });

  it('should handle missing queryClient gracefully', () => {
    const mockClient = createMockClient();

    const { result } = renderHook(() =>
      useRealtimeUpdates({
        client: mockClient,
        queryClient: null,
        workspaceId: 'ws-1',
      })
    );

    const payload: RealtimePayload = {
      eventType: 'UPDATE',
      new: { id: '1' },
      old: { id: '1' },
      table: 'workspace_data',
      schema: 'public',
      commit_timestamp: new Date().toISOString(),
    };

    // Should not throw even without queryClient
    act(() => {
      const channel = mockClient._lastChannel!;
      const handler = channel._handlers['postgres_changes'];
      if (handler) {
        handler(payload);
      }
    });

    expect(result.current.lastUpdate).toBeInstanceOf(Date);
  });
});
