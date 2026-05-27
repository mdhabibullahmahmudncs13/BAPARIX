'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Represents a queued mutation item stored for offline processing.
 */
export interface OfflineQueueItem<T = unknown> {
  /** Unique identifier for the queue item */
  id: string;
  /** Mutation type identifier (e.g., 'CREATE_FINANCIAL_ENTRY') */
  type: string;
  /** The mutation payload data */
  data: T;
  /** Timestamp when the item was queued (ms since epoch) */
  timestamp: number;
  /** Number of times processing has been attempted */
  retryCount: number;
  /** Maximum number of retry attempts before giving up */
  maxRetries: number;
}

/**
 * Configuration options for the useOfflineQueue hook.
 */
export interface OfflineQueueOptions {
  /** Storage key prefix (default: 'vo_offline_queue') */
  storageKey?: string;
  /** Maximum retry attempts for failed items (default: 3) */
  maxRetries?: number;
  /** Delay in ms before processing queue after reconnection (default: 1000) */
  processingDelay?: number;
  /** The mutation processor function that handles each queued item */
  processMutation?: (item: OfflineQueueItem) => Promise<boolean>;
}

/**
 * Return type of the useOfflineQueue hook.
 */
export interface OfflineQueueResult {
  /** Add a mutation to the offline queue */
  addToQueue: <T = unknown>(type: string, data: T) => string;
  /** Number of items currently in the queue */
  queueLength: number;
  /** Whether the queue is currently being processed */
  isProcessing: boolean;
  /** Timestamp of the last successful sync (null if never synced) */
  lastSyncAt: Date | null;
  /** Manually trigger queue processing */
  processQueue: () => Promise<void>;
}

const DEFAULT_STORAGE_KEY = 'vo_offline_queue';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_PROCESSING_DELAY = 1000;
const LAST_SYNC_KEY_SUFFIX = ':last_sync';

/**
 * Generates a unique ID for queue items.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Reads the queue from localStorage.
 */
function readQueue(storageKey: string): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Writes the queue to localStorage.
 */
function writeQueue(storageKey: string, queue: OfflineQueueItem[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the last sync timestamp from localStorage.
 */
function readLastSync(storageKey: string): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey + LAST_SYNC_KEY_SUFFIX);
    if (!raw) return null;
    return new Date(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Writes the last sync timestamp to localStorage.
 */
function writeLastSync(storageKey: string, date: Date): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      storageKey + LAST_SYNC_KEY_SUFFIX,
      JSON.stringify(date.toISOString())
    );
  } catch {
    // Silently fail on storage errors
  }
}

/**
 * Custom hook that provides an offline mutation queue.
 *
 * Queues mutations when the user is offline and automatically processes
 * them when connectivity is restored. Items are persisted in localStorage
 * and processed within 5 seconds of reconnection.
 *
 * The storage backend uses localStorage with a clean interface that
 * could be swapped for PouchDB or IndexedDB later.
 *
 * Requirements:
 * - 13.3: While offline, allow users to log financial tracker entries
 * - 13.5: When connectivity is restored, synchronize offline changes within 5 seconds
 */
export function useOfflineQueue(options: OfflineQueueOptions = {}): OfflineQueueResult {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    maxRetries = DEFAULT_MAX_RETRIES,
    processingDelay = DEFAULT_PROCESSING_DELAY,
    processMutation,
  } = options;

  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => readQueue(storageKey));
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(() => readLastSync(storageKey));

  const isProcessingRef = useRef(false);
  const processMutationRef = useRef(processMutation);
  const storageKeyRef = useRef(storageKey);
  const maxRetriesRef = useRef(maxRetries);

  // Keep refs in sync with latest values
  useEffect(() => {
    processMutationRef.current = processMutation;
  }, [processMutation]);

  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);

  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);

  /**
   * Add a mutation to the offline queue.
   * Returns the generated ID of the queued item.
   */
  const addToQueue = useCallback(
    <T = unknown>(type: string, data: T): string => {
      const id = generateId();
      const item: OfflineQueueItem<T> = {
        id,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: maxRetriesRef.current,
      };

      setQueue((prev) => {
        const updated = [...prev, item as OfflineQueueItem];
        writeQueue(storageKeyRef.current, updated);
        return updated;
      });

      return id;
    },
    []
  );

  /**
   * Process all items in the queue sequentially.
   * Items that fail are retried up to maxRetries times.
   * Items exceeding maxRetries are removed from the queue.
   */
  const processQueue = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current) return;
    if (!processMutationRef.current) return;

    const currentQueue = readQueue(storageKeyRef.current);
    if (currentQueue.length === 0) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    const remainingItems: OfflineQueueItem[] = [];

    for (const item of currentQueue) {
      try {
        const success = await processMutationRef.current(item);
        if (!success) {
          const updatedItem = { ...item, retryCount: item.retryCount + 1 };
          if (updatedItem.retryCount < updatedItem.maxRetries) {
            remainingItems.push(updatedItem);
          }
          // Items exceeding maxRetries are dropped
        }
        // Success: item is not added back to queue
      } catch {
        const updatedItem = { ...item, retryCount: item.retryCount + 1 };
        if (updatedItem.retryCount < updatedItem.maxRetries) {
          remainingItems.push(updatedItem);
        }
        // Items exceeding maxRetries are dropped
      }
    }

    // Update storage and state
    writeQueue(storageKeyRef.current, remainingItems);
    setQueue(remainingItems);

    // Update last sync time
    const syncTime = new Date();
    writeLastSync(storageKeyRef.current, syncTime);
    setLastSyncAt(syncTime);

    isProcessingRef.current = false;
    setIsProcessing(false);
  }, []);

  /**
   * Listen for online events and trigger queue processing.
   * Processing starts within the configured delay (default 1s)
   * to ensure synchronization happens within 5 seconds of reconnection.
   */
  useEffect(() => {
    const handleOnline = () => {
      // Delay slightly to allow network to stabilize, but stay well within 5s
      const timer = setTimeout(() => {
        processQueue();
      }, processingDelay);

      return () => clearTimeout(timer);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processQueue, processingDelay]);

  const queueLength = queue.length;

  return useMemo(
    () => ({
      addToQueue,
      queueLength,
      isProcessing,
      lastSyncAt,
      processQueue,
    }),
    [addToQueue, queueLength, isProcessing, lastSyncAt, processQueue]
  );
}
