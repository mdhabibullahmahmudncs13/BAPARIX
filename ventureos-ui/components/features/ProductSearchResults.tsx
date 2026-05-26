'use client';

import React, { useEffect, useRef } from 'react';
import { MarketplaceCard } from '@/components/ui/MarketplaceCard';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProductSearch } from '@/lib/hooks/useProductSearch';

export interface ProductSearchResultsProps {
  query: string;
  platforms: string[];
  priceRange: {
    min: number;
    max: number;
  };
  qualityTier: string[];
  shippingTime: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  locale: 'bn' | 'en';
  onProductSelect?: (id: string) => void;
  onCalculateMargin?: (id: string) => void;
  onAddToComparison?: (id: string) => void;
  comparisonList?: string[];
  onUpdateComparisonProducts?: (products: any[]) => void;
}

const translations = {
  en: {
    loading: 'Loading products...',
    loadingMore: 'Loading more products...',
    noResults: 'No products found',
    noResultsDescription: 'Try adjusting your search filters or search term',
    error: 'Failed to load products',
    errorDescription: 'Please try again later',
    resultsCount: (count: number) => `${count} products found`,
  },
  bn: {
    loading: 'পণ্য লোড হচ্ছে...',
    loadingMore: 'আরও পণ্য লোড হচ্ছে...',
    noResults: 'কোনো পণ্য পাওয়া যায়নি',
    noResultsDescription: 'আপনার অনুসন্ধান ফিল্টার বা শব্দ সামঞ্জস্য করার চেষ্টা করুন',
    error: 'পণ্য লোড করতে ব্যর্থ',
    errorDescription: 'পরে আবার চেষ্টা করুন',
    resultsCount: (count: number) => `${count} পণ্য পাওয়া গেছে`,
  },
};

export const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  query,
  platforms,
  priceRange,
  qualityTier,
  shippingTime,
  sortBy,
  viewMode,
  locale,
  onProductSelect,
  onCalculateMargin,
  onAddToComparison,
  comparisonList = [],
  onUpdateComparisonProducts,
}) => {
  const t = translations[locale];
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    products,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProductSearch({
    query,
    platforms: platforms.length > 0 ? platforms : undefined,
    priceRange,
    qualityTier: qualityTier.length > 0 ? qualityTier : undefined,
    shippingTime: shippingTime || undefined,
    sortBy,
    pageSize: 20,
    debounceMs: 300,
    enabled: query.length > 0,
  });

  // Infinite scroll implementation using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update comparison products when products or comparisonList changes
  useEffect(() => {
    if (onUpdateComparisonProducts && comparisonList.length > 0) {
      const selectedProducts = products.filter((p) => comparisonList.includes(p.id));
      onUpdateComparisonProducts(selectedProducts);
    }
  }, [products, comparisonList, onUpdateComparisonProducts]);

  // Show loading skeletons on initial load
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">{t.loading}</div>
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {[...Array(8)].map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <EmptyState
        title={t.error}
        description={t.errorDescription}
        icon="error"
      />
    );
  }

  // Show empty state when no results
  if (products.length === 0 && query.length > 0) {
    return (
      <EmptyState
        title={t.noResults}
        description={t.noResultsDescription}
        icon="search"
      />
    );
  }

  // Show results
  return (
    <div className="space-y-6">
      {/* Results count */}
      {products.length > 0 && (
        <div className="text-sm text-gray-600">
          {t.resultsCount(products.length)}
        </div>
      )}

      {/* Product grid/list */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {products.map((product) => (
          <MarketplaceCard
            key={product.id}
            product={{
              id: product.id,
              title: product.title,
              titleTranslated: product.titleTranslated,
              image: product.images[0] || '/placeholder-product.png',
              priceRange: product.priceRange,
              platform: product.platform,
              qualityTier: product.qualityTier,
              moq: product.moq,
              supplierRating: product.supplierInfo.rating,
              leadTime: product.leadTime,
            }}
            locale={locale}
            viewMode={viewMode}
            onSelect={onProductSelect}
            onCalculateMargin={onCalculateMargin}
            onAddToComparison={onAddToComparison}
            isInComparison={comparisonList.includes(product.id)}
          />
        ))}
      </div>

      {/* Infinite scroll trigger and loading indicator */}
      <div ref={observerTarget} className="py-8 flex justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
            <span>{t.loadingMore}</span>
          </div>
        )}
      </div>
    </div>
  );
};
