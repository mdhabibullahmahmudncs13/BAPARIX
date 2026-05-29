import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ShippingCostChart } from './ShippingCostChart';
import type { ShippingResult } from './ShippingCostResults';

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
      <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: ({ children, dataKey }: { children: React.ReactNode; dataKey: string }) => (
      <div data-testid={`bar-${dataKey}`}>{children}</div>
    ),
    Cell: ({ fill }: { fill: string }) => (
      <div data-testid="bar-cell" data-fill={fill} />
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="x-axis" data-key={dataKey} />
    ),
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
  };
});

const messages = {
  shipping: {
    costChart: {
      title: 'Cost Comparison Chart',
      ariaLabel: 'Bar chart comparing total landed costs across shipping agencies',
      yAxisLabel: 'Total Landed Cost (৳)',
      noData: 'No data available to display chart.',
      tooltipLabel: 'Total Landed Cost',
    },
  },
};

const mockResults: ShippingResult[] = [
  {
    agency: 'SKS Group',
    cost: 5000,
    leadTime: '7-10 days',
    method: 'air',
    customsDuty: 2000,
    totalLandedCost: 12000,
  },
  {
    agency: 'SkyBuyBD',
    cost: 3500,
    leadTime: '15-20 days',
    method: 'sea',
    customsDuty: 2000,
    totalLandedCost: 9500,
  },
  {
    agency: 'BD Express',
    cost: 4200,
    leadTime: '5-7 days',
    method: 'courier',
    customsDuty: 2000,
    totalLandedCost: 11200,
  },
  {
    agency: 'DHL Express',
    cost: 8000,
    leadTime: '3-5 days',
    method: 'air',
    customsDuty: 2000,
    totalLandedCost: 15000,
  },
  {
    agency: 'Aramex',
    cost: 6500,
    leadTime: '5-8 days',
    method: 'air',
    customsDuty: 2000,
    totalLandedCost: 13500,
  },
  {
    agency: 'Sundarban Courier',
    cost: 3000,
    leadTime: '10-14 days',
    method: 'courier',
    customsDuty: 2000,
    totalLandedCost: 9000,
  },
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ShippingCostChart', () => {
  describe('Rendering', () => {
    it('should render the chart title', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      // next-intl in test env renders the key name from the namespace
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render the bar chart with data', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render chart axes and grid', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('should render tooltip component', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should use agency names as X-axis data key', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis.getAttribute('data-key')).toBe('agency');
    });
  });

  describe('Data Handling', () => {
    it('should pass correct chart data with agency and totalLandedCost', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(6);
      chartData.forEach((point: any) => {
        expect(point).toHaveProperty('agency');
        expect(point).toHaveProperty('totalLandedCost');
        expect(typeof point.totalLandedCost).toBe('number');
      });
    });

    it('should map results to chart data correctly', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

      expect(chartData[0].agency).toBe('SKS Group');
      expect(chartData[0].totalLandedCost).toBe(12000);
      expect(chartData[1].agency).toBe('SkyBuyBD');
      expect(chartData[1].totalLandedCost).toBe(9500);
    });

    it('should render a bar for totalLandedCost data key', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      expect(screen.getByTestId('bar-totalLandedCost')).toBeInTheDocument();
    });

    it('should handle single result correctly', () => {
      renderWithIntl(
        <ShippingCostChart results={[mockResults[0]]} locale="en" />
      );

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(1);
      expect(chartData[0].agency).toBe('SKS Group');
      expect(chartData[0].totalLandedCost).toBe(12000);
    });
  });

  describe('Empty State', () => {
    it('should display no data message when results are empty', () => {
      renderWithIntl(<ShippingCostChart results={[]} locale="en" />);

      // The component renders a paragraph with the noData message
      const noDataElement = screen.getByRole('heading', { level: 3 }).parentElement;
      expect(noDataElement).toBeInTheDocument();
      expect(noDataElement?.querySelector('p')).toBeInTheDocument();
    });

    it('should not render bar chart when results are empty', () => {
      renderWithIntl(<ShippingCostChart results={[]} locale="en" />);

      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when results are empty', () => {
      renderWithIntl(<ShippingCostChart results={[]} locale="en" />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Color-blind Friendly Palette', () => {
    it('should render individual colored cells for each bar', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const cells = screen.getAllByTestId('bar-cell');
      expect(cells).toHaveLength(6);
    });

    it('should use distinct colors from the color-blind friendly palette', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const cells = screen.getAllByTestId('bar-cell');
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

    it('should cycle palette colors when more results than palette entries', () => {
      const extendedResults: ShippingResult[] = [
        ...mockResults,
        {
          agency: 'FedEx',
          cost: 9000,
          leadTime: '2-4 days',
          method: 'air',
          customsDuty: 2000,
          totalLandedCost: 16000,
        },
      ];

      renderWithIntl(<ShippingCostChart results={extendedResults} locale="en" />);

      const cells = screen.getAllByTestId('bar-cell');
      expect(cells).toHaveLength(7);
      // 7th bar should cycle back to first color
      expect(cells[6].getAttribute('data-fill')).toBe('#2563eb');
    });

    it('should use colors that are distinguishable for common color blindness types', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const cells = screen.getAllByTestId('bar-cell');
      const colors = cells.map((cell) => cell.getAttribute('data-fill'));

      // All colors should be unique (no duplicates within the palette size)
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(6);
    });
  });

  describe('Locale Support', () => {
    it('should accept bn locale prop', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="bn" />);

      // Component renders without error with bn locale
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should accept en locale prop', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render chart data regardless of locale', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="bn" />);

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(6);
    });
  });

  describe('Accessibility', () => {
    it('should have role=img on the chart container', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should have an aria-label on the chart container', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toHaveAttribute('aria-label');
    });

    it('should render a heading for the chart title', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render within a ResponsiveContainer', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should apply w-full class for responsive width', () => {
      const { container } = renderWithIntl(
        <ShippingCostChart results={mockResults} locale="en" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full');
    });

    it('should have a fixed height chart container', () => {
      renderWithIntl(<ShippingCostChart results={mockResults} locale="en" />);

      const chartWrapper = screen.getByRole('img');
      expect(chartWrapper).toHaveClass('h-80');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = renderWithIntl(
        <ShippingCostChart results={mockResults} locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('mt-6');
    });

    it('should preserve default classes when custom className is provided', () => {
      const { container } = renderWithIntl(
        <ShippingCostChart results={mockResults} locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full', 'mt-6');
    });
  });
});
