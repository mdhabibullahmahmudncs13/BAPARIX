import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductProfitTable, ProductProfitData } from './ProductProfitTable';

const mockProducts: ProductProfitData[] = [
  {
    id: '1',
    name: 'Wireless Earbuds',
    revenue: 150000,
    cost: 90000,
    unitsSold: 500,
  },
  {
    id: '2',
    name: 'Phone Cases',
    revenue: 80000,
    cost: 20000,
    unitsSold: 1200,
  },
  {
    id: '3',
    name: 'USB Cables',
    revenue: 45000,
    cost: 42000,
    unitsSold: 3000,
  },
  {
    id: '4',
    name: 'Smart Watch',
    revenue: 200000,
    cost: 140000,
    unitsSold: 200,
  },
  {
    id: '5',
    name: 'Laptop Stand',
    revenue: 60000,
    cost: 35000,
    unitsSold: 150,
  },
];

describe('ProductProfitTable', () => {
  describe('Rendering', () => {
    it('should render the table title', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      expect(screen.getByText('profitTable.title')).toBeInTheDocument();
    });

    it('should render all column headers', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      expect(screen.getByText(/profitTable\.columns\.rank/)).toBeInTheDocument();
      expect(screen.getByText(/profitTable\.columns\.name/)).toBeInTheDocument();
      expect(screen.getByText(/profitTable\.columns\.revenue/)).toBeInTheDocument();
      expect(screen.getByText(/profitTable\.columns\.cost/)).toBeInTheDocument();
      expect(screen.getByText(/profitTable\.columns\.profit/)).toBeInTheDocument();
      expect(screen.getByText(/profitTable\.columns\.margin/)).toBeInTheDocument();
      expect(screen.getByText(/profitTable\.columns\.unitsSold/)).toBeInTheDocument();
    });

    it('should render all product names', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Phone Cases')).toBeInTheDocument();
      expect(screen.getByText('USB Cables')).toBeInTheDocument();
      expect(screen.getByText('Smart Watch')).toBeInTheDocument();
      expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
    });

    it('should display profit margins as percentages', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      // Smart Watch: (200000-140000)/200000 = 30%
      expect(screen.getByText('30.0%')).toBeInTheDocument();
      // Phone Cases: (80000-20000)/80000 = 75%
      expect(screen.getByText('75.0%')).toBeInTheDocument();
    });

    it('should display rank numbers based on sort order', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const rows = screen.getAllByRole('row');
      // Default sort is revenue desc, so Smart Watch (200000) is first
      expect(within(rows[1]).getByText('Smart Watch')).toBeInTheDocument();
      // First cell in first data row should be "1"
      const cells = within(rows[1]).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('1');
    });

    it('should display summary with product count', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      expect(screen.getByText('profitTable.summary')).toBeInTheDocument();
    });
  });

  describe('Margin Highlighting', () => {
    it('should highlight high margins (>30%) with success badge', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      // Phone Cases has 75% margin - should have success (green) badge
      const badge75 = screen.getByText('75.0%');
      expect(badge75.closest('span')).toHaveClass('bg-green-100');
    });

    it('should highlight low margins (<10%) with error badge', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      // USB Cables: (45000-42000)/45000 = 6.67% - should have error (red) badge
      const badge = screen.getByText('6.7%');
      expect(badge.closest('span')).toHaveClass('bg-red-100');
    });

    it('should show default badge for margins between 10% and 30%', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      // Smart Watch: 30% exactly is not > 30, so it's default
      const badge30 = screen.getByText('30.0%');
      expect(badge30.closest('span')).toHaveClass('bg-gray-100');
    });
  });

  describe('Empty State', () => {
    it('should display no products message when array is empty', () => {
      render(<ProductProfitTable products={[]} locale="en" />);
      expect(screen.getByText('profitTable.noProducts')).toBeInTheDocument();
    });

    it('should not render the table when products are empty', () => {
      render(<ProductProfitTable products={[]} locale="en" />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(<ProductProfitTable products={[]} locale="en" isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(<ProductProfitTable products={[]} locale="en" isLoading={true} />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'profitTable.loading');
    });

    it('should not render the table when loading', () => {
      render(<ProductProfitTable products={[]} locale="en" isLoading={true} />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by revenue descending by default', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const rows = screen.getAllByRole('row');
      // Smart Watch has highest revenue (200000)
      expect(within(rows[1]).getByText('Smart Watch')).toBeInTheDocument();
      // Wireless Earbuds second (150000)
      expect(within(rows[2]).getByText('Wireless Earbuds')).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking the same column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      // Click revenue column (already sorted desc by default)
      const revenueHeader = screen.getByRole('button', { name: /profitTable\.columns\.revenue/ });
      fireEvent.click(revenueHeader);

      // Now sorted asc - lowest revenue first (USB Cables at 45000)
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('USB Cables')).toBeInTheDocument();
    });

    it('should sort by name ascending when clicking name column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const nameHeader = screen.getByRole('button', { name: /profitTable\.columns\.name/ });
      fireEvent.click(nameHeader);

      const rows = screen.getAllByRole('row');
      // Alphabetically first: Laptop Stand
      expect(within(rows[1]).getByText('Laptop Stand')).toBeInTheDocument();
    });

    it('should sort by profit when clicking profit column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const profitHeader = screen.getByRole('button', { name: /profitTable\.columns\.profit/ });
      fireEvent.click(profitHeader);

      const rows = screen.getAllByRole('row');
      // Highest profit: Wireless Earbuds (150000-90000=60000) and Phone Cases (80000-20000=60000)
      // Smart Watch: 200000-140000=60000 - all three are 60000, so order depends on stable sort
      // Actually: Phone Cases profit = 60000, Wireless Earbuds = 60000, Smart Watch = 60000
      // Laptop Stand = 25000, USB Cables = 3000
      // With desc sort, one of the 60000 products should be first
      const firstRowText = within(rows[1]).getAllByRole('cell')[1].textContent;
      expect(['Phone Cases', 'Wireless Earbuds', 'Smart Watch']).toContain(firstRowText);
    });

    it('should sort by margin when clicking margin column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const marginHeader = screen.getByRole('button', { name: /profitTable\.columns\.margin/ });
      fireEvent.click(marginHeader);

      const rows = screen.getAllByRole('row');
      // Highest margin: Phone Cases at 75%
      expect(within(rows[1]).getByText('Phone Cases')).toBeInTheDocument();
    });

    it('should sort by units sold when clicking units column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const unitsHeader = screen.getByRole('button', { name: /profitTable\.columns\.unitsSold/ });
      fireEvent.click(unitsHeader);

      const rows = screen.getAllByRole('row');
      // Most units: USB Cables at 3000
      expect(within(rows[1]).getByText('USB Cables')).toBeInTheDocument();
    });

    it('should display sort direction indicator on active column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      // Default sort is revenue desc
      const revenueHeader = screen.getByRole('button', { name: /profitTable\.columns\.revenue/ });
      expect(revenueHeader.textContent).toContain('↓');
    });

    it('should show ascending indicator after toggling', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const revenueHeader = screen.getByRole('button', { name: /profitTable\.columns\.revenue/ });
      fireEvent.click(revenueHeader);

      expect(revenueHeader.textContent).toContain('↑');
    });

    it('should update rank numbers when sort changes', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const unitsHeader = screen.getByRole('button', { name: /profitTable\.columns\.unitsSold/ });
      fireEvent.click(unitsHeader);

      const rows = screen.getAllByRole('row');
      // USB Cables should be rank 1 (most units sold)
      const firstDataRow = rows[1];
      const cells = within(firstDataRow).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('1');
      expect(cells[1]).toHaveTextContent('USB Cables');
    });
  });

  describe('Accessibility', () => {
    it('should have a table with grid role and aria-label', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'profitTable.tableAriaLabel');
    });

    it('should have aria-sort on active sort column', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const revenueHeader = screen.getByRole('button', { name: /profitTable\.columns\.revenue/ });
      expect(revenueHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should have aria-sort none on inactive columns', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const nameHeader = screen.getByRole('button', { name: /profitTable\.columns\.name/ });
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('should update aria-sort when sort direction changes', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const revenueHeader = screen.getByRole('button', { name: /profitTable\.columns\.revenue/ });

      fireEvent.click(revenueHeader);
      expect(revenueHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('should have column headers with scope col', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(<ProductProfitTable products={mockProducts} locale="bn" />);
      expect(screen.getByText('profitTable.title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      expect(screen.getByText('profitTable.title')).toBeInTheDocument();
    });

    it('should format currency with ৳ symbol', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      // Check that currency values contain the ৳ symbol
      const cells = screen.getAllByRole('cell');
      const currencyCells = cells.filter((cell) => cell.textContent?.includes('৳'));
      expect(currencyCells.length).toBeGreaterThan(0);
    });
  });

  describe('Best-Seller Ranking', () => {
    it('should rank by revenue when sorted by revenue', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);
      const rows = screen.getAllByRole('row');
      // Default is revenue desc
      // Rank 1: Smart Watch (200000)
      // Rank 2: Wireless Earbuds (150000)
      // Rank 3: Phone Cases (80000)
      expect(within(rows[1]).getByText('Smart Watch')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(within(rows[3]).getByText('Phone Cases')).toBeInTheDocument();
    });

    it('should rank by units when sorted by units sold', () => {
      render(<ProductProfitTable products={mockProducts} locale="en" />);

      const unitsHeader = screen.getByRole('button', { name: /profitTable\.columns\.unitsSold/ });
      fireEvent.click(unitsHeader);

      const rows = screen.getAllByRole('row');
      // Rank 1: USB Cables (3000)
      // Rank 2: Phone Cases (1200)
      // Rank 3: Wireless Earbuds (500)
      expect(within(rows[1]).getByText('USB Cables')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Phone Cases')).toBeInTheDocument();
      expect(within(rows[3]).getByText('Wireless Earbuds')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle product with zero revenue', () => {
      const productsWithZero: ProductProfitData[] = [
        { id: '1', name: 'Zero Revenue', revenue: 0, cost: 1000, unitsSold: 0 },
      ];
      render(<ProductProfitTable products={productsWithZero} locale="en" />);
      // Margin should be 0% when revenue is 0
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('should handle single product', () => {
      const singleProduct: ProductProfitData[] = [
        { id: '1', name: 'Only Product', revenue: 50000, cost: 30000, unitsSold: 100 },
      ];
      render(<ProductProfitTable products={singleProduct} locale="en" />);
      expect(screen.getByText('Only Product')).toBeInTheDocument();
      // Margin: (50000-30000)/50000 = 40%
      expect(screen.getByText('40.0%')).toBeInTheDocument();
    });
  });
});
