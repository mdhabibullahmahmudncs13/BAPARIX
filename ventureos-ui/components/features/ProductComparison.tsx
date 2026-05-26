'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlatformBadge, QualityBadge } from '@/components/ui/Badge';

export interface Product {
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
  supplierInfo?: {
    name: string;
    yearsActive: number;
    responseRate: number;
  };
  shippingOptions?: string[];
}

export interface ProductComparisonProps {
  products: Product[];
  locale: 'bn' | 'en';
  onRemoveProduct: (id: string) => void;
  onClose?: () => void;
}

const translations = {
  en: {
    title: 'Product Comparison',
    subtitle: 'Compare up to 5 products side by side',
    image: 'Image',
    productName: 'Product Name',
    platform: 'Platform',
    priceRange: 'Price Range',
    quality: 'Quality Tier',
    moq: 'MOQ',
    supplierRating: 'Supplier Rating',
    leadTime: 'Lead Time',
    supplier: 'Supplier',
    yearsActive: 'Years Active',
    responseRate: 'Response Rate',
    shippingOptions: 'Shipping Options',
    remove: 'Remove',
    close: 'Close',
    exportData: 'Export Comparison',
    noProducts: 'No products selected for comparison',
    selectProducts: 'Select up to 5 products to compare',
    units: 'units',
    years: 'years',
    exportSuccess: 'Comparison data exported successfully',
    exportError: 'Failed to export comparison data',
  },
  bn: {
    title: 'পণ্য তুলনা',
    subtitle: 'পাশাপাশি ৫টি পর্যন্ত পণ্য তুলনা করুন',
    image: 'ছবি',
    productName: 'পণ্যের নাম',
    platform: 'প্ল্যাটফর্ম',
    priceRange: 'মূল্য পরিসীমা',
    quality: 'গুণমানের স্তর',
    moq: 'এমওকিউ',
    supplierRating: 'সরবরাহকারী রেটিং',
    leadTime: 'লিড টাইম',
    supplier: 'সরবরাহকারী',
    yearsActive: 'সক্রিয় বছর',
    responseRate: 'প্রতিক্রিয়া হার',
    shippingOptions: 'শিপিং বিকল্প',
    remove: 'সরান',
    close: 'বন্ধ করুন',
    exportData: 'তুলনা রপ্তানি করুন',
    noProducts: 'তুলনার জন্য কোনো পণ্য নির্বাচিত নেই',
    selectProducts: 'তুলনা করতে ৫টি পর্যন্ত পণ্য নির্বাচন করুন',
    units: 'ইউনিট',
    years: 'বছর',
    exportSuccess: 'তুলনা ডেটা সফলভাবে রপ্তানি করা হয়েছে',
    exportError: 'তুলনা ডেটা রপ্তানি করতে ব্যর্থ',
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

const StarRating: React.FC<{ rating: number; locale: 'bn' | 'en' }> = ({ rating, locale }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} rating`}>
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
            <linearGradient id="half-star-comparison">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path
            fill="url(#half-star-comparison)"
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

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  products,
  locale,
  onRemoveProduct,
  onClose,
}) => {
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const t = translations[locale];

  const handleExport = () => {
    try {
      // Prepare comparison data for export
      const comparisonData = {
        exportDate: new Date().toISOString(),
        products: products.map((product) => ({
          id: product.id,
          title: product.titleTranslated || product.title,
          platform: product.platform,
          priceRange: {
            min: product.priceRange.min,
            max: product.priceRange.max,
            currency: product.priceRange.currency,
          },
          qualityTier: product.qualityTier,
          moq: product.moq,
          supplierRating: product.supplierRating,
          leadTime: product.leadTime,
          supplierInfo: product.supplierInfo,
          shippingOptions: product.shippingOptions,
        })),
      };

      // Convert to JSON and create download
      const jsonString = JSON.stringify(comparisonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-comparison-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  if (products.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">{t.noProducts}</h3>
          <p className="mt-1 text-sm text-gray-500">{t.selectProducts}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t.subtitle} ({products.length}/5)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={products.length === 0}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {t.exportData}
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              {t.close}
            </Button>
          )}
        </div>
      </div>

      {/* Export Status Message */}
      {exportStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {t.exportSuccess}
        </div>
      )}
      {exportStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {t.exportError}
        </div>
      )}

      {/* Comparison Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <Card padding="none">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-48">
                  {/* Empty header for row labels */}
                </th>
                {products.map((product) => (
                  <th
                    key={product.id}
                    className="px-4 py-3 text-center border-l border-gray-200 min-w-[200px]"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="ml-1">{t.remove}</span>
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Image Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.image}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-center border-l border-gray-200"
                  >
                    <div className="relative w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.titleTranslated || product.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Product Name Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.productName}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-sm text-gray-900 border-l border-gray-200"
                  >
                    <div className="line-clamp-3">
                      {product.titleTranslated || product.title}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Platform Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.platform}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-center border-l border-gray-200"
                  >
                    <div className="flex justify-center">
                      <PlatformBadge platform={product.platform} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Price Range Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.priceRange}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-sm font-semibold text-primary-600 text-center border-l border-gray-200"
                  >
                    {formatCurrency(product.priceRange.min, product.priceRange.currency, locale)} -{' '}
                    {formatCurrency(product.priceRange.max, product.priceRange.currency, locale)}
                  </td>
                ))}
              </tr>

              {/* Quality Tier Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.quality}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-center border-l border-gray-200"
                  >
                    <div className="flex justify-center">
                      <QualityBadge tier={product.qualityTier} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* MOQ Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.moq}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-sm text-gray-900 text-center border-l border-gray-200"
                  >
                    {formatNumber(product.moq, locale)} {t.units}
                  </td>
                ))}
              </tr>

              {/* Supplier Rating Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.supplierRating}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-center border-l border-gray-200"
                  >
                    <div className="flex justify-center">
                      <StarRating rating={product.supplierRating} locale={locale} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Lead Time Row */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                  {t.leadTime}
                </td>
                {products.map((product) => (
                  <td
                    key={product.id}
                    className="px-4 py-3 text-sm text-gray-900 text-center border-l border-gray-200"
                  >
                    {product.leadTime}
                  </td>
                ))}
              </tr>

              {/* Supplier Info Row (if available) */}
              {products.some((p) => p.supplierInfo) && (
                <>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                      {t.supplier}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="px-4 py-3 text-sm text-gray-900 text-center border-l border-gray-200"
                      >
                        {product.supplierInfo?.name || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                      {t.yearsActive}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="px-4 py-3 text-sm text-gray-900 text-center border-l border-gray-200"
                      >
                        {product.supplierInfo
                          ? `${formatNumber(product.supplierInfo.yearsActive, locale)} ${t.years}`
                          : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                      {t.responseRate}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="px-4 py-3 text-sm text-gray-900 text-center border-l border-gray-200"
                      >
                        {product.supplierInfo
                          ? `${formatNumber(product.supplierInfo.responseRate, locale)}%`
                          : '-'}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Shipping Options Row (if available) */}
              {products.some((p) => p.shippingOptions && p.shippingOptions.length > 0) && (
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                    {t.shippingOptions}
                  </td>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="px-4 py-3 text-sm text-gray-900 border-l border-gray-200"
                    >
                      {product.shippingOptions && product.shippingOptions.length > 0 ? (
                        <ul className="list-disc list-inside text-left">
                          {product.shippingOptions.map((option, idx) => (
                            <li key={idx}>{option}</li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center">-</div>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Comparison Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {products.map((product) => (
          <Card key={product.id} padding="md">
            <div className="space-y-4">
              {/* Header with Remove Button */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <PlatformBadge platform={product.platform} />
                    <QualityBadge tier={product.qualityTier} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {product.titleTranslated || product.title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveProduct(product.id)}
                  className="text-red-600 hover:text-red-700"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>

              {/* Image */}
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.titleTranslated || product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{t.priceRange}:</span>
                  <span className="text-sm font-semibold text-primary-600">
                    {formatCurrency(product.priceRange.min, product.priceRange.currency, locale)} -{' '}
                    {formatCurrency(product.priceRange.max, product.priceRange.currency, locale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{t.moq}:</span>
                  <span className="text-sm text-gray-900">
                    {formatNumber(product.moq, locale)} {t.units}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{t.supplierRating}:</span>
                  <StarRating rating={product.supplierRating} locale={locale} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{t.leadTime}:</span>
                  <span className="text-sm text-gray-900">{product.leadTime}</span>
                </div>
                {product.supplierInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">{t.supplier}:</span>
                      <span className="text-sm text-gray-900">{product.supplierInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">{t.yearsActive}:</span>
                      <span className="text-sm text-gray-900">
                        {formatNumber(product.supplierInfo.yearsActive, locale)} {t.years}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">{t.responseRate}:</span>
                      <span className="text-sm text-gray-900">
                        {formatNumber(product.supplierInfo.responseRate, locale)}%
                      </span>
                    </div>
                  </>
                )}
                {product.shippingOptions && product.shippingOptions.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">
                      {t.shippingOptions}:
                    </span>
                    <ul className="list-disc list-inside text-sm text-gray-900">
                      {product.shippingOptions.map((option, idx) => (
                        <li key={idx}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
