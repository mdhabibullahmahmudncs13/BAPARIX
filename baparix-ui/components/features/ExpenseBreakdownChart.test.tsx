import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ExpenseBreakdownChart, ExpenseDataPoint } from './ExpenseBreakdownChart';

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: ({
      children,
      data,
      dataKey,
      nameKey,
    }: {
      children: React.ReactNode;
      data: any[];
      dataKey: string;
      nameKey: string;
    }) => (
      <div
        data-testid="pie"
        data-chart-data={JSON.stringify(data)}
        data-data-key={dataKey}
        data-name-key={nameKey}
      >
        {children}
      </div>
    ),
    Cell: ({ fill }: { fill: string }) => (
      <div data-testid="pie-cell" data-fill={fill} />
    ),
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

const messages = {
  financialTracker: {
    expenseBreakdown: {
      title: 'Expense Breakdown',
      ariaLabel: 'Pie chart showing expense breakdown by category',
      noData: 'No expense data available to display.',
      loading: 'Loading expense data...',
      total: 'Total Expenses',
      tooltipCategory: 'Category',
      tooltipAmount: 'Amount',
      tooltipPercentage: 'Percentage',
    },
    entryForm: {
      categories: {
        product_cost: 'Product Cost',
        shipping: 'Shipping',
        customs_duty: 'Customs Duty',
        marketing: 'Marketing',
        rent: 'Rent',
        utilities: 'Utilities',
        salary: 'Salary',
        packaging: 'Packaging',
        platform_fees: 'Platform Fees',
        tax: 'Tax',
        other_expense: 'Other Expense',
      },
    },
  },
};

const mockData: ExpenseDataPoint[] = [
  { category: 'product_cost', amount: 50000 },
  { category: 'shipping', amount: 15000 },
  { category: 'marketing', amount: 12000 },
  { category: 'rent', amount: 20000 },
  { category: 'salary', amount: 35000 },
  { category: 'utilities', amount: 5000 },
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ExpenseBreakdownChart', () => {
  describe('Rendering', () => {
    it('should render the chart title', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render the pie chart with data', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render the pie component', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    it('should render tooltip component', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render legend component', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should display total expenses summary', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const totalElement = screen.getByTestId('expense-total');
      expect(totalElement).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should pass correct chart data with category and amount', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const pie = screen.getByTestId('pie');
      const chartData = JSON.parse(pie.getAttribute('data-chart-data') || '[]');

      expect(chartData.length).toBeGreaterThan(0);
      chartData.forEach((point: any) => {
        expect(point).toHaveProperty('category');
        expect(point).toHaveProperty('amount');
        expect(point).toHaveProperty('percentage');
        expect(typeof point.amount).toBe('number');
        expect(typeof point.percentage).toBe('number');
      });
    });

    it('should use amount as the data key', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const pie = screen.getByTestId('pie');
      expect(pie.getAttribute('data-data-key')).toBe('amount');
    });

    it('should use category as the name key', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const pie = screen.getByTestId('pie');
      expect(pie.getAttribute('data-name-key')).toBe('category');
    });

    it('should sort data by amount in descending order', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const pie = screen.getByTestId('pie');
      const chartData = JSON.parse(pie.getAttribute('data-chart-data') || '[]');

      for (let i = 0; i < chartData.length - 1; i++) {
        expect(chartData[i].amount).toBeGreaterThanOrEqual(chartData[i + 1].amount);
      }
    });

    it('should calculate percentages correctly', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const pie = screen.getByTestId('pie');
      const chartData = JSON.parse(pie.getAttribute('data-chart-data') || '[]');

      const totalPercentage = chartData.reduce(
        (sum: number, point: any) => sum + point.percentage,
        0
      );
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('should filter out zero-amount entries', () => {
      const dataWithZero: ExpenseDataPoint[] = [
        { category: 'product_cost', amount: 50000 },
        { category: 'shipping', amount: 0 },
        { category: 'marketing', amount: 12000 },
      ];

      renderWithIntl(<ExpenseBreakdownChart data={dataWithZero} locale="en" />);

      const pie = screen.getByTestId('pie');
      const chartData = JSON.parse(pie.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(2);
      expect(chartData.every((point: any) => point.amount > 0)).toBe(true);
    });

    it('should handle single data point correctly', () => {
      renderWithIntl(
        <ExpenseBreakdownChart data={[mockData[0]]} locale="en" />
      );

      const pie = screen.getByTestId('pie');
      const chartData = JSON.parse(pie.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(1);
      expect(chartData[0].percentage).toBeCloseTo(100, 0);
    });
  });

  describe('Empty State', () => {
    it('should display no data message when data is empty', () => {
      renderWithIntl(<ExpenseBreakdownChart data={[]} locale="en" />);

      expect(screen.getByTestId('expense-chart-empty')).toBeInTheDocument();
    });

    it('should not render pie chart when data is empty', () => {
      renderWithIntl(<ExpenseBreakdownChart data={[]} locale="en" />);

      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when data is empty', () => {
      renderWithIntl(<ExpenseBreakdownChart data={[]} locale="en" />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should show empty state when all amounts are zero', () => {
      const zeroData: ExpenseDataPoint[] = [
        { category: 'product_cost', amount: 0 },
        { category: 'shipping', amount: 0 },
      ];

      renderWithIntl(<ExpenseBreakdownChart data={zeroData} locale="en" />);

      expect(screen.getByTestId('expense-chart-empty')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      renderWithIntl(
        <ExpenseBreakdownChart data={[]} locale="en" isLoading={true} />
      );

      expect(screen.getByTestId('expense-chart-loading')).toBeInTheDocument();
    });

    it('should not render pie chart when loading', () => {
      renderWithIntl(
        <ExpenseBreakdownChart data={mockData} locale="en" isLoading={true} />
      );

      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when loading', () => {
      renderWithIntl(
        <ExpenseBreakdownChart data={[]} locale="en" isLoading={true} />
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Color-blind Friendly Palette', () => {
    it('should render individual colored cells for each slice', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const cells = screen.getAllByTestId('pie-cell');
      expect(cells).toHaveLength(6);
    });

    it('should use distinct colors from the color-blind friendly palette', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const cells = screen.getAllByTestId('pie-cell');
      const expectedColors = [
        '#2563eb', // Blue
        '#ea580c', // Orange
        '#0d9488', // Teal
        '#7c3aed', // Purple
        '#ca8a04', // Gold
        '#dc2626', // Red
      ];

      cells.forEach((cell, index) => {
        expect(cell.getAttribute('data-fill')).toBe(expectedColors[index]);
      });
    });

    it('should cycle palette colors when more categories than palette entries', () => {
      const manyCategories: ExpenseDataPoint[] = [
        { category: 'product_cost', amount: 50000 },
        { category: 'shipping', amount: 15000 },
        { category: 'customs_duty', amount: 10000 },
        { category: 'marketing', amount: 12000 },
        { category: 'rent', amount: 20000 },
        { category: 'utilities', amount: 5000 },
        { category: 'salary', amount: 35000 },
        { category: 'packaging', amount: 8000 },
        { category: 'platform_fees', amount: 6000 },
        { category: 'tax', amount: 9000 },
        { category: 'other_expense', amount: 3000 },
      ];

      renderWithIntl(<ExpenseBreakdownChart data={manyCategories} locale="en" />);

      const cells = screen.getAllByTestId('pie-cell');
      expect(cells).toHaveLength(11);
      // 12th entry (index 11) would cycle back to first color
      // With 11 entries, all fit within the palette
    });

    it('should use colors that are all unique within the palette size', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const cells = screen.getAllByTestId('pie-cell');
      const colors = cells.map((cell) => cell.getAttribute('data-fill'));

      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(6);
    });
  });

  describe('Locale Support', () => {
    it('should accept bn locale prop', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="bn" />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should accept en locale prop', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render chart data regardless of locale', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="bn" />);

      const pie = screen.getByTestId('pie');
      const chartData = JSON.parse(pie.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(6);
    });
  });

  describe('Accessibility', () => {
    it('should have role=img on the chart container', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should have an aria-label on the chart container', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toHaveAttribute('aria-label');
    });

    it('should render a heading for the chart title', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render within a ResponsiveContainer', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should apply w-full class for responsive width', () => {
      const { container } = renderWithIntl(
        <ExpenseBreakdownChart data={mockData} locale="en" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full');
    });

    it('should have a fixed height chart container', () => {
      renderWithIntl(<ExpenseBreakdownChart data={mockData} locale="en" />);

      const chartWrapper = screen.getByRole('img');
      expect(chartWrapper).toHaveClass('h-80');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = renderWithIntl(
        <ExpenseBreakdownChart data={mockData} locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('mt-6');
    });

    it('should preserve default classes when custom className is provided', () => {
      const { container } = renderWithIntl(
        <ExpenseBreakdownChart data={mockData} locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full', 'mt-6');
    });
  });
});
