'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  TruckIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  UsersIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ isOpen, onClose, locale }: SidebarProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { key: 'dashboard', href: `/${locale}/dashboard`, icon: HomeIcon },
    { key: 'products', href: `/${locale}/products`, icon: MagnifyingGlassIcon },
    { key: 'marketIntelligence', href: `/${locale}/market-intelligence`, icon: ChartBarIcon },
    { key: 'blueprint', href: `/${locale}/blueprint`, icon: DocumentTextIcon },
    { key: 'shipping', href: `/${locale}/shipping`, icon: TruckIcon },
    { key: 'financial', href: `/${locale}/financial`, icon: CurrencyDollarIcon },
    { key: 'seo', href: `/${locale}/seo`, icon: MegaphoneIcon },
    { key: 'team', href: `/${locale}/team`, icon: UsersIcon },
    { key: 'settings', href: `/${locale}/settings`, icon: Cog6ToothIcon },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-auto
        `}
        aria-label="Sidebar navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
          <span className="text-lg font-semibold text-gray-900">
            {t('menu')}
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={t('close')}
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => {
                  // Close mobile menu on navigation
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active ? 'text-blue-700' : 'text-gray-500'
                  }`}
                />
                <span className="truncate">{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
