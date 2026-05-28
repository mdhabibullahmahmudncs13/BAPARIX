import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Noto_Sans_Bengali, Inter } from 'next/font/google';
import { locales, Locale } from '@/i18n';
import { Providers } from './providers';
import { SkipToContent } from '@/components/shared/SkipToContent';
import '../globals.css';

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-english',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'VentureOS - AI-Powered Business Intelligence',
  description: 'AI-powered business intelligence and product sourcing platform for Bangladeshi entrepreneurs',
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Fetch messages for the locale
  const messages = await getMessages();

  return (
    <html 
      lang={locale} 
      className={`${notoSansBengali.variable} ${inter.variable} ${locale === 'bn' ? 'font-bengali' : 'font-english'}`}
    >
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SkipToContent />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
