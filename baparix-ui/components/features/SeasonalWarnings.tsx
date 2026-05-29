'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface SeasonalWarning {
  period: string;
  impact: string;
}

export interface SeasonalWarningsProps {
  seasonalWarnings?: SeasonalWarning[];
  locale: 'bn' | 'en';
}

/**
 * Known seasonal delay periods affecting shipping to/from Bangladesh.
 * Requirements: 7.7
 */
export const SEASONAL_DELAY_PERIODS: SeasonalWarning[] = [
  {
    period: 'Eid ul-Fitr',
    impact: 'Expect 5-10 day delays due to reduced customs operations and courier services during Eid holidays.',
  },
  {
    period: 'Eid ul-Adha',
    impact: 'Expect 3-7 day delays due to reduced operations during Eid ul-Adha holidays.',
  },
  {
    period: 'Chinese New Year',
    impact: 'Expect 14-21 day delays for shipments from China. Factories and logistics shut down for 2-3 weeks.',
  },
  {
    period: 'Port Congestion (Chittagong)',
    impact: 'Chittagong port experiences periodic congestion causing 3-7 day delays for sea freight.',
  },
];

/**
 * Determines which seasonal warnings are currently active based on the current date.
 */
export function getActiveSeasonalWarnings(currentDate: Date = new Date()): SeasonalWarning[] {
  const month = currentDate.getMonth(); // 0-indexed
  const active: SeasonalWarning[] = [];

  // Chinese New Year: typically late January to mid-February (months 0-1)
  if (month === 0 || month === 1) {
    active.push(SEASONAL_DELAY_PERIODS[2]); // Chinese New Year
  }

  // Eid ul-Fitr: varies by lunar calendar, approximate check
  // Typically falls in months 3-4 (April-May) in recent years
  if (month === 3 || month === 4) {
    active.push(SEASONAL_DELAY_PERIODS[0]); // Eid ul-Fitr
  }

  // Eid ul-Adha: approximately 2 months after Eid ul-Fitr
  // Typically falls in months 5-6 (June-July) in recent years
  if (month === 5 || month === 6) {
    active.push(SEASONAL_DELAY_PERIODS[1]); // Eid ul-Adha
  }

  // Port congestion: monsoon season (June-September) and peak import season (Oct-Dec)
  if (month >= 5 && month <= 11) {
    active.push(SEASONAL_DELAY_PERIODS[3]); // Port Congestion
  }

  return active;
}

function getWarningIcon(period: string): string {
  if (period.toLowerCase().includes('eid')) return '🌙';
  if (period.toLowerCase().includes('chinese')) return '🧧';
  if (period.toLowerCase().includes('port') || period.toLowerCase().includes('congestion')) return '🚢';
  return '📅';
}

export function SeasonalWarnings({
  seasonalWarnings,
  locale,
}: SeasonalWarningsProps) {
  const t = useTranslations('shipping');

  // Use provided warnings or derive active ones from current date
  const warnings = seasonalWarnings ?? getActiveSeasonalWarnings();

  if (warnings.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span aria-hidden="true">📅</span>
        {t('seasonalWarnings.title')}
      </h3>

      <div className="space-y-3" role="list" aria-label={t('seasonalWarnings.ariaLabel')}>
        {warnings.map((warning, index) => (
          <div
            key={`${warning.period}-${index}`}
            className="flex items-start gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200"
            role="listitem"
          >
            <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
              {getWarningIcon(warning.period)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="warning" size="sm">
                  {warning.period}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{warning.impact}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {t('seasonalWarnings.disclaimer')}
      </p>
    </Card>
  );
}
