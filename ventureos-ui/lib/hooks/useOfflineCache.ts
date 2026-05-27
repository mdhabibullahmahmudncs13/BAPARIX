'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Represents a cached entry with metadata for expiration tracking.
 */
export interface CacheEntry<T = unknown> {
  /** The cached data */
  data: T;
  /** Timestamp when the data was cached (ms since epoch) */
  cachedAt: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Configuration options for the useOfflineCache hook.
 */
export interface OfflineCacheOptions {
  /** Cache key prefix to namespace entries (default: 'vo_cache') */
  prefix?: string;
  /** Default time-to-live in milliseconds (default: 24 hours) */
  defaultTTL?: number;
}

/**
 * Return type of the useOfflineCache hook.
 */
export interface OfflineCacheResult {
  /** Retrieve cached data by key. Returns null if not found or expired. */
  getCachedData: <T = unknown>(key: string) => T | null;
  /** Store data in the cache with an optional custom TTL. */
  setCachedData: <T = unknown>(key: string, data: T, ttl?: number) => boolean;
  /** Remove a specific cache entry by key. */
  clearCache: (key?: string) => void;
  /** Whether the storage backend is available. */
  isCacheAvailable: boolean;
}

const DEFAULT_PREFIX = 'vo_cache';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks if localStorage is available and functional.
 */
function checkStorageAvailability(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__vo_cache_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds the full storage key from prefix and cache key.
 */
function buildStorageKey(prefix: string, key: string): string {
  return `${prefix}:${key}`;
}

/**
 * Custom hook that provides offline data caching using localStorage.
 *
 * Provides a generic interface for caching and retrieving data locally,
 * with configurable TTL-based expiration. Designed to work alongside
 * React Query's offline persistence pattern.
 *
 * The storage backend uses localStorage with a clean interface that
 * could be swapped for PouchDB or IndexedDB later.
 *
 * Requirements:
 * - 13.2: While offline, allow users to view previously loaded Dashboard data
 * - 13.4: While offline, allow users to view saved blueprints
 */
export function useOfflineCache(options: OfflineCacheOptions = {}): OfflineCacheResult {
  const { prefix = DEFAULT_PREFIX, defaultTTL = DEFAULT_TTL } = options;

  const [isCacheAvailable] = useState<boolean>(() => checkStorageAvailability());

  const getCachedData = useCallback(
    <T = unknown>(key: string): T | null => {
      if (!isCacheAvailable) return null;

      try {
        const storageKey = buildStorageKey(prefix, key);
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(raw);

        // Check expiration
        const now = Date.now();
        if (now - entry.cachedAt > entry.ttl) {
          // Entry has expired — remove it
          window.localStorage.removeItem(storageKey);
          return null;
        }

        return entry.data;
      } catch {
        return null;
      }
    },
    [isCacheAvailable, prefix]
  );

  const setCachedData = useCallback(
    <T = unknown>(key: string, data: T, ttl?: number): boolean => {
      if (!isCacheAvailable) return false;

      try {
        const storageKey = buildStorageKey(prefix, key);
        const entry: CacheEntry<T> = {
          data,
          cachedAt: Date.now(),
          ttl: ttl ?? defaultTTL,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(entry));
        return true;
      } catch {
        // Storage full or other error
        return false;
      }
    },
    [isCacheAvailable, prefix, defaultTTL]
  );

  const clearCache = useCallback(
    (key?: string): void => {
      if (!isCacheAvailable) return;

      try {
        if (key) {
          // Remove a specific entry
          const storageKey = buildStorageKey(prefix, key);
          window.localStorage.removeItem(storageKey);
        } else {
          // Remove all entries with this prefix
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const storageKey = window.localStorage.key(i);
            if (storageKey && storageKey.startsWith(`${prefix}:`)) {
              keysToRemove.push(storageKey);
            }
          }
          keysToRemove.forEach((k) => window.localStorage.removeItem(k));
        }
      } catch {
        // Silently fail on storage errors
      }
    },
    [isCacheAvailable, prefix]
  );

  return useMemo(
    () => ({ getCachedData, setCachedData, clearCache, isCacheAvailable }),
    [getCachedData, setCachedData, clearCache, isCacheAvailable]
  );
}
