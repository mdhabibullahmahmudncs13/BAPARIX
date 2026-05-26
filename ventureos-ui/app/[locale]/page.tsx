import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary-600">
          {t('app.name')}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          {t('app.tagline')}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/en/dashboard"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('common.dashboard')} (English)
          </a>
          <a
            href="/bn/dashboard"
            className="px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
          >
            {t('common.dashboard')} (বাংলা)
          </a>
        </div>
      </div>
    </div>
  );
}
