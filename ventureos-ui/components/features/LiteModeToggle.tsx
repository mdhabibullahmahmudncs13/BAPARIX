'use client';

import { useTranslations } from 'next-intl';
import { useLiteModeStore } from '@/lib/stores/liteModeStore';

export interface LiteModeToggleProps {
  className?: string;
}

export function LiteModeToggle({ className = '' }: LiteModeToggleProps) {
  const t = useTranslations('settings.liteMode');
  const { isLiteMode, toggleLiteMode } = useLiteModeStore();

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex-1">
        <label
          htmlFor="lite-mode-toggle"
          className="text-sm font-medium text-gray-900"
        >
          {t('label')}
        </label>
        <p className="text-sm text-gray-500 mt-1">
          {t('description')}
        </p>
      </div>
      <button
        id="lite-mode-toggle"
        type="button"
        role="switch"
        aria-checked={isLiteMode}
        aria-label={t('label')}
        onClick={toggleLiteMode}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-blue-600
          ${isLiteMode ? 'bg-blue-600' : 'bg-gray-200'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white
            shadow ring-0 transition duration-200 ease-in-out
            ${isLiteMode ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}
