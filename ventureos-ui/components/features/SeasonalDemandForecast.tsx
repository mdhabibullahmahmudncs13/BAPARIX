'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  CalendarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

export type DemandLevel = 'high' | 'medium' | 'low';
export type SeasonalPeriod = 'eid' | 'winter' | 'school' | 'monsoon';

export interface SeasonalForecast {
  id: string;
  season: SeasonalPeriod;
  demandLevel: DemandLevel;
  confidenceScore: number; // 0-100
  timeframe: string;
  keyProducts: string[];
  demandIndicators: string[];
  peakMonths: string[];
}

interface SeasonalDemandForecastProps {
  forecasts?: SeasonalForecast[];
  compact?: boolean;
}

const defaultForecasts: SeasonalForecast[] = [
  {
    id: '1',
    season: 'eid',
    demandLevel: 'high',
    confidenceScore: 92,
    timeframe: 'Mar-Apr 2024',
    keyProducts: ['clothing', 'gifts', 'homeDecor', 'jewelry'],
    demandIndicators: ['searchVolume', 'socialMentions', 'historicalData'],
    peakMonths: ['March', 'April'],
  },
  {
    id: '2',
    season: 'winter',
    demandLevel: 'medium',
    confidenceScore: 85,
    timeframe: 'Dec 2024 - Jan 2025',
    keyProducts: ['jackets', 'sweaters', 'blankets', 'heaters'],
    demandIndicators: ['temperature', 'historicalSales', 'searchTrends'],
    peakMonths: ['December', 'January'],
  },
  {
    id: '3',
    season: 'school',
    demandLevel: 'high',
    confidenceScore: 88,
    timeframe: 'Jan 2025',
    keyProducts: ['uniforms', 'bags', 'stationery', 'shoes'],
    demandIndicators: ['academicCalendar', 'parentSearches', 'retailData'],
    peakMonths: ['January'],
  },
  {
    id: '4',
    season: 'monsoon',
    demandLevel: 'medium',
    confidenceScore: 78,
    timeframe: 'Jun-Sep 2024',
    keyProducts: ['raincoats', 'umbrellas', 'waterproofBags', 'boots'],
    demandIndicators: ['weatherForecast', 'seasonalPattern', 'searchData'],
    peakMonths: ['June', 'July', 'August', 'September'],
  },
];

export function SeasonalDemandForecast({
  forecasts = defaultForecasts,
  compact = false,
}: SeasonalDemandForecastProps) {
  const t = useTranslations('marketIntelligence.seasonalForecasts');

  // Return empty if no forecasts
  if (!forecasts || forecasts.length === 0) {
    return null;
  }

  const getDemandBadgeVariant = (level: DemandLevel) => {
    switch (level) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getDemandIcon = (level: DemandLevel) => {
    switch (level) {
      case 'high':
        return <ArrowTrendingUpIcon className="w-4 h-4" aria-hidden="true" />;
      case 'medium':
        return <MinusIcon className="w-4 h-4" aria-hidden="true" />;
      case 'low':
        return <ArrowTrendingDownIcon className="w-4 h-4" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const getSeasonColor = (season: SeasonalPeriod) => {
    switch (season) {
      case 'eid':
        return 'bg-purple-50 border-purple-200';
      case 'winter':
        return 'bg-blue-50 border-blue-200';
      case 'school':
        return 'bg-green-50 border-green-200';
      case 'monsoon':
        return 'bg-cyan-50 border-cyan-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {forecasts.map((forecast) => (
          <div
            key={forecast.id}
            className={`p-3 rounded-lg border ${getSeasonColor(forecast.season)}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" aria-hidden="true" />
                {t(`seasons.${forecast.season}.name`)}
              </h4>
              <Badge
                variant={getDemandBadgeVariant(forecast.demandLevel)}
                size="sm"
                className="flex items-center gap-1"
              >
                {getDemandIcon(forecast.demandLevel)}
                {t(`demandLevels.${forecast.demandLevel}`)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {t(`seasons.${forecast.season}.description`)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {forecasts.map((forecast) => (
        <Card
          key={forecast.id}
          className={`${getSeasonColor(forecast.season)} border-2 hover:shadow-md transition-shadow`}
          padding="md"
        >
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                  <CalendarIcon className="w-5 h-5" aria-hidden="true" />
                  {t(`seasons.${forecast.season}.name`)}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <span className="font-medium">{t('timeframe')}:</span>
                  {forecast.timeframe}
                </p>
              </div>
              <Badge
                variant={getDemandBadgeVariant(forecast.demandLevel)}
                className="flex items-center gap-1"
              >
                {getDemandIcon(forecast.demandLevel)}
                {t(`demandLevels.${forecast.demandLevel}`)}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3">
              {t(`seasons.${forecast.season}.description`)}
            </p>

            {/* Confidence Score */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 flex items-center gap-1">
                  <SparklesIcon className="w-4 h-4" aria-hidden="true" />
                  {t('confidenceScore')}
                </span>
                <span className="font-semibold text-gray-900">
                  {forecast.confidenceScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    forecast.confidenceScore >= 80
                      ? 'bg-green-500'
                      : forecast.confidenceScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${forecast.confidenceScore}%` }}
                  role="progressbar"
                  aria-valuenow={forecast.confidenceScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${t('confidenceScore')}: ${forecast.confidenceScore}%`}
                />
              </div>
            </div>

            {/* Key Products */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                {t('keyProducts')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {forecast.keyProducts.map((product, index) => (
                  <Badge key={index} variant="default" size="sm">
                    {t(`products.${product}`)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Peak Months */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                {t('peakMonths')}
              </h4>
              <p className="text-sm text-gray-600">
                {forecast.peakMonths.join(', ')}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
