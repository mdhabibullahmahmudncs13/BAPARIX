'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      // Remove current locale from pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      
      // Build new path with new locale
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      
      // Set cookie for locale persistence
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Navigate to new locale path
      router.push(newPath);
      router.refresh();
    });
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending || locale === 'en'}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${
            locale === 'en'
              ? 'bg-blue-600 text-white cursor-default'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
          }
          ${isPending ? 'opacity-50 cursor-wait' : ''}
          disabled:cursor-not-allowed
        `}
        aria-label="Switch to English"
        aria-pressed={locale === 'en'}
      >
        English
      </button>
      
      <button
        onClick={() => switchLocale('bn')}
        disabled={isPending || locale === 'bn'}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${
            locale === 'bn'
              ? 'bg-blue-600 text-white cursor-default'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
          }
          ${isPending ? 'opacity-50 cursor-wait' : ''}
          disabled:cursor-not-allowed
        `}
        aria-label="Switch to Bengali"
        aria-pressed={locale === 'bn'}
      >
        বাংলা
      </button>
    </div>
  );
}
