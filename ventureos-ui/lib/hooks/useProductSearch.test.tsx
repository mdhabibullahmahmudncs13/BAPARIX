import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductSearch } from './useProductSearch';
import * as productsApi from '@/lib/api/products';

// Mock the products API
jest.mock('@/lib/api/products');

const mockSearchProducts = productsApi.searchProducts as jest.MockedFunction<
  typeof productsApi.searchProducts
>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useProductSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(
      () => useProductSearch({ query: '', enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.products).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('should fetch products when query is provided', async () => {
    const mockResponse = {
      success: true,
      data: {
        products: [
          {
            id: 'product-1',
            title: 'Test Product',
            platform: 'alibaba' as const,
            priceRange: { min: 1000, max: 2000, currency: 'BDT' },
            qualityTier: 'medium' as const,
            moq: 10,
            supplierInfo: {
              name: 'Test Supplier',
              rating: 4.5,
              yearsActive: 5,
              responseRate: 95,
              reliabilityScore: 85,
            },
            leadTime: '7 days',
            images: ['image1.jpg'],
            description: 'Test description',
            shippingOptions: ['Air'],
            category: 'Electronics',
            tags: ['test'],
            lastUpdated: new Date(),
          },
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
          hasMore: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockSearchProducts.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useProductSearch({ query: 'laptop', pageSize: 20 }),
      { wrapper: createWrapper() }
    );

    // Wait for debounce and query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 }
    );

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].title).toBe('Test Product');
  });

  it('should debounce search queries', async () => {
    mockSearchProducts.mockResolvedValue({
      success: true,
      data: {
        products: [],
        pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
      },
      timestamp: new Date().toISOString(),
    });

    const { rerender } = renderHook(
      ({ query }) => useProductSearch({ query, debounceMs: 300 }),
      {
        wrapper: createWrapper(),
        initialProps: { query: 'l' },
      }
    );

    // Rapidly change query
    rerender({ query: 'la' });
    rerender({ query: 'lap' });
    rerender({ query: 'lapt' });
    rerender({ query: 'laptop' });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockSearchProducts).toHaveBeenCalledTimes(1);
      },
      { timeout: 500 }
    );
  });

  it('should handle pagination correctly', async () => {
    const page1Response = {
      success: true,
      data: {
        products: [{ id: 'product-1' }] as any,
        pagination: { page: 1, pageSize: 20, total: 40, hasMore: true },
      },
      timestamp: new Date().toISOString(),
    };

    const page2Response = {
      success: true,
      data: {
        products: [{ id: 'product-2' }] as any,
        pagination: { page: 2, pageSize: 20, total: 40, hasMore: false },
      },
      timestamp: new Date().toISOString(),
    };

    mockSearchProducts
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    const { result } = renderHook(
      () => useProductSearch({ query: 'laptop', pageSize: 20 }),
      { wrapper: createWrapper() }
    );

    // Wait for first page
    await waitFor(() => {
      expect(result.current.products).toHaveLength(1);
    });

    expect(result.current.hasNextPage).toBe(true);

    // Fetch next page
    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should apply filters correctly', async () => {
    mockSearchProducts.mockResolvedValue({
      success: true,
      data: {
        products: [],
        pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
      },
      timestamp: new Date().toISOString(),
    });

    renderHook(
      () =>
        useProductSearch({
          query: 'laptop',
          platforms: ['alibaba', 'dhgate'],
          priceRange: { min: 1000, max: 5000 },
          qualityTier: ['medium', 'high'],
          shippingTime: '1-7',
          sortBy: 'price-asc',
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockSearchProducts).toHaveBeenCalled();
    });

    const callArgs = mockSearchProducts.mock.calls[0][0];
    expect(callArgs.platforms).toEqual(['alibaba', 'dhgate']);
    expect(callArgs.priceRange).toEqual({ min: 1000, max: 5000 });
    expect(callArgs.qualityTier).toEqual(['medium', 'high']);
    expect(callArgs.shippingTime).toBe('1-7');
    expect(callArgs.sortBy).toBe('price-asc');
  });

  it('should handle errors gracefully', async () => {
    mockSearchProducts.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(
      () => useProductSearch({ query: 'laptop' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.products).toEqual([]);
  });

  it('should not fetch when query is empty', async () => {
    renderHook(() => useProductSearch({ query: '' }), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure no call is made
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it('should respect enabled flag', async () => {
    renderHook(() => useProductSearch({ query: 'laptop', enabled: false }), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(mockSearchProducts).not.toHaveBeenCalled();
  });
});
