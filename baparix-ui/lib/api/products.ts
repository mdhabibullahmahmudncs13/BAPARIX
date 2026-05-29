/**
 * Product Search API Client
 * Handles communication with backend product search endpoints
 */

export interface ProductSearchParams {
  query: string;
  platforms?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  qualityTier?: string[];
  shippingTime?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  titleTranslated?: string;
  description: string;
  descriptionTranslated?: string;
  images: string[];
  platform: 'alibaba' | 'pinduoduo' | 'xianyu' | 'skybuybd' | 'dhgate' | 'aliexpress';
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  qualityTier: 'cheap' | 'medium' | 'high';
  moq: number;
  supplierInfo: {
    name: string;
    rating: number;
    yearsActive: number;
    responseRate: number;
    reliabilityScore: number;
  };
  leadTime: string;
  shippingOptions: string[];
  priceHistory?: Array<{ date: Date; price: number }>;
  category: string;
  tags: string[];
  lastUpdated: Date;
}

export interface ProductSearchResponse {
  success: boolean;
  data: {
    products: ProductSearchResult[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    };
  };
  timestamp: string;
}

/**
 * Search for products across multiple platforms
 */
export async function searchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append('query', params.query);
  if (params.platforms?.length) {
    params.platforms.forEach(p => queryParams.append('platforms', p));
  }
  if (params.priceRange) {
    queryParams.append('priceMin', params.priceRange.min.toString());
    queryParams.append('priceMax', params.priceRange.max.toString());
  }
  if (params.qualityTier?.length) {
    params.qualityTier.forEach(q => queryParams.append('qualityTier', q));
  }
  if (params.shippingTime) queryParams.append('shippingTime', params.shippingTime);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  const response = await fetch(`/api/products/search?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Product search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get product details by ID
 */
export async function getProductById(id: string): Promise<ProductSearchResult> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}
