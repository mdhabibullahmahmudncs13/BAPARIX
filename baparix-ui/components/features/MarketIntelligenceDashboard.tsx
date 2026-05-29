'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { TrendAlert } from '@/components/features/TrendAlert';
import { SeasonalDemandForecast } from '@/components/features/SeasonalDemandForecast';
import { ImportExportChart } from '@/components/features/ImportExportChart';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface FilterState {
  geography: string;
  category: string;
  timeRange: string;
}

export function MarketIntelligenceDashboard() {
  const t = useTranslations('marketIntelligence');
  const [filters, setFilters] = useState<FilterState>({
    geography: 'all',
    category: 'all',
    timeRange: '7d',
  });
  const [dismissedTrends, setDismissedTrends] = useState<string[]>([]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDismissTrend = (id: string) => {
    setDismissedTrends((prev) => [...prev, id]);
  };

  const handleLearnMore = (id: string) => {
    // Navigate to trend details or open modal
    console.log('Learn more about trend:', id);
  };

  // Mock data - will be replaced with real API data
  const allTrendAlerts = [
    {
      id: '1',
      productCategory: 'Electronics',
      trendName: 'Wireless Earbuds',
      trajectory: 'rising' as const,
      startDate: '2024-01-15',
      peakPeriod: 'Feb-Mar 2024',
      estimatedLifespan: '6 months',
      seasonal: false,
      isNew: true,
    },
    {
      id: '2',
      productCategory: 'Fashion',
      trendName: 'Winter Jackets',
      trajectory: 'stable' as const,
      startDate: '2023-12-01',
      peakPeriod: 'Dec-Jan',
      estimatedLifespan: '3 months',
      seasonal: true,
      seasonalFlag: 'Winter',
      isNew: false,
    },
    {
      id: '3',
      productCategory: 'Home & Lifestyle',
      trendName: 'Smart Home Devices',
      trajectory: 'rising' as const,
      startDate: '2024-01-20',
      peakPeriod: 'Feb-Apr 2024',
      estimatedLifespan: '8 months',
      seasonal: false,
      isNew: true,
    },
  ];

  // Filter out dismissed trends
  const trendAlerts = allTrendAlerts.filter(
    (trend) => !dismissedTrends.includes(trend.id)
  );

  // Count new trends
  const newTrendsCount = trendAlerts.filter((trend) => trend.isNew).length;

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select
                id="geography-filter"
                label={t('filters.geography')}
                value={filters.geography}
                onChange={(e) => handleFilterChange('geography', e.target.value)}
                options={[
                  { value: 'all', label: t('filters.allRegions') },
                  { value: 'dhaka', label: t('filters.dhaka') },
                  { value: 'chittagong', label: t('filters.chittagong') },
                  { value: 'sylhet', label: t('filters.sylhet') },
                  { value: 'rajshahi', label: t('filters.rajshahi') },
                  { value: 'khulna', label: t('filters.khulna') },
                ]}
              />
            </div>

            <div className="flex-1">
              <Select
                id="category-filter"
                label={t('filters.category')}
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                options={[
                  { value: 'all', label: t('filters.allCategories') },
                  { value: 'electronics', label: t('filters.electronics') },
                  { value: 'fashion', label: t('filters.fashion') },
                  { value: 'home', label: t('filters.home') },
                  { value: 'beauty', label: t('filters.beauty') },
                  { value: 'sports', label: t('filters.sports') },
                ]}
              />
            </div>

            <div className="flex-1">
              <Select
                id="timerange-filter"
                label={t('filters.timeRange')}
                value={filters.timeRange}
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                options={[
                  { value: '7d', label: t('filters.last7Days') },
                  { value: '30d', label: t('filters.last30Days') },
                  { value: '90d', label: t('filters.last90Days') },
                  { value: '1y', label: t('filters.lastYear') },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Alerts Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />
                {t('sections.trendAlerts')}
              </CardTitle>
              {newTrendsCount > 0 && (
                <Badge variant="info">
                  {newTrendsCount} {t('sections.newTrends')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trendAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No active trends at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trendAlerts.map((alert) => (
                  <TrendAlert
                    key={alert.id}
                    trend={alert}
                    onDismiss={handleDismissTrend}
                    onLearnMore={handleLearnMore}
                    dismissible={true}
                    showNotificationBadge={true}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seasonal Demand Forecasts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-600" aria-hidden="true" />
              {t('sections.seasonalDemand')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SeasonalDemandForecast />
          </CardContent>
        </Card>

        {/* Import/Export Data Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-green-600" aria-hidden="true" />
              {t('sections.importExportData')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImportExportChart />
          </CardContent>
        </Card>

        {/* Demand Heatmap Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-red-600" aria-hidden="true" />
              {t('sections.demandHeatmap')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">{t('placeholders.heatmapPlaceholder')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('placeholders.comingSoon')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Mapping Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-orange-600" aria-hidden="true" />
              {t('sections.competitorMapping')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-gray-600">{t('placeholders.competitorPlaceholder')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('placeholders.comingSoon')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
