'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface GlobalSearchProps {
  /** Callback when search query changes (debounced) */
  onSearch?: (query: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

/**
 * Hook to debounce a value by a given delay.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * GlobalSearch component providing a search bar accessible from all pages
 * with Cmd+K / Ctrl+K keyboard shortcut to open a search modal overlay.
 *
 * Requirements: 20.1, 20.6
 */
export function GlobalSearch({ onSearch, debounceMs = 300 }: GlobalSearchProps) {
  const t = useTranslations('search');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, debounceMs);

  // Notify parent of debounced query changes
  useEffect(() => {
    if (onSearch && debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  // Open the search modal
  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close the search modal and reset query
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeSearch();
    }
  };

  // Detect platform for keyboard shortcut hint
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toUpperCase().includes('MAC');
  const shortcutHint = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <>
      {/* Search trigger button */}
      <button
        type="button"
        onClick={openSearch}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors w-full max-w-md"
        aria-label={t('openSearch')}
      >
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        <span className="flex-1 text-left">{t('placeholder')}</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded">
          {shortcutHint}
        </kbd>
      </button>

      {/* Search modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label={t('searchModal')}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={modalRef}
            className="w-full max-w-xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search input area */}
            <div className="flex items-center px-4 border-b border-gray-200" role="search">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('placeholder')}
                className="flex-1 px-3 py-4 text-base text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0"
                aria-label={t('searchInput')}
              />
              <button
                type="button"
                onClick={closeSearch}
                className="p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('closeSearch')}
              >
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Search results area */}
            <div className="px-4 py-3 max-h-80 overflow-y-auto">
              {!query && (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t('hint')}
                </p>
              )}
              {query && !debouncedQuery && (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t('searching')}
                </p>
              )}
              {debouncedQuery && (
                <p className="text-sm text-gray-500 text-center py-8">
                  {t('noResults')}
                </p>
              )}
            </div>

            {/* Footer with shortcut hints */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <span>{t('escToClose')}</span>
              <span>{t('enterToSearch')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
