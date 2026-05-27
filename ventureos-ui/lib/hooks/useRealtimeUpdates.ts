'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Supabase Realtime channel interface (subset used by this hook)
 */
export interface RealtimeChannel {
  on: (
    event: string,
    filter: Record<string, unknown>,
    callback: (payload: RealtimePayload) => void
  ) => RealtimeChannel;
  subscribe: (callback?: (status: string) => void) => RealtimeChannel;
  unsubscribe: () => void;
}

/**
 * Supabase client interface (subset used by this hook)
 */
export interface SupabaseRealtimeClient {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => void;
}

/**
 * Payload received from Supabase postgres_changes
 */
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  table: string;
  schema: string;
  commit_timestamp: string;
}

/**
 * Query client interface for cache invalidation (React Query compatible)
 */
export interface QueryClientLike {
  invalidateQueries: (options: { queryKey: string[] }) => void;
}

export interface UseRealtimeUpdatesOptions {
  /** Supabase client instance */
  client: SupabaseRealtimeClient | null;
  /** Query client for cache invalidation */
  queryClient: QueryClientLike | null;
  /** Workspace identifier */
  workspaceId: string;
  /** Table to subscribe to for changes */
  table?: string;
  /** Schema to listen on */
  schema?: string;
  /** Query keys to invalidate when changes are detected */
  queryKeys?: string[][];
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Callback when a change is received */
  onUpdate?: (payload: RealtimePayload) => void;
}

export interface UseRealtimeUpdatesReturn {
  /** Whether the realtime connection is active */
  isConnected: boolean;
  /** Timestamp of the last received update */
  lastUpdate: Date | null;
}

/**
 * Custom hook for subscribing to Supabase Realtime postgres_changes.
 *
 * Subscribes to database changes for workspace data and invalidates
 * React Query cache when changes are detected, ensuring other users
 * see updates within 2 seconds.
 *
 * @example
 * ```tsx
 * const { isConnected, lastUpdate } = useRealtimeUpdates({
 *   client: supabaseClient,
 *   queryClient: queryClient,
 *   workspaceId: 'workspace-123',
 *   table: 'workspace_data',
 *   queryKeys: [['workspace'], ['team']],
 * });
 * ```
 */
export function useRealtimeUpdates({
  client,
  queryClient,
  workspaceId,
  table = 'workspace_data',
  schema = 'public',
  queryKeys = [['workspace']],
  enabled = true,
  onUpdate,
}: UseRealtimeUpdatesOptions): UseRealtimeUpdatesReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!client || !workspaceId || !enabled) {
      setIsConnected(false);
      return;
    }

    const channelName = `realtime:${table}:${workspaceId}`;
    const channel = client.channel(channelName);

    channelRef.current = channel;

    // Subscribe to postgres_changes for the workspace table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema,
        table,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload: RealtimePayload) => {
        const updateTime = new Date();
        setLastUpdate(updateTime);

        // Invalidate relevant React Query caches
        if (queryClient) {
          for (const queryKey of queryKeys) {
            queryClient.invalidateQueries({ queryKey });
          }
        }

        // Call optional update callback
        if (onUpdate) {
          onUpdate(payload);
        }
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
  }, [client, workspaceId, table, schema, enabled]);

  return {
    isConnected,
    lastUpdate,
  };
}
