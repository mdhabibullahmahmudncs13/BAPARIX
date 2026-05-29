'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Product } from '@/components/features/ProductComparison';
import { exportComparisonDataToJson } from '@/lib/utils/jsonExport';

export interface ExportJSONButtonProps {
  products: Product[];
  userName: string;
  userEmail: string;
  fileName?: string;
}

export function ExportJSONButton({
  products,
  userName,
  userEmail,
  fileName,
}: ExportJSONButtonProps) {
  const t = useTranslations('export');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportComparisonDataToJson({
        products,
        userName,
        userEmail,
        fileName,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || products.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label={t('jsonButton')}
    >
      <ArrowDownTrayIcon className="w-5 h-5" aria-hidden="true" />
      {isExporting ? t('exporting') : t('jsonButton')}
    </button>
  );
}
