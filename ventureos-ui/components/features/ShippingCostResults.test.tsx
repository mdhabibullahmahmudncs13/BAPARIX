import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ShippingCostResults, ShippingResult } from './ShippingCostResults';

const mockResults: ShippingResult[] = [
  {
    agency: 'SKS Group',
    cost: 5000,
    leadTime: '7-10 days',
    method: 'air',
    customsDuty: 1200,
    totalLandedCost: 7200,
  },
  {
    agency: 'SkyBuyBD',
    cost: 3500,
    leadTime: '15-20 days',
    method: 'sea',
    customsDuty: 1200,
    totalLandedCost: 5700,
  },
  {
    agency: 'BD Express',
    cost: 4200,
    leadTime: '5-7 days',
    method: 'courier',
    customsDuty: 1200,
    totalLandedCost: 6400,
  },
  {
    agency: 'Sundarban Courier',
    cost: 3800,
    leadTime: '10-14 days',
    method: 'courier',
    customsDuty: 1200,
    totalLandedCost: 6000,
  },
  {
    agency: 'DHL Express',
    cost: 8500,
    leadTime: '3-5 days',
    method: 'air',
    customsDuty: 1200,
    totalLandedCost: 10700,
  },
  {
    agency: 'Aramex',
    cost: 6000,
    leadTime: '5-8 days',
    method: 'air',
    customsDuty: 1200,
    totalLandedCost: 8200,
  },
];

describe('ShippingCostResults', () => {
  describe('Rendering', () => {
    it('should render the results title', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      expect(screen.getByText('results.title')).toBeInTheDocument();
    });

    it('should render a table with correct columns', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      expect(screen.getByText(/results\.columns\.agency/)).toBeInTheDocument();
      expect(screen.getByText(/results\.columns\.method/)).toBeInTheDocument();
      expect(screen.getByText(/results\.columns\.cost/)).toBeInTheDocument();
      expect(screen.getByText(/results\.columns\.leadTime/)).toBeInTheDocument();
      expect(screen.getByText(/results\.columns\.totalLandedCost/)).toBeInTheDocument();
    });

    it('should render all 6 agency results', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      expect(screen.getByText('SKS Group')).toBeInTheDocument();
      expect(screen.getByText('SkyBuyBD')).toBeInTheDocument();
      expect(screen.getByText('BD Express')).toBeInTheDocument();
      expect(screen.getByText('Sundarban Courier')).toBeInTheDocument();
      expect(screen.getByText('DHL Express')).toBeInTheDocument();
      expect(screen.getByText('Aramex')).toBeInTheDocument();
    });

    it('should display shipping methods with badges', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      // The method text is translated via the mock (returns the key)
      const airBadges = screen.getAllByText('results.methods.air');
      const seaBadges = screen.getAllByText('results.methods.sea');
      const courierBadges = screen.getAllByText('results.methods.courier');
      expect(airBadges.length).toBe(3); // SKS Group, DHL Express, Aramex
      expect(seaBadges.length).toBe(1); // SkyBuyBD
      expect(courierBadges.length).toBe(2); // BD Express, Sundarban Courier
    });

    it('should display lead times', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      expect(screen.getByText('7-10 days')).toBeInTheDocument();
      expect(screen.getByText('15-20 days')).toBeInTheDocument();
      expect(screen.getByText('5-7 days')).toBeInTheDocument();
      expect(screen.getByText('3-5 days')).toBeInTheDocument();
    });

    it('should display result count summary', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      expect(screen.getByText('results.summary')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no results message when results array is empty', () => {
      render(<ShippingCostResults results={[]} locale="en" />);
      expect(screen.getByText('results.noResults')).toBeInTheDocument();
    });

    it('should not render the table when results are empty', () => {
      render(<ShippingCostResults results={[]} locale="en" />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(<ShippingCostResults results={[]} locale="en" isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(<ShippingCostResults results={[]} locale="en" isLoading={true} />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'results.loading');
    });

    it('should not render the table when loading', () => {
      render(<ShippingCostResults results={[]} locale="en" isLoading={true} />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by cost ascending by default', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      const rows = screen.getAllByRole('row');
      // First data row (index 1, since index 0 is header)
      // Cheapest is SkyBuyBD at 3500
      expect(within(rows[1]).getByText('SkyBuyBD')).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking the same column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      // Click cost column (already sorted asc by default)
      const costHeader = screen.getByRole('button', { name: /results\.columns\.cost/ });
      fireEvent.click(costHeader);

      // Now sorted desc - most expensive first (DHL Express at 8500)
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('DHL Express')).toBeInTheDocument();
    });

    it('should sort by agency name when clicking agency column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      const agencyHeader = screen.getByRole('button', { name: /results\.columns\.agency/ });
      fireEvent.click(agencyHeader);

      const rows = screen.getAllByRole('row');
      // Alphabetically first: Aramex
      expect(within(rows[1]).getByText('Aramex')).toBeInTheDocument();
    });

    it('should sort by method when clicking method column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      const methodHeader = screen.getByRole('button', { name: /results\.columns\.method/ });
      fireEvent.click(methodHeader);

      const rows = screen.getAllByRole('row');
      // 'air' comes first alphabetically
      const firstRowMethods = within(rows[1]).queryAllByText('results.methods.air');
      expect(firstRowMethods.length).toBeGreaterThan(0);
    });

    it('should sort by lead time when clicking lead time column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      const leadTimeHeader = screen.getByRole('button', { name: /results\.columns\.leadTime/ });
      fireEvent.click(leadTimeHeader);

      const rows = screen.getAllByRole('row');
      // Shortest lead time: DHL Express at 3-5 days
      expect(within(rows[1]).getByText('DHL Express')).toBeInTheDocument();
    });

    it('should sort by total landed cost when clicking that column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      const totalCostHeader = screen.getByRole('button', { name: /results\.columns\.totalLandedCost/ });
      fireEvent.click(totalCostHeader);

      const rows = screen.getAllByRole('row');
      // Cheapest total: SkyBuyBD at 5700
      expect(within(rows[1]).getByText('SkyBuyBD')).toBeInTheDocument();
    });

    it('should display sort direction indicator on active column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      // Default sort is cost asc
      const costHeader = screen.getByRole('button', { name: /results\.columns\.cost/ });
      expect(costHeader.textContent).toContain('↑');
    });

    it('should show descending indicator after toggling', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      
      const costHeader = screen.getByRole('button', { name: /results\.columns\.cost/ });
      fireEvent.click(costHeader);
      
      expect(costHeader.textContent).toContain('↓');
    });
  });

  describe('Accessibility', () => {
    it('should have a table with grid role and aria-label', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'results.tableAriaLabel');
    });

    it('should have aria-sort on active sort column', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      const costHeader = screen.getByRole('button', { name: /results\.columns\.cost/ });
      expect(costHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('should have aria-sort none on inactive columns', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      const agencyHeader = screen.getByRole('button', { name: /results\.columns\.agency/ });
      expect(agencyHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('should update aria-sort when sort direction changes', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      const costHeader = screen.getByRole('button', { name: /results\.columns\.cost/ });
      
      fireEvent.click(costHeader);
      expect(costHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should have column headers as scope col', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(<ShippingCostResults results={mockResults} locale="bn" />);
      expect(screen.getByText('results.title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(<ShippingCostResults results={mockResults} locale="en" />);
      expect(screen.getByText('results.title')).toBeInTheDocument();
    });
  });
});
