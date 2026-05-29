import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ImportSalesChart, ImportSalesDataPoint } from './ImportSalesChart';

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    ComposedChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
      <div data-testid="composed-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Line: ({ dataKey, stroke, strokeWidth }: { dataKey: string; stroke: string; strokeWidth: number }) => (
      <div data-testid={`line-${dataKey}`} data-stroke={stroke} data-stroke-width={strokeWidth} />
    ),
    Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => (
      <div data-testid={`bar-${dataKey}`} data-fill={fill} />
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => (
      <div data-testid="x-axis" data-key={dataKey} />
    ),
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

const messages = {
  importSalesChart: {
    title: 'Import & Sales Tracking',
    ariaLabel: 'Combined chart showing import costs as bars and sales as a line over time',
    yAxisLabel: 'Amount (৳)',
    noData: 'No import or sales data available to display.',
    loading: 'Loading import and sales data...',
    imports: 'Import Costs',
    sales: 'Sales Revenue',
    dateLabel: 'Date',
  },
};

const mockData: ImportSalesDataPoint[] = [
  { date: '2024-01-01', imports: 120000, sales: 180000 },
  { date: '2024-02-01', imports: 135000, sales: 210000 },
  { date: '2024-03-01', imports: 110000, sales: 195000 },
  { date: '2024-04-01', imports: 145000, sales: 240000 },
  { date: '2024-05-01', imports: 130000, sales: 225000 },
  { date: '2024-06-01', imports: 155000, sales: 270000 },
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('ImportSalesChart', () => {
  describe('Rendering', () => {
    it('should render the chart title', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render the composed chart with data', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render chart axes and grid', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('should render tooltip component', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render legend component', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should use date as X-axis data key', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis.getAttribute('data-key')).toBe('date');
    });
  });

  describe('Combined Chart - Line for Sales, Bar for Imports', () => {
    it('should render a line for sales data', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('line-sales')).toBeInTheDocument();
    });

    it('should render a bar for imports data', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('bar-imports')).toBeInTheDocument();
    });

    it('should display both datasets on the same time axis', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const chart = screen.getByTestId('composed-chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(6);
      chartData.forEach((point: any) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('imports');
        expect(point).toHaveProperty('sales');
      });
    });
  });

  describe('Color-blind Friendly Palette', () => {
    it('should use blue color for imports bar', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const importsBar = screen.getByTestId('bar-imports');
      expect(importsBar.getAttribute('data-fill')).toBe('#2563eb');
    });

    it('should use green color for sales line', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const salesLine = screen.getByTestId('line-sales');
      expect(salesLine.getAttribute('data-stroke')).toBe('#16a34a');
    });

    it('should have appropriate stroke width for sales line visibility', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const salesLine = screen.getByTestId('line-sales');
      expect(Number(salesLine.getAttribute('data-stroke-width'))).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Data Handling', () => {
    it('should pass correct chart data', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const chart = screen.getByTestId('composed-chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(6);
      expect(chartData[0].date).toBe('2024-01-01');
      expect(chartData[0].imports).toBe(120000);
      expect(chartData[0].sales).toBe(180000);
    });

    it('should handle single data point correctly', () => {
      renderWithIntl(<ImportSalesChart data={[mockData[0]]} locale="en" />);

      const chart = screen.getByTestId('composed-chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(1);
      expect(chartData[0].imports).toBe(120000);
      expect(chartData[0].sales).toBe(180000);
    });
  });

  describe('Empty State', () => {
    it('should display no data message when data is empty', () => {
      renderWithIntl(<ImportSalesChart data={[]} locale="en" />);

      expect(screen.getByTestId('import-sales-chart-empty')).toBeInTheDocument();
    });

    it('should not render composed chart when data is empty', () => {
      renderWithIntl(<ImportSalesChart data={[]} locale="en" />);

      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when data is empty', () => {
      renderWithIntl(<ImportSalesChart data={[]} locale="en" />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      renderWithIntl(<ImportSalesChart data={[]} locale="en" isLoading={true} />);

      expect(screen.getByTestId('import-sales-chart-loading')).toBeInTheDocument();
    });

    it('should not render composed chart when loading', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" isLoading={true} />);

      expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when loading', () => {
      renderWithIntl(<ImportSalesChart data={[]} locale="en" isLoading={true} />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Locale Support', () => {
    it('should accept bn locale prop', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="bn" />);

      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('should accept en locale prop', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('should render chart data regardless of locale', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="bn" />);

      const chart = screen.getByTestId('composed-chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(6);
    });
  });

  describe('Accessibility', () => {
    it('should have role=img on the chart container', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should have an aria-label on the chart container', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toHaveAttribute('aria-label');
    });

    it('should render a heading for the chart title', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render within a ResponsiveContainer', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should apply w-full class for responsive width', () => {
      const { container } = renderWithIntl(
        <ImportSalesChart data={mockData} locale="en" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full');
    });

    it('should have a fixed height chart container', () => {
      renderWithIntl(<ImportSalesChart data={mockData} locale="en" />);

      const chartWrapper = screen.getByRole('img');
      expect(chartWrapper).toHaveClass('h-80');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = renderWithIntl(
        <ImportSalesChart data={mockData} locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('mt-6');
    });

    it('should preserve default classes when custom className is provided', () => {
      const { container } = renderWithIntl(
        <ImportSalesChart data={mockData} locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full', 'mt-6');
    });
  });
});
