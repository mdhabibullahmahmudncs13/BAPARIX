'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

/** Category types for search results */
export type SearchResultCategory = 'products' | 'blueprints' | 'help';

/** Individual search result item */
export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  category: SearchResultCategory;
  href: string;
}

/** Props for the SearchResults component */
export interface SearchResultsProps {
  /** Array of search results to display */
  results?: SearchResultItem[];
  /** Whether results are currently loading */
  isLoading?: boolean;
  /** The search query that produced these results */
  query?: string;
  /** Callback when a result is selected */
  onSelect?: (result: SearchResultItem) => void;
}

/** Category badge colors */
const categoryColors: Record<SearchResultCategory, string> = {
  products: 'bg-blue-100 text-blue-800',
  blueprints: 'bg-purple-100 text-purple-800',
  help: 'bg-green-100 text-green-800',
};

/** Category display order */
const categoryOrder: SearchResultCategory[] = ['products', 'blueprints', 'help'];

/**
 * SearchResults component displays search results grouped by category
 * with keyboard navigation, loading state, and empty state.
 *
 * Requirements: 20.2
 */
export function SearchResults({
  results = [],
  isLoading = false,
  query = '',
  onSelect,
}: SearchResultsProps) {
  const t = useTranslations('searchResults');
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Group results by category
  const groupedResults = categoryOrder.reduce<
    Record<SearchResultCategory, SearchResultItem[]>
  >(
    (acc, category) => {
      acc[category] = results.filter((r) => r.category === category);
      return acc;
    },
    { products: [], blueprints: [], help: [] }
  );

  // Flat list of all results for keyboard navigation
  const flatResults = categoryOrder.flatMap(
    (category) => groupedResults[category]
  );

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView?.({
        block: 'nearest',
      });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (flatResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && flatResults[activeIndex]) {
            onSelect?.(flatResults[activeIndex]);
          }
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(flatResults.length - 1);
          break;
      }
    },
    [flatResults, activeIndex, onSelect]
  );

  // Loading skeleton state
  if (isLoading) {
    return (
      <div
        role="listbox"
        aria-label={t('loadingResults')}
        aria-busy="true"
        className="py-2"
        data-testid="search-results-loading"
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-3 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-64 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state when query exists but no results
  if (query && results.length === 0) {
    return (
      <div
        role="listbox"
        aria-label={t('noResultsLabel')}
        className="py-8 text-center"
        data-testid="search-results-empty"
      >
        <p className="text-sm text-gray-500">{t('noResults')}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t('tryDifferentQuery')}
        </p>
      </div>
    );
  }

  // No query state - don't render anything
  if (!query || results.length === 0) {
    return null;
  }

  let flatIndex = 0;

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={t('searchResultsLabel')}
      aria-activedescendant={
        activeIndex >= 0 ? `search-result-${flatResults[activeIndex]?.id}` : undefined
      }
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="py-2 max-h-80 overflow-y-auto focus:outline-none"
      data-testid="search-results"
    >
      {categoryOrder.map((category) => {
        const categoryResults = groupedResults[category];
        if (categoryResults.length === 0) return null;

        return (
          <div key={category} className="mb-2">
            {/* Category header */}
            <div className="px-4 py-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t(`categories.${category}`)}
              </span>
              <span className="text-xs text-gray-500" aria-label={t('resultCount', { count: categoryResults.length })}>
                {categoryResults.length}
              </span>
            </div>

            {/* Category results */}
            {categoryResults.map((result) => {
              const currentFlatIndex = flatIndex++;
              const isActive = currentFlatIndex === activeIndex;

              return (
                <a
                  key={result.id}
                  id={`search-result-${result.id}`}
                  ref={(el) => {
                    itemRefs.current[currentFlatIndex] = el;
                  }}
                  href={result.href}
                  role="option"
                  aria-selected={isActive}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelect?.(result);
                  }}
                  className={`block px-4 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-50 border-l-2 border-blue-500'
                      : 'hover:bg-gray-50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${categoryColors[result.category]}`}
                    >
                      {t(`categories.${result.category}`)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate pl-0">
                    {result.description}
                  </p>
                </a>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
