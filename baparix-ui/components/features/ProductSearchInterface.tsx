'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ProductSearchResults } from './ProductSearchResults';
import { ProductComparison, Product } from './ProductComparison';
import { Modal } from '@/components/ui/Modal';

export interface ProductSearchInterfaceProps {
  locale: 'bn' | 'en';
  onSearch?: (filters: SearchFilters) => void;
  onProductSelect?: (id: string) => void;
  onCalculateMargin?: (id: string) => void;
}

export interface SearchFilters {
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
}

const PLATFORMS = [
  { id: 'alibaba', label: { en: 'Alibaba', bn: 'আলিবাবা' } },
  { id: 'pinduoduo', label: { en: 'Pinduoduo', bn: 'পিন্ডুওডুও' } },
  { id: 'xianyu', label: { en: 'Xianyu', bn: 'জিয়ানিউ' } },
  { id: 'skybuybd', label: { en: 'SkyBuyBD', bn: 'স্কাইবাইবিডি' } },
  { id: 'dhgate', label: { en: 'DHgate', bn: 'ডিএইচগেট' } },
  { id: 'aliexpress', label: { en: 'AliExpress', bn: 'আলিএক্সপ্রেস' } },
];

const QUALITY_TIERS = [
  { id: 'cheap', label: { en: 'Cheap', bn: 'সস্তা' } },
  { id: 'medium', label: { en: 'Medium', bn: 'মাঝারি' } },
  { id: 'high', label: { en: 'High', bn: 'উচ্চ' } },
];

const SHIPPING_TIME_OPTIONS = [
  { value: '', label: { en: 'Any', bn: 'যেকোনো' } },
  { value: '1-7', label: { en: '1-7 days', bn: '১-৭ দিন' } },
  { value: '8-15', label: { en: '8-15 days', bn: '৮-১৫ দিন' } },
  { value: '16-30', label: { en: '16-30 days', bn: '১৬-৩০ দিন' } },
  { value: '30+', label: { en: '30+ days', bn: '৩০+ দিন' } },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: { en: 'Relevance', bn: 'প্রাসঙ্গিকতা' } },
  { value: 'price-asc', label: { en: 'Price: Low to High', bn: 'মূল্য: কম থেকে বেশি' } },
  { value: 'price-desc', label: { en: 'Price: High to Low', bn: 'মূল্য: বেশি থেকে কম' } },
  { value: 'rating', label: { en: 'Rating', bn: 'রেটিং' } },
  { value: 'moq', label: { en: 'MOQ', bn: 'এমওকিউ' } },
];

export const ProductSearchInterface: React.FC<ProductSearchInterfaceProps> = ({
  locale,
  onSearch,
  onProductSelect,
  onCalculateMargin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [selectedQualityTiers, setSelectedQualityTiers] = useState<string[]>([]);
  const [shippingTime, setShippingTime] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);

  const translations = {
    en: {
      searchPlaceholder: 'Search for products...',
      filters: 'Filters',
      hideFilters: 'Hide Filters',
      showFilters: 'Show Filters',
      platforms: 'Platforms',
      priceRange: 'Price Range (BDT)',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      qualityTier: 'Quality Tier',
      shippingTime: 'Shipping Time',
      sortBy: 'Sort By',
      viewMode: 'View',
      gridView: 'Grid',
      listView: 'List',
      search: 'Search',
      clearFilters: 'Clear Filters',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      compareProducts: 'Compare Products',
      comparisonCount: (count: number) => `Compare (${count})`,
    },
    bn: {
      searchPlaceholder: 'পণ্য অনুসন্ধান করুন...',
      filters: 'ফিল্টার',
      hideFilters: 'ফিল্টার লুকান',
      showFilters: 'ফিল্টার দেখান',
      platforms: 'প্ল্যাটফর্ম',
      priceRange: 'মূল্য পরিসীমা (টাকা)',
      minPrice: 'সর্বনিম্ন মূল্য',
      maxPrice: 'সর্বোচ্চ মূল্য',
      qualityTier: 'গুণমানের স্তর',
      shippingTime: 'শিপিং সময়',
      sortBy: 'সাজান',
      viewMode: 'দেখুন',
      gridView: 'গ্রিড',
      listView: 'তালিকা',
      search: 'অনুসন্ধান',
      clearFilters: 'ফিল্টার সাফ করুন',
      selectAll: 'সব নির্বাচন করুন',
      deselectAll: 'সব বাতিল করুন',
      compareProducts: 'পণ্য তুলনা করুন',
      comparisonCount: (count: number) => `তুলনা (${count})`,
    },
  };

  const t = translations[locale];

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleQualityTierToggle = (tierId: string) => {
    setSelectedQualityTiers((prev) =>
      prev.includes(tierId)
        ? prev.filter((id) => id !== tierId)
        : [...prev, tierId]
    );
  };

  const handleSelectAllPlatforms = () => {
    if (selectedPlatforms.length === PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(PLATFORMS.map((p) => p.id));
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedPlatforms([]);
    setPriceMin(0);
    setPriceMax(100000);
    setSelectedQualityTiers([]);
    setShippingTime('');
    setSortBy('relevance');
  };

  const handleSearch = () => {
    const filters: SearchFilters = {
      query: searchQuery,
      platforms: selectedPlatforms,
      priceRange: {
        min: priceMin,
        max: priceMax,
      },
      qualityTier: selectedQualityTiers,
      shippingTime,
      sortBy,
      viewMode,
    };
    setHasSearched(true);
    onSearch?.(filters);
  };

  const handleAddToComparison = (id: string) => {
    setComparisonList((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      // Limit to 5 items for comparison
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveFromComparison = (id: string) => {
    setComparisonList((prev) => prev.filter((item) => item !== id));
    setComparisonProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const handleShowComparison = () => {
    // This will be populated by the ProductSearchResults component
    // For now, we just show the modal
    setShowComparison(true);
  };

  const handleUpdateComparisonProducts = (products: Product[]) => {
    setComparisonProducts(products);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Bar and Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleSearch}
            className="whitespace-nowrap"
          >
            {t.search}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className="whitespace-nowrap md:hidden"
          >
            {showFilters ? t.hideFilters : t.showFilters}
          </Button>
        </div>
      </div>

      {/* Toolbar: Sort and View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select
            options={SORT_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label[locale],
            }))}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-48"
            aria-label={t.sortBy}
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Comparison Button */}
          {comparisonList.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleShowComparison}
              className="whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {t.comparisonCount(comparisonList.length)}
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">
            {t.viewMode}:
          </span>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            aria-label={t.gridView}
            aria-pressed={viewMode === 'grid'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            aria-label={t.listView}
            aria-pressed={viewMode === 'list'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div
        className={`${
          showFilters ? 'block' : 'hidden'
        } md:block bg-white border border-gray-200 rounded-lg p-6 space-y-6`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t.filters}</h3>
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            {t.clearFilters}
          </Button>
        </div>

        {/* Platform Filters */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              {t.platforms}
            </label>
            <button
              onClick={handleSelectAllPlatforms}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {selectedPlatforms.length === PLATFORMS.length
                ? t.deselectAll
                : t.selectAll}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <Checkbox
                key={platform.id}
                label={platform.label[locale]}
                checked={selectedPlatforms.includes(platform.id)}
                onChange={() => handlePlatformToggle(platform.id)}
              />
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t.priceRange}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label={t.minPrice}
              value={priceMin}
              onChange={(e) => setPriceMin(Number(e.target.value))}
              min={0}
            />
            <Input
              type="number"
              label={t.maxPrice}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              min={0}
            />
          </div>
          {/* Price Range Slider */}
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={100000}
              step={1000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              aria-label={t.maxPrice}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>৳0</span>
              <span>৳100,000</span>
            </div>
          </div>
        </div>

        {/* Quality Tier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t.qualityTier}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {QUALITY_TIERS.map((tier) => (
              <Checkbox
                key={tier.id}
                label={tier.label[locale]}
                checked={selectedQualityTiers.includes(tier.id)}
                onChange={() => handleQualityTierToggle(tier.id)}
              />
            ))}
          </div>
        </div>

        {/* Shipping Time */}
        <div>
          <Select
            label={t.shippingTime}
            options={SHIPPING_TIME_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label[locale],
            }))}
            value={shippingTime}
            onChange={(e) => setShippingTime(e.target.value)}
          />
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && searchQuery && (
        <ProductSearchResults
          query={searchQuery}
          platforms={selectedPlatforms}
          priceRange={{ min: priceMin, max: priceMax }}
          qualityTier={selectedQualityTiers}
          shippingTime={shippingTime}
          sortBy={sortBy}
          viewMode={viewMode}
          locale={locale}
          onProductSelect={onProductSelect}
          onCalculateMargin={onCalculateMargin}
          onAddToComparison={handleAddToComparison}
          comparisonList={comparisonList}
          onUpdateComparisonProducts={handleUpdateComparisonProducts}
        />
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <Modal
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          title={locale === 'en' ? 'Product Comparison' : 'পণ্য তুলনা'}
          size="xl"
        >
          <ProductComparison
            products={comparisonProducts}
            locale={locale}
            onRemoveProduct={handleRemoveFromComparison}
            onClose={() => setShowComparison(false)}
          />
        </Modal>
      )}
    </div>
  );
};
