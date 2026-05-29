'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  TruckIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'ventureos_recent_pages';
const MAX_RECENT_PAGES = 8;

export interface RecentPage {
  /** URL path of the page */
  path: string;
  /** Translation key or display title for the page */
  title: string;
  /** Icon identifier for the page */
  icon?: string;
  /** Timestamp when the page was last accessed */
  visitedAt: number;
}

export interface RecentPagesProps {
  /** Maximum number of recent pages to display (default: 5) */
  maxItems?: number;
  /** Optional callback when a page link is clicked */
  onPageClick?: (page: RecentPage) => void;
}

/**
 * Maps an icon identifier string to the corresponding Heroicon component.
 */
function getIconComponent(icon?: string) {
  switch (icon) {
    case 'dashboard':
      return HomeIcon;
    case 'products':
      return CubeIcon;
    case 'market-intelligence':
      return ChartBarIcon;
    case 'blueprint':
      return DocumentTextIcon;
    case 'shipping':
      return TruckIcon;
    case 'financial':
      return CurrencyDollarIcon;
    case 'seo':
      return MegaphoneIcon;
    case 'team':
      return UserGroupIcon;
    case 'settings':
      return Cog6ToothIcon;
    case 'search':
      return MagnifyingGlassIcon;
    default:
      return DocumentTextIcon;
  }
}

/**
 * Formats a timestamp into a relative time string (e.g., "2 min ago").
 */
export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now()
): string {
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'justNow';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hr ago`;
  } else {
    return `${diffDays} day ago`;
  }
}

/**
 * Retrieves recent pages from localStorage.
 */
export function getRecentPages(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const pages: RecentPage[] = JSON.parse(stored);
    return pages
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, MAX_RECENT_PAGES);
  } catch {
    return [];
  }
}

/**
 * Adds a page visit to the recent pages list in localStorage.
 */
export function addRecentPage(page: Omit<RecentPage, 'visitedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const pages = getRecentPages();
    const filtered = pages.filter((p) => p.path !== page.path);
    const updated: RecentPage[] = [
      { ...page, visitedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT_PAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * RecentPages component displays a list of recently accessed pages
 * in a quick access menu. Can be used standalone or inside the
 * GlobalSearch modal.
 *
 * Requirements: 20.7
 */
export function RecentPages({ maxItems = 5, onPageClick }: RecentPagesProps) {
  const t = useTranslations('recentPages');
  const [pages, setPages] = useState<RecentPage[]>([]);

  useEffect(() => {
    setPages(getRecentPages().slice(0, maxItems));
  }, [maxItems]);

  const handleClick = useCallback(
    (page: RecentPage) => {
      onPageClick?.(page);
    },
    [onPageClick]
  );

  if (pages.length === 0) {
    return (
      <div className="py-6 text-center" data-testid="recent-pages-empty">
        <ClockIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" aria-hidden="true" />
        <p className="text-sm text-gray-500">{t('empty')}</p>
      </div>
    );
  }

  return (
    <nav aria-label={t('ariaLabel')}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
        {t('title')}
      </h3>
      <ul role="list" className="space-y-1">
        {pages.map((page) => {
          const IconComponent = getIconComponent(page.icon);
          return (
            <li key={page.path}>
              <Link
                href={page.path}
                onClick={() => handleClick(page)}
                className="flex items-center gap-3 px-2 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors group"
              >
                <IconComponent
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{page.title}</span>
                <span className="text-xs text-gray-500 shrink-0">
                  {formatRelativeTime(page.visitedAt)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
