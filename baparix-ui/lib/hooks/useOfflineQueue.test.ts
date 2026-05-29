import { renderHook, act } from '@testing-library/react';
import { useOfflineQueue, OfflineQueueItem } from './useOfflineQueue';

/**
 * Unit tests for useOfflineQueue hook
 *
 * Requirements:
 * - 13.3: While offline, allow users to log financial tracker entries
 * - 13.5: When connectivity is restored, synchronize offline changes within 5 seconds
 */

describe('useOfflineQueue', () => {
  const STORAGE_KEY = 'vo_offline_queue_test';

  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
  });

  describe('addToQueue', () => {
    it('should add an item to the queue', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      expect(result.current.queueLength).toBe(0);

      act(() => {
        result.current.addToQueue('CREATE_FINANCIAL_ENTRY', {
          amount: 5000,
          type: 'revenue',
          description: 'Product sale',
        });
      });

      expect(result.current.queueLength).toBe(1);
    });

    it('should return a unique ID for each queued item', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      let id1: string = '';
      let id2: string = '';

      act(() => {
        id1 = result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
        id2 = result.current.addToQueue('CREATE_ENTRY', { amount: 200 });
      });

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should persist queued items to localStorage', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      act(() => {
        result.current.addToQueue('CREATE_FINANCIAL_ENTRY', {
          amount: 1500,
          type: 'expense',
        });
      });

      const stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) || '[]'
      );
      expect(stored).toHaveLength(1);
      expect(stored[0].type).toBe('CREATE_FINANCIAL_ENTRY');
      expect(stored[0].data.amount).toBe(1500);
    });

    it('should set retryCount to 0 and maxRetries from options', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY, maxRetries: 5 })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      const stored: OfflineQueueItem[] = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) || '[]'
      );
      expect(stored[0].retryCount).toBe(0);
      expect(stored[0].maxRetries).toBe(5);
    });

    it('should include a timestamp on queued items', () => {
      const now = Date.now();
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      const stored: OfflineQueueItem[] = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) || '[]'
      );
      expect(stored[0].timestamp).toBeGreaterThanOrEqual(now);
    });
  });

  describe('processQueue', () => {
    it('should process all items in the queue', async () => {
      const processMutation = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY, processMutation })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
        result.current.addToQueue('CREATE_ENTRY', { amount: 200 });
      });

      expect(result.current.queueLength).toBe(2);

      await act(async () => {
        await result.current.processQueue();
      });

      expect(processMutation).toHaveBeenCalledTimes(2);
      expect(result.current.queueLength).toBe(0);
    });

    it('should update lastSyncAt after processing', async () => {
      const processMutation = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY, processMutation })
      );

      expect(result.current.lastSyncAt).toBeNull();

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.lastSyncAt).toBeInstanceOf(Date);
    });

    it('should set isProcessing to true during processing', async () => {
      let resolveProcessing: () => void;
      const processMutation = jest.fn().mockImplementation(
        () =>
          new Promise<boolean>((resolve) => {
            resolveProcessing = () => resolve(true);
          })
      );

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY, processMutation })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      let processPromise: Promise<void>;
      act(() => {
        processPromise = result.current.processQueue();
      });

      expect(result.current.isProcessing).toBe(true);

      await act(async () => {
        resolveProcessing!();
        await processPromise!;
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should retry failed items up to maxRetries', async () => {
      const processMutation = jest.fn().mockResolvedValue(false);

      const { result } = renderHook(() =>
        useOfflineQueue({
          storageKey: STORAGE_KEY,
          processMutation,
          maxRetries: 3,
        })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      // First processing attempt - item fails, retryCount becomes 1
      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queueLength).toBe(1);

      // Second processing attempt - item fails, retryCount becomes 2
      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queueLength).toBe(1);

      // Third processing attempt - item fails, retryCount becomes 3 (>= maxRetries), dropped
      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queueLength).toBe(0);
    });

    it('should drop items that throw errors after maxRetries', async () => {
      const processMutation = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useOfflineQueue({
          storageKey: STORAGE_KEY,
          processMutation,
          maxRetries: 2,
        })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      // First attempt - throws, retryCount becomes 1
      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queueLength).toBe(1);

      // Second attempt - throws, retryCount becomes 2 (>= maxRetries), dropped
      await act(async () => {
        await result.current.processQueue();
      });

      expect(result.current.queueLength).toBe(0);
    });

    it('should not process if no processMutation is provided', async () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      await act(async () => {
        await result.current.processQueue();
      });

      // Queue remains unchanged since there's no processor
      expect(result.current.queueLength).toBe(1);
    });

    it('should not process if queue is empty', async () => {
      const processMutation = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY, processMutation })
      );

      await act(async () => {
        await result.current.processQueue();
      });

      expect(processMutation).not.toHaveBeenCalled();
    });
  });

  describe('automatic processing on reconnection', () => {
    it('should process queue when online event fires', async () => {
      const processMutation = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useOfflineQueue({
          storageKey: STORAGE_KEY,
          processMutation,
          processingDelay: 1000,
        })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      // Simulate going online
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        jest.advanceTimersByTime(1000);
        // Allow the async processQueue to complete
        await Promise.resolve();
      });

      expect(processMutation).toHaveBeenCalledTimes(1);
      expect(result.current.queueLength).toBe(0);
    });

    it('should process within 5 seconds of reconnection (default delay)', async () => {
      const processMutation = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useOfflineQueue({
          storageKey: STORAGE_KEY,
          processMutation,
          // Default processingDelay is 1000ms, well within 5s requirement
        })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 500 });
      });

      // Simulate going online
      await act(async () => {
        window.dispatchEvent(new Event('online'));
        // Advance less than 5 seconds
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(processMutation).toHaveBeenCalled();
    });

    it('should clean up online event listener on unmount', () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('persistence', () => {
    it('should restore queue from localStorage on mount', () => {
      // Pre-populate localStorage
      const existingQueue: OfflineQueueItem[] = [
        {
          id: 'existing-1',
          type: 'CREATE_ENTRY',
          data: { amount: 300 },
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
        },
      ];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existingQueue));

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      expect(result.current.queueLength).toBe(1);
    });

    it('should restore lastSyncAt from localStorage on mount', () => {
      const syncDate = new Date('2024-01-15T10:30:00Z');
      window.localStorage.setItem(
        STORAGE_KEY + ':last_sync',
        JSON.stringify(syncDate.toISOString())
      );

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      expect(result.current.lastSyncAt).toEqual(syncDate);
    });

    it('should persist lastSyncAt to localStorage after processing', async () => {
      const processMutation = jest.fn().mockResolvedValue(true);

      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY, processMutation })
      );

      act(() => {
        result.current.addToQueue('CREATE_ENTRY', { amount: 100 });
      });

      await act(async () => {
        await result.current.processQueue();
      });

      const storedSync = window.localStorage.getItem(
        STORAGE_KEY + ':last_sync'
      );
      expect(storedSync).toBeTruthy();
    });
  });

  describe('queue status', () => {
    it('should report correct queueLength after multiple additions', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      act(() => {
        result.current.addToQueue('TYPE_A', { a: 1 });
        result.current.addToQueue('TYPE_B', { b: 2 });
        result.current.addToQueue('TYPE_C', { c: 3 });
      });

      expect(result.current.queueLength).toBe(3);
    });

    it('should start with isProcessing as false', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      expect(result.current.isProcessing).toBe(false);
    });

    it('should start with lastSyncAt as null when no previous sync', () => {
      const { result } = renderHook(() =>
        useOfflineQueue({ storageKey: STORAGE_KEY })
      );

      expect(result.current.lastSyncAt).toBeNull();
    });
  });
});
