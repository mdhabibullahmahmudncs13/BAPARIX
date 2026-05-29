'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  locale: string;
  className?: string;
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbsFromPath(pathname: string, locale: string): BreadcrumbItem[] {
  // Remove locale prefix
  const pathWithoutLocale = pathname.replace(`/${locale}`, '');
  
  // Split path into segments
  const segments = pathWithoutLocale.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = `/${locale}`;

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Convert kebab-case to Title Case
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  return breadcrumbs;
}

export function Breadcrumb({ items, locale, className = '' }: BreadcrumbProps) {
  const pathname = usePathname();
  
  // Use provided items or generate from pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname, locale);

  // Don't render if no breadcrumbs
  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm ${className}`}
    >
      {/* Home link */}
      <Link
        href={`/${locale}/dashboard`}
        className="text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Home"
      >
        <HomeIcon className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <div key={item.href} className="flex items-center space-x-2">
            <ChevronRightIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
            
            {isLast ? (
              <span
                className="text-gray-900 font-medium"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
