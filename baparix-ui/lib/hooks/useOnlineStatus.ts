'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface OnlineStatus {
  /** Whether the browser currently has network connectivity */
  isOnline: boolean;
  /** Timestamp of when the user was last online (null if always online) */
  lastOnlineAt: Date | null;
}

/**
 * Custom hook that tracks online/offline connectivity status.
 * Uses navigator.onLine and window online/offline events.
 *
 * Requirements:
 * - 13.1: Detect when user loses internet connectivity
 * - 13.6: Track connectivity state for sync status display
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const wasOnlineRef = useRef(isOnline);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    wasOnlineRef.current = true;
  }, []);

  const handleOffline = useCallback(() => {
    setLastOnlineAt(new Date());
    setIsOnline(false);
    wasOnlineRef.current = false;
  }, []);

  useEffect(() => {
    // Sync initial state in case it changed between render and effect
    const currentOnline = navigator.onLine;
    if (currentOnline !== wasOnlineRef.current) {
      setIsOnline(currentOnline);
      wasOnlineRef.current = currentOnline;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, lastOnlineAt };
}
