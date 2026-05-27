'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const LITE_MODE_STORAGE_KEY = 'ventureos-lite-mode';

export interface LiteConfig {
  /** Image quality parameter (q=30 in lite, q=75 in normal) */
  imageQuality: number;
  /** Maximum image width in pixels (400px in lite, 1200px in normal) */
  maxImageSize: number;
  /** Number of items per API page (5 in lite, 20 in normal) */
  apiPageSize: number;
  /** Whether auto-refresh/background refetching is enabled */
  autoRefreshEnabled: boolean;
  /** Whether chart animations are enabled */
  chartAnimationsEnabled: boolean;
}

export interface UseLiteModeReturn {
  /** Whether lite mode is currently enabled */
  isLiteMode: boolean;
  /** Toggle lite mode on/off */
  toggleLiteMode: () => void;
  /** Configuration values adjusted based on lite mode state */
  liteConfig: LiteConfig;
}

const NORMAL_CONFIG: LiteConfig = {
  imageQuality: 75,
  maxImageSize: 1200,
  apiPageSize: 20,
  autoRefreshEnabled: true,
  chartAnimationsEnabled: true,
};

const LITE_CONFIG: LiteConfig = {
  imageQuality: 30,
  maxImageSize: 400,
  apiPageSize: 5,
  autoRefreshEnabled: false,
  chartAnimationsEnabled: false,
};

/**
 * Custom hook that provides lite mode functionality for reduced data usage.
 * When enabled, reduces data usage by ~70% through image compression and reduced API calls.
 *
 * Requirements:
 * - 16.6: Where lite mode is enabled, reduce data usage by 70% through image compression and reduced API calls
 */
export function useLiteMode(): UseLiteModeReturn {
  const [isLiteMode, setIsLiteMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const stored = localStorage.getItem(LITE_MODE_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Sync with localStorage on mount (handles SSR hydration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LITE_MODE_STORAGE_KEY);
      const storedValue = stored === 'true';
      if (storedValue !== isLiteMode) {
        setIsLiteMode(storedValue);
      }
    } catch {
      // localStorage unavailable, keep default
    }
  }, []);

  const toggleLiteMode = useCallback(() => {
    setIsLiteMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LITE_MODE_STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable, still toggle in-memory
      }
      return next;
    });
  }, []);

  const liteConfig = useMemo<LiteConfig>(
    () => (isLiteMode ? LITE_CONFIG : NORMAL_CONFIG),
    [isLiteMode]
  );

  return { isLiteMode, toggleLiteMode, liteConfig };
}
