import { renderHook, act } from '@testing-library/react';
import { useOfflineCache } from './useOfflineCache';

/**
 * Unit tests for useOfflineCache hook
 *
 * Requirements:
 * - 13.2: While offline, allow users to view previously loaded Dashboard data
 * - 13.4: While offline, allow users to view saved blueprints
 */

describe('useOfflineCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('isCacheAvailable', () => {
    it('should return true when localStorage is available', () => {
      const { result } = renderHook(() => useOfflineCache());
      expect(result.current.isCacheAvailable).toBe(true);
    });

    it('should return false when localStorage throws', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useOfflineCache());
      expect(result.current.isCacheAvailable).toBe(false);

      setItemSpy.mockRestore();
    });
  });

  describe('setCachedData', () => {
    it('should store data in localStorage with default TTL', () => {
      const { result } = renderHook(() => useOfflineCache());

      let success: boolean = false;
      act(() => {
        success = result.current.setCachedData('dashboard', { metrics: [1, 2, 3] });
      });

      expect(success).toBe(true);

      const stored = window.localStorage.getItem('vo_cache:dashboard');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.data).toEqual({ metrics: [1, 2, 3] });
      expect(parsed.ttl).toBe(24 * 60 * 60 * 1000);
      expect(typeof parsed.cachedAt).toBe('number');
    });

    it('should store data with a custom TTL', () => {
      const { result } = renderHook(() => useOfflineCache());

      act(() => {
        result.current.setCachedData('blueprint-1', { name: 'Test' }, 3600000);
      });

      const stored = window.localStorage.getItem('vo_cache:blueprint-1');
      const parsed = JSON.parse(stored!);
      expect(parsed.ttl).toBe(3600000);
    });

    it('should use custom prefix when provided', () => {
      const { result } = renderHook(() => useOfflineCache({ prefix: 'custom' }));

      act(() => {
        result.current.setCachedData('key1', 'value1');
      });

      expect(window.localStorage.getItem('custom:key1')).not.toBeNull();
      expect(window.localStorage.getItem('vo_cache:key1')).toBeNull();
    });

    it('should return false when storage is full', () => {
      const { result } = renderHook(() => useOfflineCache());

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(
        (key: string) => {
          // Allow the availability check to pass but fail on actual data storage
          if (key !== '__vo_cache_test__') {
            throw new Error('QuotaExceededError');
          }
        }
      );

      let success: boolean = true;
      act(() => {
        success = result.current.setCachedData('big-data', { huge: 'payload' });
      });

      expect(success).toBe(false);
      setItemSpy.mockRestore();
    });
  });

  describe('getCachedData', () => {
    it('should retrieve previously cached data', () => {
      const { result } = renderHook(() => useOfflineCache());

      act(() => {
        result.current.setCachedData('dashboard', { revenue: 5000 });
      });

      let data: unknown;
      act(() => {
        data = result.current.getCachedData('dashboard');
      });

      expect(data).toEqual({ revenue: 5000 });
    });

    it('should return null for non-existent keys', () => {
      const { result } = renderHook(() => useOfflineCache());

      let data: unknown;
      act(() => {
        data = result.current.getCachedData('nonexistent');
      });

      expect(data).toBeNull();
    });

    it('should return null for expired entries', () => {
      const { result } = renderHook(() => useOfflineCache());

      // Manually insert an expired entry
      const expiredEntry = {
        data: { old: 'data' },
        cachedAt: Date.now() - 50000, // 50 seconds ago
        ttl: 10000, // 10 second TTL (already expired)
      };
      window.localStorage.setItem('vo_cache:expired-key', JSON.stringify(expiredEntry));

      let data: unknown;
      act(() => {
        data = result.current.getCachedData('expired-key');
      });

      expect(data).toBeNull();
      // Should also remove the expired entry
      expect(window.localStorage.getItem('vo_cache:expired-key')).toBeNull();
    });

    it('should return data for non-expired entries', () => {
      const { result } = renderHook(() => useOfflineCache());

      // Manually insert a valid entry
      const validEntry = {
        data: { fresh: 'data' },
        cachedAt: Date.now() - 1000, // 1 second ago
        ttl: 60000, // 60 second TTL (still valid)
      };
      window.localStorage.setItem('vo_cache:valid-key', JSON.stringify(validEntry));

      let data: unknown;
      act(() => {
        data = result.current.getCachedData('valid-key');
      });

      expect(data).toEqual({ fresh: 'data' });
    });

    it('should return null for malformed JSON entries', () => {
      window.localStorage.setItem('vo_cache:bad-json', 'not valid json{{{');

      const { result } = renderHook(() => useOfflineCache());

      let data: unknown;
      act(() => {
        data = result.current.getCachedData('bad-json');
      });

      expect(data).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should remove a specific cache entry when key is provided', () => {
      const { result } = renderHook(() => useOfflineCache());

      act(() => {
        result.current.setCachedData('key1', 'value1');
        result.current.setCachedData('key2', 'value2');
      });

      act(() => {
        result.current.clearCache('key1');
      });

      expect(window.localStorage.getItem('vo_cache:key1')).toBeNull();
      expect(window.localStorage.getItem('vo_cache:key2')).not.toBeNull();
    });

    it('should remove all prefixed entries when no key is provided', () => {
      const { result } = renderHook(() => useOfflineCache());

      act(() => {
        result.current.setCachedData('key1', 'value1');
        result.current.setCachedData('key2', 'value2');
      });

      // Add a non-prefixed item that should NOT be removed
      window.localStorage.setItem('other_data', 'should_remain');

      act(() => {
        result.current.clearCache();
      });

      expect(window.localStorage.getItem('vo_cache:key1')).toBeNull();
      expect(window.localStorage.getItem('vo_cache:key2')).toBeNull();
      expect(window.localStorage.getItem('other_data')).toBe('should_remain');
    });
  });

  describe('custom defaultTTL', () => {
    it('should use custom defaultTTL from options', () => {
      const customTTL = 5 * 60 * 1000; // 5 minutes
      const { result } = renderHook(() => useOfflineCache({ defaultTTL: customTTL }));

      act(() => {
        result.current.setCachedData('short-lived', { temp: true });
      });

      const stored = window.localStorage.getItem('vo_cache:short-lived');
      const parsed = JSON.parse(stored!);
      expect(parsed.ttl).toBe(customTTL);
    });
  });

  describe('dashboard and blueprint caching (Req 13.2, 13.4)', () => {
    it('should cache and retrieve dashboard data for offline viewing', () => {
      const { result } = renderHook(() => useOfflineCache());

      const dashboardData = {
        revenue: 150000,
        expenses: 80000,
        trends: [{ category: 'electronics', growth: 12 }],
        lastUpdated: '2024-01-15T10:00:00Z',
      };

      act(() => {
        result.current.setCachedData('dashboard:overview', dashboardData);
      });

      let cached: unknown;
      act(() => {
        cached = result.current.getCachedData('dashboard:overview');
      });

      expect(cached).toEqual(dashboardData);
    });

    it('should cache and retrieve saved blueprints for offline viewing', () => {
      const { result } = renderHook(() => useOfflineCache());

      const blueprint = {
        id: 'bp-123',
        productIdea: 'Electronics reselling',
        businessModelCanvas: {
          valueProposition: 'Affordable electronics',
          customerSegments: ['Young professionals'],
        },
        financialProjections: {
          scenarios: { base: [{ month: 1, revenue: 50000 }] },
        },
      };

      act(() => {
        result.current.setCachedData('blueprint:bp-123', blueprint);
      });

      let cached: unknown;
      act(() => {
        cached = result.current.getCachedData('blueprint:bp-123');
      });

      expect(cached).toEqual(blueprint);
    });
  });
});
