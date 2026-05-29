'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Represents a user currently online in the workspace
 */
export interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  currentSection: string;
  lastSeen: Date;
}

/**
 * Supabase Realtime channel interface (subset used by this hook)
 */
export interface RealtimeChannel {
  on: (event: string, filter: Record<string, unknown>, callback: (payload: unknown) => void) => RealtimeChannel;
  subscribe: (callback?: (status: string) => void) => RealtimeChannel;
  unsubscribe: () => void;
  track: (state: Record<string, unknown>) => void;
  untrack: () => void;
}

/**
 * Supabase client interface (subset used by this hook)
 */
export interface SupabaseRealtimeClient {
  channel: (name: string, opts?: Record<string, unknown>) => RealtimeChannel;
  removeChannel: (channel: RealtimeChannel) => void;
}

export interface UseRealtimePresenceOptions {
  /** Supabase client instance */
  client: SupabaseRealtimeClient | null;
  /** Workspace/room identifier */
  workspaceId: string;
  /** Current user info */
  user: {
    userId: string;
    name: string;
    avatarUrl?: string;
  } | null;
  /** Initial section the user is viewing */
  initialSection?: string;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

export interface UseRealtimePresenceReturn {
  /** List of users currently online in the workspace */
  onlineUsers: PresenceUser[];
  /** The section the current user is viewing */
  currentSection: string;
  /** Update the section the current user is viewing */
  setCurrentSection: (section: string) => void;
  /** Whether the realtime connection is active */
  isConnected: boolean;
}

/**
 * Custom hook for real-time presence tracking via Supabase Realtime.
 *
 * Connects to a Supabase Realtime channel for presence tracking,
 * tracks which section each user is currently viewing, and provides
 * a list of online users with their current sections.
 *
 * @example
 * ```tsx
 * const { onlineUsers, currentSection, setCurrentSection, isConnected } = useRealtimePresence({
 *   client: supabaseClient,
 *   workspaceId: 'workspace-123',
 *   user: { userId: 'user-1', name: 'Alice' },
 *   initialSection: 'dashboard',
 * });
 * ```
 */
export function useRealtimePresence({
  client,
  workspaceId,
  user,
  initialSection = 'dashboard',
  enabled = true,
}: UseRealtimePresenceOptions): UseRealtimePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentSection, setCurrentSectionState] = useState<string>(initialSection);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const setCurrentSection = useCallback(
    (section: string) => {
      setCurrentSectionState(section);

      // Update presence state on the channel
      if (channelRef.current && user) {
        channelRef.current.track({
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
          currentSection: section,
          lastSeen: new Date().toISOString(),
        });
      }
    },
    [user]
  );

  useEffect(() => {
    if (!client || !user || !workspaceId || !enabled) {
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    const channelName = `presence:workspace:${workspaceId}`;
    const channel = client.channel(channelName, {
      config: { presence: { key: user.userId } },
    });

    channelRef.current = channel;

    // Handle presence sync events
    channel.on('presence', { event: 'sync' }, (payload: unknown) => {
      const state = payload as Record<string, PresenceUser[]> | undefined;
      if (state) {
        const users: PresenceUser[] = Object.values(state)
          .flat()
          .map((presence) => ({
            userId: presence.userId,
            name: presence.name,
            avatarUrl: presence.avatarUrl,
            currentSection: presence.currentSection,
            lastSeen: new Date(presence.lastSeen),
          }));
        setOnlineUsers(users);
      }
    });

    // Handle user joining
    channel.on('presence', { event: 'join' }, (payload: unknown) => {
      const { newPresences } = payload as { newPresences: PresenceUser[] };
      if (newPresences) {
        setOnlineUsers((prev) => {
          const updated = [...prev];
          for (const presence of newPresences) {
            const existingIndex = updated.findIndex((u) => u.userId === presence.userId);
            const newUser: PresenceUser = {
              userId: presence.userId,
              name: presence.name,
              avatarUrl: presence.avatarUrl,
              currentSection: presence.currentSection,
              lastSeen: new Date(presence.lastSeen),
            };
            if (existingIndex >= 0) {
              updated[existingIndex] = newUser;
            } else {
              updated.push(newUser);
            }
          }
          return updated;
        });
      }
    });

    // Handle user leaving
    channel.on('presence', { event: 'leave' }, (payload: unknown) => {
      const { leftPresences } = payload as { leftPresences: PresenceUser[] };
      if (leftPresences) {
        const leftIds = leftPresences.map((p) => p.userId);
        setOnlineUsers((prev) => prev.filter((u) => !leftIds.includes(u.userId)));
      }
    });

    // Subscribe and track own presence
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        channel.track({
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
          currentSection: currentSection,
          lastSeen: new Date().toISOString(),
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      channel.untrack();
      client.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, workspaceId, user?.userId, enabled]);

  return {
    onlineUsers,
    currentSection,
    setCurrentSection,
    isConnected,
  };
}
