'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { PlatformBadge, QualityBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import Image from 'next/image';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
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
  };
  locale: 'bn' | 'en';
  onCalculateMargin?: (id: string) => void;
  onAddToComparison?: (id: string) => void;
}

const translations = {
  en: {
    productDetails: 'Product Details',
    description: 'Description',
    supplierInformation: 'Supplier Information',
    supplierName: 'Supplier Name',
    rating: 'Rating',
    yearsActive: 'Years Active',
    responseRate: 'Response Rate',
    reliabilityScore: 'Reliability Score',
    years: 'years',
    priceHistory: 'Price History',
    noPriceHistory: 'No price history available',
    priceRange: 'Price Range',
    moq: 'Minimum Order Quantity',
    units: 'units',
    leadTime: 'Lead Time',
    shippingOptions: 'Shipping Options',
    category: 'Category',
    tags: 'Tags',
    calculateMargin: 'Calculate Margin',
    addToComparison: 'Add to Comparison',
    close: 'Close',
    price: 'Price',
    date: 'Date',
  },
  bn: {
    productDetails: 'পণ্যের বিবরণ',
    description: 'বর্ণনা',
    supplierInformation: 'সরবরাহকারীর তথ্য',
    supplierName: 'সরবরাহকারীর নাম',
    rating: 'রেটিং',
    yearsActive: 'সক্রিয় বছর',
    responseRate: 'প্রতিক্রিয়া হার',
    reliabilityScore: 'নির্ভরযোগ্যতা স্কোর',
    years: 'বছর',
    priceHistory: 'মূল্য ইতিহাস',
    noPriceHistory: 'কোন মূল্য ইতিহাস উপলব্ধ নেই',
    priceRange: 'মূল্য পরিসীমা',
    moq: 'ন্যূনতম অর্ডার পরিমাণ',
    units: 'ইউনিট',
    leadTime: 'লিড টাইম',
    shippingOptions: 'শিপিং বিকল্প',
    category: 'বিভাগ',
    tags: 'ট্যাগ',
    calculateMargin: 'মার্জিন গণনা করুন',
    addToComparison: 'তুলনায় যোগ করুন',
    close: 'বন্ধ করুন',
    price: 'মূল্য',
    date: 'তারিখ',
  },
};

const formatCurrency = (amount: number, currency: string, locale: 'bn' | 'en'): string => {
  const symbol = currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : '¥';
  
  const formatted = amount.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formatted}`;
};

const formatNumber = (num: number, locale: 'bn' | 'en'): string => {
  return num.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US');
};

const formatDate = (date: Date, locale: 'bn' | 'en'): string => {
  return date.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ReliabilityScoreIndicator: React.FC<{ score: number; locale: 'bn' | 'en' }> = ({
  score,
  locale,
}) => {
  const percentage = score * 100;
  const color =
    score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {translations[locale].reliabilityScore}
        </span>
        <span className="text-sm font-bold text-gray-900">
          {formatNumber(percentage, locale)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
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
          className="w-5 h-5 text-yellow-400 fill-current"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg
          className="w-5 h-5 text-yellow-400"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="half-star-modal">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-star-modal)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg
          key={`empty-${i}`}
          className="w-5 h-5 text-gray-300 fill-current"
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

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  locale,
  onCalculateMargin,
  onAddToComparison,
}) => {
  const t = translations[locale];
  const displayTitle = product.titleTranslated || product.title;
  const displayDescription = product.descriptionTranslated || product.description;
  const priceRangeText = `${formatCurrency(product.priceRange.min, product.priceRange.currency, locale)} - ${formatCurrency(product.priceRange.max, product.priceRange.currency, locale)}`;

  // Prepare price history data for chart
  const priceHistoryData = product.priceHistory?.map((entry) => ({
    date: formatDate(entry.date, locale),
    price: entry.price,
    fullDate: entry.date,
  })) || [];

  const handleCalculateMargin = () => {
    onCalculateMargin?.(product.id);
  };

  const handleAddToComparison = () => {
    onAddToComparison?.(product.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.productDetails}
      size="xl"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Product Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={product.platform} />
            <QualityBadge tier={product.qualityTier} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{displayTitle}</h2>
          <div className="text-3xl font-bold text-primary-600">{priceRangeText}</div>
        </div>

        {/* Product Images */}
        {product.images && product.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {product.images.slice(0, 6).map((image, index) => (
              <div
                key={index}
                className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden"
              >
                <Image
                  src={image}
                  alt={`${displayTitle} - Image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm text-gray-600">{t.moq}:</span>
            <p className="text-base font-semibold text-gray-900">
              {formatNumber(product.moq, locale)} {t.units}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">{t.leadTime}:</span>
            <p className="text-base font-semibold text-gray-900">{product.leadTime}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">{t.category}:</span>
            <p className="text-base font-semibold text-gray-900">{product.category}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">{t.shippingOptions}:</span>
            <p className="text-base font-semibold text-gray-900">
              {product.shippingOptions.join(', ')}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.description}</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayDescription}
          </p>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.tags}</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Supplier Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t.supplierInformation}
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">{t.supplierName}:</span>
              <p className="text-base font-semibold text-gray-900">
                {product.supplierInfo.name}
              </p>
            </div>

            <div>
              <span className="text-sm text-gray-600 block mb-1">{t.rating}:</span>
              <StarRating rating={product.supplierInfo.rating} locale={locale} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">{t.yearsActive}:</span>
                <p className="text-base font-semibold text-gray-900">
                  {formatNumber(product.supplierInfo.yearsActive, locale)} {t.years}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t.responseRate}:</span>
                <p className="text-base font-semibold text-gray-900">
                  {formatNumber(product.supplierInfo.responseRate * 100, locale)}%
                </p>
              </div>
            </div>

            <ReliabilityScoreIndicator
              score={product.supplierInfo.reliabilityScore}
              locale={locale}
            />
          </div>
        </div>

        {/* Price History Chart */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.priceHistory}</h3>
          {priceHistoryData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={priceHistoryData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(value) =>
                      formatCurrency(value, product.priceRange.currency, locale)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                    }}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                    formatter={(value: number) => [
                      formatCurrency(value, product.priceRange.currency, locale),
                      t.price,
                    ]}
                    labelFormatter={(label) => `${t.date}: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
              <p className="text-gray-500">{t.noPriceHistory}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="primary"
            onClick={handleCalculateMargin}
            className="flex-1"
          >
            {t.calculateMargin}
          </Button>
          <Button
            variant="secondary"
            onClick={handleAddToComparison}
            className="flex-1"
          >
            {t.addToComparison}
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {t.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
