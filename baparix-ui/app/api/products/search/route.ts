import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Product Search API Route
 * 
 * This is a mock implementation for development and testing.
 * In production, this would proxy to the FastAPI backend.
 */

// Mock product data generator
function generateMockProduct(id: number, query: string) {
  const platforms = ['alibaba', 'pinduoduo', 'xianyu', 'skybuybd', 'dhgate', 'aliexpress'] as const;
  const qualityTiers = ['cheap', 'medium', 'high'] as const;
  
  const platform = platforms[id % platforms.length];
  const qualityTier = qualityTiers[id % qualityTiers.length];
  
  return {
    id: `product-${id}`,
    title: `${query} Product ${id}`,
    titleTranslated: `${query} পণ্য ${id}`,
    description: `High quality ${query} from reliable supplier`,
    descriptionTranslated: `নির্ভরযোগ্য সরবরাহকারী থেকে উচ্চ মানের ${query}`,
    images: [
      `https://picsum.photos/seed/${id}/400/400`,
      `https://picsum.photos/seed/${id + 1000}/400/400`,
    ],
    platform,
    priceRange: {
      min: 1000 + (id * 100),
      max: 5000 + (id * 200),
      currency: 'BDT',
    },
    qualityTier,
    moq: 10 + (id * 5),
    supplierInfo: {
      name: `Supplier ${id}`,
      rating: 3.5 + (id % 15) / 10,
      yearsActive: 2 + (id % 8),
      responseRate: 85 + (id % 15),
      reliabilityScore: 70 + (id % 30),
    },
    leadTime: `${7 + (id % 20)} days`,
    shippingOptions: ['Air Freight', 'Sea Freight'],
    category: query,
    tags: [query, 'wholesale', 'bulk'],
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const platforms = searchParams.getAll('platforms');
    const priceMin = parseFloat(searchParams.get('priceMin') || '0');
    const priceMax = parseFloat(searchParams.get('priceMax') || '100000');
    const qualityTiers = searchParams.getAll('qualityTier');
    const shippingTime = searchParams.get('shippingTime');
    const sortBy = searchParams.get('sortBy') || 'relevance';

    // Simulate API delay (500ms - 1500ms to meet <2s requirement)
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate mock products
    const totalProducts = 100; // Total available products
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalProducts);
    
    let products = [];
    for (let i = startIndex; i < endIndex; i++) {
      products.push(generateMockProduct(i + 1, query));
    }

    // Apply filters
    if (platforms.length > 0) {
      products = products.filter(p => platforms.includes(p.platform));
    }

    if (qualityTiers.length > 0) {
      products = products.filter(p => qualityTiers.includes(p.qualityTier));
    }

    products = products.filter(p => 
      p.priceRange.min >= priceMin && p.priceRange.max <= priceMax
    );

    if (shippingTime) {
      // Filter by shipping time (simplified)
      const leadTimeDays = products.map(p => parseInt(p.leadTime));
      if (shippingTime === '1-7') {
        products = products.filter((_, i) => leadTimeDays[i] <= 7);
      } else if (shippingTime === '8-15') {
        products = products.filter((_, i) => leadTimeDays[i] >= 8 && leadTimeDays[i] <= 15);
      } else if (shippingTime === '16-30') {
        products = products.filter((_, i) => leadTimeDays[i] >= 16 && leadTimeDays[i] <= 30);
      } else if (shippingTime === '30+') {
        products = products.filter((_, i) => leadTimeDays[i] > 30);
      }
    }

    // Apply sorting
    if (sortBy === 'price-asc') {
      products.sort((a, b) => a.priceRange.min - b.priceRange.min);
    } else if (sortBy === 'price-desc') {
      products.sort((a, b) => b.priceRange.max - a.priceRange.max);
    } else if (sortBy === 'rating') {
      products.sort((a, b) => b.supplierInfo.rating - a.supplierInfo.rating);
    } else if (sortBy === 'moq') {
      products.sort((a, b) => a.moq - b.moq);
    }

    const hasMore = endIndex < totalProducts;

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          total: totalProducts,
          hasMore,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search products',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
