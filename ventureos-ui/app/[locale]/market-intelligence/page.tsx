import { useTranslations } from 'next-intl';
import { MarketIntelligenceDashboard } from '@/components/features/MarketIntelligenceDashboard';

export default function MarketIntelligencePage() {
  const t = useTranslations('marketIntelligence');

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>
        
        <MarketIntelligenceDashboard />
      </div>
    </div>
  );
}
