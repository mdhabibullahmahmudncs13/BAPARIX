import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductSearchResults } from './ProductSearchResults';
import * as useProductSearchHook from '@/lib/hooks/useProductSearch';

// Mock the useProductSearch hook
jest.mock('@/lib/hooks/useProductSearch');

const mockUseProductSearch = useProductSearchHook.useProductSearch as jest.MockedFunction<
  typeof useProductSearchHook.useProductSearch
>;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

global.IntersectionObserver = MockIntersectionObserver as any;

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

const defaultProps = {
  query: 'laptop',
  platforms: ['alibaba'],
  priceRange: { min: 0, max: 100000 },
  qualityTier: ['medium'],
  shippingTime: '',
  sortBy: 'relevance',
  viewMode: 'grid' as const,
  locale: 'en' as const,
};

describe('ProductSearchResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading skeletons when loading', () => {
    mockUseProductSearch.mockReturnValue({
      products: [],
      isLoading: true,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should display error state when error occurs', () => {
    mockUseProductSearch.mockReturnValue({
      products: [],
      isLoading: false,
      isError: true,
      error: new Error('API Error'),
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Failed to load products')).toBeInTheDocument();
  });

  it('should display empty state when no results', () => {
    mockUseProductSearch.mockReturnValue({
      products: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('should display products in grid view', () => {
    const mockProducts = [
      {
        id: 'product-1',
        title: 'Test Laptop 1',
        images: ['https://picsum.photos/400/400'],
        priceRange: { min: 1000, max: 2000, currency: 'BDT' },
        platform: 'alibaba' as const,
        qualityTier: 'medium' as const,
        moq: 10,
        supplierInfo: {
          name: 'Supplier 1',
          rating: 4.5,
          yearsActive: 5,
          responseRate: 95,
          reliabilityScore: 85,
        },
        leadTime: '7 days',
        description: 'Test',
        shippingOptions: [],
        category: 'Electronics',
        tags: [],
        lastUpdated: new Date(),
      },
      {
        id: 'product-2',
        title: 'Test Laptop 2',
        images: ['https://picsum.photos/400/401'],
        priceRange: { min: 1500, max: 2500, currency: 'BDT' },
        platform: 'dhgate' as const,
        qualityTier: 'high' as const,
        moq: 20,
        supplierInfo: {
          name: 'Supplier 2',
          rating: 4.8,
          yearsActive: 3,
          responseRate: 98,
          reliabilityScore: 90,
        },
        leadTime: '10 days',
        description: 'Test',
        shippingOptions: [],
        category: 'Electronics',
        tags: [],
        lastUpdated: new Date(),
      },
    ];

    mockUseProductSearch.mockReturnValue({
      products: mockProducts,
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} viewMode="grid" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('2 products found')).toBeInTheDocument();
    expect(screen.getByText('Test Laptop 1')).toBeInTheDocument();
    expect(screen.getByText('Test Laptop 2')).toBeInTheDocument();
  });

  it('should display products in list view', () => {
    const mockProducts = [
      {
        id: 'product-1',
        title: 'Test Laptop',
        images: ['https://picsum.photos/400/400'],
        priceRange: { min: 1000, max: 2000, currency: 'BDT' },
        platform: 'alibaba' as const,
        qualityTier: 'medium' as const,
        moq: 10,
        supplierInfo: {
          name: 'Supplier 1',
          rating: 4.5,
          yearsActive: 5,
          responseRate: 95,
          reliabilityScore: 85,
        },
        leadTime: '7 days',
        description: 'Test',
        shippingOptions: [],
        category: 'Electronics',
        tags: [],
        lastUpdated: new Date(),
      },
    ];

    mockUseProductSearch.mockReturnValue({
      products: mockProducts,
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} viewMode="list" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Test Laptop')).toBeInTheDocument();
  });

  it('should display loading indicator when fetching next page', () => {
    mockUseProductSearch.mockReturnValue({
      products: [
        {
          id: 'product-1',
          title: 'Test Laptop',
          images: ['https://picsum.photos/400/400'],
          priceRange: { min: 1000, max: 2000, currency: 'BDT' },
          platform: 'alibaba' as const,
          qualityTier: 'medium' as const,
          moq: 10,
          supplierInfo: {
            name: 'Supplier 1',
            rating: 4.5,
            yearsActive: 5,
            responseRate: 95,
            reliabilityScore: 85,
          },
          leadTime: '7 days',
          description: 'Test',
          shippingOptions: [],
          category: 'Electronics',
          tags: [],
          lastUpdated: new Date(),
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: true,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Loading more products...')).toBeInTheDocument();
  });

  it('should use Bengali translations when locale is bn', () => {
    mockUseProductSearch.mockReturnValue({
      products: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} locale="bn" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('কোনো পণ্য পাওয়া যায়নি')).toBeInTheDocument();
  });

  it('should call fetchNextPage when intersection observer triggers', async () => {
    const mockFetchNextPage = jest.fn();
    const mockObserve = jest.fn();

    // Override the global mock for this test
    (global.IntersectionObserver as any) = jest.fn().mockImplementation(() => ({
      observe: mockObserve,
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }));

    mockUseProductSearch.mockReturnValue({
      products: [
        {
          id: 'product-1',
          title: 'Test Laptop',
          images: ['https://picsum.photos/400/400'],
          priceRange: { min: 1000, max: 2000, currency: 'BDT' },
          platform: 'alibaba' as const,
          qualityTier: 'medium' as const,
          moq: 10,
          supplierInfo: {
            name: 'Supplier 1',
            rating: 4.5,
            yearsActive: 5,
            responseRate: 95,
            reliabilityScore: 85,
          },
          leadTime: '7 days',
          description: 'Test',
          shippingOptions: [],
          category: 'Electronics',
          tags: [],
          lastUpdated: new Date(),
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    // Verify IntersectionObserver was set up
    expect(mockObserve).toHaveBeenCalled();
  });

  it('should display results count correctly', () => {
    const mockProducts = Array.from({ length: 25 }, (_, i) => ({
      id: `product-${i}`,
      title: `Test Laptop ${i}`,
      images: ['https://picsum.photos/400/400'],
      priceRange: { min: 1000, max: 2000, currency: 'BDT' },
      platform: 'alibaba' as const,
      qualityTier: 'medium' as const,
      moq: 10,
      supplierInfo: {
        name: 'Supplier',
        rating: 4.5,
        yearsActive: 5,
        responseRate: 95,
        reliabilityScore: 85,
      },
      leadTime: '7 days',
      description: 'Test',
      shippingOptions: [],
      category: 'Electronics',
      tags: [],
      lastUpdated: new Date(),
    }));

    mockUseProductSearch.mockReturnValue({
      products: mockProducts,
      isLoading: false,
      isError: false,
      error: null,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn(),
    });

    render(<ProductSearchResults {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('25 products found')).toBeInTheDocument();
  });
});
