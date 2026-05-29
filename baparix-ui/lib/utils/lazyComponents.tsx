/**
 * Lazy-loaded component utilities for route-based code splitting.
 *
 * Next.js 14 App Router automatically code-splits at the route level,
 * so each page is already a separate chunk. This module provides
 * additional dynamic imports for heavy feature components that are
 * conditionally rendered within pages (e.g., modals, charts, complex
 * viewers) to reduce the initial JavaScript payload of each route.
 *
 * Requirements:
 * - 16.4: Implement code splitting for route-based chunks
 *
 * Usage:
 *   import { LazyBlueprintViewer } from '@/lib/utils/lazyComponents';
 *   // Use <LazyBlueprintViewer ... /> in your page component
 *
 * Lazy-loaded components and rationale:
 * - BlueprintViewer: Pulls in jspdf, html2canvas, and recharts (~400KB combined)
 * - ExpenseBreakdownChart: Depends on Recharts (~200KB)
 * - ContentGenerationTools: Rich text processing and template engine
 * - BreakEvenProgress: Depends on Recharts
 *
 * Components NOT lazy-loaded (always needed on their routes):
 * - Sidebar, Header, LanguageToggle (layout-level, always visible)
 * - OnboardingWizard (only route that uses it)
 * - ProductSearch (primary feature on its route)
 */

import dynamic from 'next/dynamic';

/**
 * Loading fallback skeleton for chart components.
 * Renders a pulsing placeholder matching typical chart dimensions.
 */
function ChartLoadingFallback() {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded-lg w-full h-64"
      role="status"
      aria-label="Loading chart"
    >
      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

/**
 * Loading fallback skeleton for the Blueprint Viewer.
 * Renders a multi-section placeholder matching the viewer layout.
 */
function BlueprintLoadingFallback() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading blueprint">
      <div className="animate-pulse bg-gray-200 rounded-lg w-full h-12" />
      <div className="animate-pulse bg-gray-200 rounded-lg w-full h-48" />
      <div className="animate-pulse bg-gray-200 rounded-lg w-full h-32" />
      <span className="sr-only">Loading blueprint...</span>
    </div>
  );
}

/**
 * Loading fallback skeleton for content generation tools.
 */
function ContentToolsLoadingFallback() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content tools">
      <div className="animate-pulse bg-gray-200 rounded-lg w-full h-10" />
      <div className="animate-pulse bg-gray-200 rounded-lg w-3/4 h-10" />
      <span className="sr-only">Loading content tools...</span>
    </div>
  );
}

/**
 * BlueprintViewer - Heavy component with Business Model Canvas,
 * financial projections, charts, and PDF export capabilities.
 * Lazy-loaded because it pulls in jspdf, html2canvas, and recharts.
 */
export const LazyBlueprintViewer = dynamic(
  () => import('@/components/features/BlueprintViewer').then((mod) => mod.BlueprintViewer),
  {
    loading: BlueprintLoadingFallback,
    ssr: false,
  }
);

/**
 * ExpenseBreakdownChart - Recharts-based pie/bar chart for expense visualization.
 * Lazy-loaded because Recharts is a large dependency (~200KB).
 */
export const LazyExpenseBreakdownChart = dynamic(
  () => import('@/components/features/ExpenseBreakdownChart').then((mod) => mod.ExpenseBreakdownChart),
  {
    loading: ChartLoadingFallback,
    ssr: false,
  }
);

/**
 * ContentGenerationTools - AI content generation interface with
 * template rendering and preview. Lazy-loaded due to rich text
 * processing and template engine dependencies.
 */
export const LazyContentGenerationTools = dynamic(
  () => import('@/components/features/ContentGenerationTools').then((mod) => mod.ContentGenerationTools),
  {
    loading: ContentToolsLoadingFallback,
    ssr: false,
  }
);

/**
 * BreakEvenProgress - Chart component for break-even analysis visualization.
 * Lazy-loaded as it depends on Recharts.
 */
export const LazyBreakEvenProgress = dynamic(
  () => import('@/components/features/BreakEvenProgress').then((mod) => mod.BreakEvenProgress),
  {
    loading: ChartLoadingFallback,
    ssr: false,
  }
);
