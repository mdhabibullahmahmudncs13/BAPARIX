'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from './Card';
import { PlatformBadge, QualityBadge } from './Badge';
import { Button } from './Button';

export interface MarketplaceCardProps {
  product: {
    id: string;
    title: string;
    titleTranslated?: string;
    image: string;
    priceRange: { min: number; max: number; currency: string };
    platform: 'alibaba' | 'pinduoduo' | 'xianyu' | 'skybuybd' | 'dhgate' | 'aliexpress';
    qualityTier: 'cheap' | 'medium' | 'high';
    moq: number;
    supplierRating: number;
    leadTime: string;
  };
  locale: 'bn' | 'en';
  viewMode?: 'grid' | 'list';
  onSelect?: (id: string) => void;
  onCalculateMargin?: (id: string) => void;
  onAddToComparison?: (id: string) => void;
  isInComparison?: boolean;
}

const translations = {
  en: {
    moq: 'MOQ',
    units: 'units',
    rating: 'Rating',
    leadTime: 'Lead Time',
    priceRange: 'Price Range',
    calculateMargin: 'Calculate Margin',
    addToComparison: 'Add to Comparison',
    removeFromComparison: 'Remove from Comparison',
    viewDetails: 'View Details',
  },
  bn: {
    moq: 'এমওকিউ',
    units: 'ইউনিট',
    rating: 'রেটিং',
    leadTime: 'লিড টাইম',
    priceRange: 'মূল্য পরিসীমা',
    calculateMargin: 'মার্জিন গণনা করুন',
    addToComparison: 'তুলনায় যোগ করুন',
    removeFromComparison: 'তুলনা থেকে সরান',
    viewDetails: 'বিস্তারিত দেখুন',
  },
};

const formatCurrency = (amount: number, currency: string, locale: 'bn' | 'en'): string => {
  const symbol = currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : '¥';
  
  // Format number with commas
  const formatted = amount.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formatted}`;
};

const formatNumber = (num: number, locale: 'bn' | 'en'): string => {
  return num.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US');
};

const StarRating: React.FC<{ rating: number; locale: 'bn' | 'en' }> = ({ rating, locale }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} ${translations[locale].rating}`}>
      {[...Array(fullStars)].map((_, i) => (
        <svg
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg
          className="w-4 h-4 text-yellow-400"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-star)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300 fill-current"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      <span className="text-sm text-gray-600 ml-1">{formatNumber(rating, locale)}</span>
    </div>
  );
};

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  product,
  locale,
  viewMode = 'grid',
  onSelect,
  onCalculateMargin,
  onAddToComparison,
  isInComparison = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const t = translations[locale];

  const displayTitle = product.titleTranslated || product.title;
  const priceRangeText = `${formatCurrency(product.priceRange.min, product.priceRange.currency, locale)} - ${formatCurrency(product.priceRange.max, product.priceRange.currency, locale)}`;

  const handleCardClick = () => {
    onSelect?.(product.id);
  };

  const handleCalculateMargin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCalculateMargin?.(product.id);
  };

  const handleToggleComparison = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToComparison?.(product.id);
  };

  if (viewMode === 'list') {
    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        padding="none"
        onClick={handleCardClick}
      >
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Image Section */}
          <div className="relative w-full sm:w-48 h-48 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            {!imageError ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                )}
                <Image
                  src={product.image}
                  alt={displayTitle}
                  fill
                  sizes="(max-width: 640px) 100vw, 192px"
                  className={`object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {/* Header with badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <PlatformBadge platform={product.platform} />
                <QualityBadge tier={product.qualityTier} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {displayTitle}
              </h3>

              {/* Price Range */}
              <div className="mb-3">
                <span className="text-sm text-gray-600">{t.priceRange}: </span>
                <span className="text-lg font-bold text-primary-600">
                  {priceRangeText}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <span className="text-xs text-gray-500 block">{t.moq}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(product.moq, locale)} {t.units}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">{t.rating}</span>
                  <StarRating rating={product.supplierRating} locale={locale} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">{t.leadTime}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {product.leadTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCalculateMargin}
                className="flex-1 sm:flex-none"
              >
                {t.calculateMargin}
              </Button>
              <Button
                variant={isInComparison ? 'secondary' : 'ghost'}
                size="sm"
                onClick={handleToggleComparison}
                className="flex-1 sm:flex-none"
              >
                {isInComparison ? t.removeFromComparison : t.addToComparison}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid View
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
      padding="none"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <Image
              src={product.image}
              alt={displayTitle}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <PlatformBadge platform={product.platform} />
          <QualityBadge tier={product.qualityTier} />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {displayTitle}
        </h3>

        {/* Price Range */}
        <div className="mb-3">
          <span className="text-xs text-gray-600 block mb-1">{t.priceRange}</span>
          <span className="text-lg font-bold text-primary-600">
            {priceRangeText}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{t.moq}:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatNumber(product.moq, locale)} {t.units}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{t.rating}:</span>
            <StarRating rating={product.supplierRating} locale={locale} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{t.leadTime}:</span>
            <span className="text-sm font-medium text-gray-900">
              {product.leadTime}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCalculateMargin}
            className="w-full"
          >
            {t.calculateMargin}
          </Button>
          <Button
            variant={isInComparison ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleToggleComparison}
            className="w-full"
          >
            {isInComparison ? t.removeFromComparison : t.addToComparison}
          </Button>
        </div>
      </div>
    </Card>
  );
};
