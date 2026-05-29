'use client';

import { useTranslations } from 'next-intl';

/**
 * SkipToContent - Accessibility component for keyboard navigation
 *
 * Renders a visually hidden link that becomes visible on focus,
 * allowing keyboard users to skip directly to the main content area.
 *
 * Requirements: 15.1 - Provide keyboard navigation for all interactive elements
 */
export function SkipToContent() {
  const t = useTranslations('accessibility');

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:text-sm focus:font-medium"
    >
      {t('skipToContent')}
    </a>
  );
}
