import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-primary-600">
          {t('navigation.dashboard')}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{t('navigation.products')}</h2>
            <p className="text-gray-600">Search and compare products across platforms</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{t('navigation.marketIntelligence')}</h2>
            <p className="text-gray-600">View market trends and insights</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{t('navigation.blueprint')}</h2>
            <p className="text-gray-600">Access your business blueprint</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{t('navigation.shipping')}</h2>
            <p className="text-gray-600">Calculate shipping costs</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{t('navigation.financial')}</h2>
            <p className="text-gray-600">Track revenue and expenses</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">{t('navigation.seo')}</h2>
            <p className="text-gray-600">SEO and content strategy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
