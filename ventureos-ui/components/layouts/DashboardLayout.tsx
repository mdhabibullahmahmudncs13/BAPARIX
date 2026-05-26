'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb, BreadcrumbItem } from '../ui/Breadcrumb';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale: string;
  userName?: string;
  notificationCount?: number;
  breadcrumbItems?: BreadcrumbItem[];
}

export function DashboardLayout({ 
  children, 
  locale, 
  userName,
  notificationCount,
  breadcrumbItems
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-md bg-white border border-gray-200 shadow-sm md:hidden hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        locale={locale}
      />

      {/* Main content */}
      <div className="md:ml-64">
        {/* Header */}
        <Header 
          locale={locale} 
          userName={userName}
          notificationCount={notificationCount}
        />
        
        {/* Breadcrumb */}
        <div className="px-4 py-3 md:px-6 bg-white border-b border-gray-200">
          <Breadcrumb items={breadcrumbItems} locale={locale} />
        </div>
        
        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
