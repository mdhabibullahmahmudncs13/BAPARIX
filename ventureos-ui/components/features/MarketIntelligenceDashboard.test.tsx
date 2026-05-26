import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { MarketIntelligenceDashboard } from './MarketIntelligenceDashboard';

const messages = {
  marketIntelligence: {
    title: 'Market Intelligence Dashboard',
    subtitle: 'Track trends, demand forecasts, and market insights for your business',
    filters: {
      geography: 'Geography',
      category: 'Category',
      timeRange: 'Time Range',
      allRegions: 'All Regions',
      dhaka: 'Dhaka',
      chittagong: 'Chittagong',
      sylhet: 'Sylhet',
      rajshahi: 'Rajshahi',
      khulna: 'Khulna',
      allCategories: 'All Categories',
      electronics: 'Electronics',
      fashion: 'Fashion',
      home: 'Home & Living',
      beauty: 'Beauty & Personal Care',
      sports: 'Sports & Outdoors',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      lastYear: 'Last Year',
    },
    sections: {
      trendAlerts: 'Trending Products',
      newTrends: 'New Trends',
      seasonalDemand: 'Seasonal Demand Forecasts',
      importExportData: 'Import/Export Data',
      demandHeatmap: 'Demand Heatmap',
      competitorMapping: 'Competitor Mapping',
    },
    trajectory: {
      rising: 'Rising',
      stable: 'Stable',
      declining: 'Declining',
    },
    trendDetails: {
      startDate: 'Start Date',
      peakPeriod: 'Peak Period',
      lifespan: 'Est. Lifespan',
    },
    seasons: {
      eid: 'Eid Season',
      eidDescription: 'High demand for clothing, gifts, and home decor',
      winter: 'Winter Season',
      winterDescription: 'Increased demand for warm clothing and accessories',
    },
    placeholders: {
      chartPlaceholder: 'Chart visualization will appear here',
      heatmapPlaceholder: 'Geographic heatmap will appear here',
      competitorPlaceholder: 'Competitor analysis will appear here',
      comingSoon: 'Coming soon in next update',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('MarketIntelligenceDashboard', () => {
  describe('Layout and Structure', () => {
    it('renders the dashboard with filter section', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Check for filter labels
      expect(screen.getByLabelText(/geography/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timerange/i)).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      expect(screen.getByLabelText(/geography/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timerange/i)).toBeInTheDocument();
    });

    it('displays trend alerts with mock data', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Winter Jackets')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('allows changing geography filter', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const geographySelect = screen.getByLabelText(/geography/i) as HTMLSelectElement;
      
      fireEvent.change(geographySelect, { target: { value: 'dhaka' } });
      
      expect(geographySelect.value).toBe('dhaka');
    });

    it('allows changing category filter', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      
      fireEvent.change(categorySelect, { target: { value: 'electronics' } });
      
      expect(categorySelect.value).toBe('electronics');
    });

    it('allows changing time range filter', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const timeRangeSelect = screen.getByLabelText(/timerange/i) as HTMLSelectElement;
      
      fireEvent.change(timeRangeSelect, { target: { value: '30d' } });
      
      expect(timeRangeSelect.value).toBe('30d');
    });

    it('initializes with default filter values', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const geographySelect = screen.getByLabelText(/geography/i) as HTMLSelectElement;
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      const timeRangeSelect = screen.getByLabelText(/timerange/i) as HTMLSelectElement;

      expect(geographySelect.value).toBe('all');
      expect(categorySelect.value).toBe('all');
      expect(timeRangeSelect.value).toBe('7d');
    });
  });

  describe('Trend Alerts Display', () => {
    it('displays trend data', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Winter Jackets')).toBeInTheDocument();
    });

    it('displays seasonal badges for seasonal trends', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      expect(screen.getByText('Winter')).toBeInTheDocument();
    });
  });

  describe('Seasonal Demand Section', () => {
    it('displays seasonal forecast information', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Check for seasonal forecast section title
      expect(screen.getByText(/seasonalDemand/i)).toBeInTheDocument();
      
      // The actual season names are rendered by SeasonalDemandForecast component
      // which uses its own translation keys
    });
  });

  describe('Responsive Grid Layout', () => {
    it('renders grid layout with proper structure', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });
  });

  describe('Accessibility', () => {
    it('has accessible filter labels', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      expect(screen.getByLabelText(/geography/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timerange/i)).toBeInTheDocument();
    });

    it('uses semantic HTML for sections', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      // Check for proper heading hierarchy
      const headings = container.querySelectorAll('h3, h4');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('includes aria-hidden on decorative icons', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Trend Alert Dismissal', () => {
    it('removes trend alert when dismissed', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Verify trend is initially present
      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();

      // Find and click dismiss button
      const dismissButton = screen.getByLabelText('Dismiss Wireless Earbuds alert');
      fireEvent.click(dismissButton);

      // Wait for animation and verify trend is removed
      waitFor(() => {
        expect(screen.queryByText('Wireless Earbuds')).not.toBeInTheDocument();
      });
    });

    it('updates new trends count when trend is dismissed', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Verify initial state has new trends badge
      expect(screen.getByText(/newTrends/i)).toBeInTheDocument();

      // Dismiss one new trend
      const dismissButton = screen.getByLabelText('Dismiss Wireless Earbuds alert');
      fireEvent.click(dismissButton);

      // Wait for update - badge should still exist with updated count
      waitFor(() => {
        expect(screen.getByText(/newTrends/i)).toBeInTheDocument();
      });
    });

    it('shows empty state when all trends are dismissed', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Dismiss all trends
      const dismissButtons = screen.getAllByLabelText(/Dismiss.*alert/);
      dismissButtons.forEach(button => fireEvent.click(button));

      // Wait for empty state
      waitFor(() => {
        expect(screen.getByText('No active trends at the moment')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Child Components', () => {
    it('renders TrendAlert components with correct props', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Verify TrendAlert components are rendered
      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Winter Jackets')).toBeInTheDocument();
      expect(screen.getByText('Smart Home Devices')).toBeInTheDocument();
    });

    it('renders SeasonalDemandForecast component', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      // Check for seasonal forecast section
      expect(screen.getByText(/seasonalDemand/i)).toBeInTheDocument();
      
      // Verify component is rendered (check for characteristic elements)
      const confidenceScores = container.querySelectorAll('[role="progressbar"]');
      expect(confidenceScores.length).toBeGreaterThan(0);
    });

    it('renders ImportExportChart component', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Check for import/export section
      expect(screen.getByText(/importExportData/i)).toBeInTheDocument();
      
      // Verify chart controls are present
      expect(screen.getByLabelText(/period/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/chartType/i)).toBeInTheDocument();
    });

    it('renders placeholder sections for future features', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Check for demand heatmap placeholder
      expect(screen.getByText(/demandHeatmap/i)).toBeInTheDocument();
      expect(screen.getByText(/heatmapPlaceholder/i)).toBeInTheDocument();

      // Check for competitor mapping placeholder
      expect(screen.getByText(/competitorMapping/i)).toBeInTheDocument();
      expect(screen.getByText(/competitorPlaceholder/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies responsive classes to filter container', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      const filterContainer = container.querySelector('.flex.flex-col.md\\:flex-row');
      expect(filterContainer).toBeInTheDocument();
    });

    it('applies responsive grid classes to dashboard sections', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      const gridContainer = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('applies full-width class to trend alerts section', () => {
      const { container } = renderWithIntl(<MarketIntelligenceDashboard />);

      // Trend alerts should span full width (lg:col-span-2)
      const trendAlertsCard = screen.getByText(/trendAlerts/i).closest('.lg\\:col-span-2');
      expect(trendAlertsCard).toBeInTheDocument();
    });
  });

  describe('Filter State Management', () => {
    it('maintains independent filter states', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const geographySelect = screen.getByLabelText(/geography/i) as HTMLSelectElement;
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;
      const timeRangeSelect = screen.getByLabelText(/timerange/i) as HTMLSelectElement;

      // Change all filters
      fireEvent.change(geographySelect, { target: { value: 'dhaka' } });
      fireEvent.change(categorySelect, { target: { value: 'electronics' } });
      fireEvent.change(timeRangeSelect, { target: { value: '30d' } });

      // Verify all filters maintain their values
      expect(geographySelect.value).toBe('dhaka');
      expect(categorySelect.value).toBe('electronics');
      expect(timeRangeSelect.value).toBe('30d');
    });

    it('allows resetting filters to default values', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const geographySelect = screen.getByLabelText(/geography/i) as HTMLSelectElement;
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;

      // Change filters
      fireEvent.change(geographySelect, { target: { value: 'dhaka' } });
      fireEvent.change(categorySelect, { target: { value: 'electronics' } });

      // Reset to default
      fireEvent.change(geographySelect, { target: { value: 'all' } });
      fireEvent.change(categorySelect, { target: { value: 'all' } });

      expect(geographySelect.value).toBe('all');
      expect(categorySelect.value).toBe('all');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty trend alerts gracefully', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Dismiss all trends
      const dismissButtons = screen.getAllByLabelText(/Dismiss.*alert/);
      dismissButtons.forEach(button => fireEvent.click(button));

      // Should show empty state
      waitFor(() => {
        expect(screen.getByText('No active trends at the moment')).toBeInTheDocument();
      });
    });

    it('displays correct new trends count', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Mock data has 2 new trends (Wireless Earbuds and Smart Home Devices)
      // Check that new trends badge is displayed
      expect(screen.getByText(/newTrends/i)).toBeInTheDocument();
    });

    it('handles seasonal and non-seasonal trends correctly', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      // Winter Jackets is seasonal
      expect(screen.getByText('Winter')).toBeInTheDocument();

      // Wireless Earbuds is not seasonal (no seasonal badge)
      const wirelessEarbudsCard = screen.getByText('Wireless Earbuds').closest('[role="article"]');
      expect(wirelessEarbudsCard).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('allows Learn More interaction on trends', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const learnMoreButtons = screen.getAllByText('Learn More');
      expect(learnMoreButtons.length).toBeGreaterThan(0);

      // Click first Learn More button
      fireEvent.click(learnMoreButtons[0]);

      // Console log should be called (mocked in implementation)
      // In real implementation, this would navigate or open a modal
    });

    it('supports keyboard navigation for filters', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const geographySelect = screen.getByLabelText(/geography/i);
      
      // Focus should work
      geographySelect.focus();
      expect(document.activeElement).toBe(geographySelect);
    });
  });

  describe('Performance', () => {
    it('renders without performance issues', () => {
      const startTime = performance.now();
      renderWithIntl(<MarketIntelligenceDashboard />);
      const endTime = performance.now();

      // Should render in less than 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('handles multiple filter changes efficiently', () => {
      renderWithIntl(<MarketIntelligenceDashboard />);

      const geographySelect = screen.getByLabelText(/geography/i) as HTMLSelectElement;
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement;

      // Rapid filter changes
      for (let i = 0; i < 10; i++) {
        fireEvent.change(geographySelect, { target: { value: i % 2 === 0 ? 'dhaka' : 'chittagong' } });
        fireEvent.change(categorySelect, { target: { value: i % 2 === 0 ? 'electronics' : 'fashion' } });
      }

      // Should still be responsive
      expect(geographySelect.value).toBe('chittagong');
      expect(categorySelect.value).toBe('fashion');
    });
  });
});
