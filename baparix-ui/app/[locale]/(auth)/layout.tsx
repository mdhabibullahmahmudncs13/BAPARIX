import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

/**
 * Auth layout with minimal styling
 * Requirements: 11.1, 11.2, 11.7
 */

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth' });
  
  return {
    title: `${t('login')} - VentureOS`,
    description: t('getStarted'),
  };
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">
            VentureOS
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI-Powered Business Intelligence
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </main>
  );
}
