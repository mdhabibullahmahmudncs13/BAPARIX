/**
 * React Query hook for product search with debouncing and infinite scroll
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { searchProducts, ProductSearchParams, ProductSearchResult } from '@/lib/api/products';

export interface UseProductSearchOptions {
  query: string;
  platforms?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  qualityTier?: string[];
  shippingTime?: string;
  sortBy?: string;
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseProductSearchResult {
  products: ProductSearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

/**
 * Custom hook for debouncing values
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for product search with debouncing and infinite scroll pagination
 * 
 * Features:
 * - Debounced search queries (default 300ms)
 * - Infinite scroll pagination
 * - Automatic caching and background refetching
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * const { products, isLoading, fetchNextPage, hasNextPage } = useProductSearch({
 *   query: 'laptop',
 *   platforms: ['alibaba', 'dhgate'],
 *   pageSize: 20
 * });
 * ```
 */
export function useProductSearch(options: UseProductSearchOptions): UseProductSearchResult {
  const {
    query,
    platforms,
    priceRange,
    qualityTier,
    shippingTime,
    sortBy,
    pageSize = 20,
    debounceMs = 300,
    enabled = true,
  } = options;

  // Debounce the search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, debounceMs);

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'products',
      'search',
      debouncedQuery,
      platforms,
      priceRange,
      qualityTier,
      shippingTime,
      sortBy,
      pageSize,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params: ProductSearchParams = {
        query: debouncedQuery,
        platforms,
        priceRange,
        qualityTier,
        shippingTime,
        sortBy,
        page: pageParam,
        pageSize,
      };

      const response = await searchProducts(params);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Flatten paginated results into a single array
  const products = data?.pages.flatMap((page) => page.products) ?? [];

  return {
    products,
    isLoading,
    isError,
    error: error as Error | null,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refetch,
  };
}
