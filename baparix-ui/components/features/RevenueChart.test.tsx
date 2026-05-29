import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { RevenueChart, RevenueDataPoint } from './RevenueChart';

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
      <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Line: ({ dataKey, stroke, strokeWidth }: { dataKey: string; stroke: string; strokeWidth: number }) => (
      <div data-testid={`line-${dataKey}`} data-stroke={stroke} data-stroke-width={strokeWidth} />
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
  financialTracker: {
    revenueChart: {
      title: 'Revenue Over Time',
      ariaLabel: 'Line chart showing revenue over time',
      yAxisLabel: 'Revenue (৳)',
      noData: 'No revenue data available to display.',
      loading: 'Loading revenue data...',
      tooltipLabel: 'Revenue',
      dateLabel: 'Date',
    },
  },
};

const mockDailyData: RevenueDataPoint[] = [
  { date: '2024-01-01', revenue: 15000 },
  { date: '2024-01-02', revenue: 22000 },
  { date: '2024-01-03', revenue: 18500 },
  { date: '2024-01-04', revenue: 31000 },
  { date: '2024-01-05', revenue: 27500 },
  { date: '2024-01-06', revenue: 19000 },
  { date: '2024-01-07', revenue: 24000 },
];

const mockWeeklyData: RevenueDataPoint[] = [
  { date: '2024-01-01', revenue: 105000 },
  { date: '2024-01-08', revenue: 132000 },
  { date: '2024-01-15', revenue: 118000 },
  { date: '2024-01-22', revenue: 145000 },
];

const mockMonthlyData: RevenueDataPoint[] = [
  { date: '2024-01-01', revenue: 450000 },
  { date: '2024-02-01', revenue: 520000 },
  { date: '2024-03-01', revenue: 480000 },
  { date: '2024-04-01', revenue: 610000 },
  { date: '2024-05-01', revenue: 570000 },
  { date: '2024-06-01', revenue: 690000 },
];

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('RevenueChart', () => {
  describe('Rendering', () => {
    it('should render the chart title', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render the line chart with data', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render chart axes and grid', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('should render tooltip component', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should use date as X-axis data key', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const xAxis = screen.getByTestId('x-axis');
      expect(xAxis.getAttribute('data-key')).toBe('date');
    });

    it('should render a line for revenue data key', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('line-revenue')).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should pass correct chart data for daily view', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(7);
      chartData.forEach((point: any) => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('revenue');
        expect(typeof point.revenue).toBe('number');
      });
    });

    it('should pass correct chart data for weekly view', () => {
      renderWithIntl(
        <RevenueChart data={mockWeeklyData} timeRange="weekly" locale="en" />
      );

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(4);
      expect(chartData[0].date).toBe('2024-01-01');
      expect(chartData[0].revenue).toBe(105000);
    });

    it('should pass correct chart data for monthly view', () => {
      renderWithIntl(
        <RevenueChart data={mockMonthlyData} timeRange="monthly" locale="en" />
      );

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(6);
      expect(chartData[0].date).toBe('2024-01-01');
      expect(chartData[0].revenue).toBe(450000);
    });

    it('should handle single data point correctly', () => {
      renderWithIntl(
        <RevenueChart data={[mockDailyData[0]]} timeRange="daily" locale="en" />
      );

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(1);
      expect(chartData[0].date).toBe('2024-01-01');
      expect(chartData[0].revenue).toBe(15000);
    });
  });

  describe('Time Range Support', () => {
    it('should render chart with daily time range', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render chart with weekly time range', () => {
      renderWithIntl(
        <RevenueChart data={mockWeeklyData} timeRange="weekly" locale="en" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render chart with monthly time range', () => {
      renderWithIntl(
        <RevenueChart data={mockMonthlyData} timeRange="monthly" locale="en" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no data message when data is empty', () => {
      renderWithIntl(
        <RevenueChart data={[]} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('revenue-chart-empty')).toBeInTheDocument();
    });

    it('should not render line chart when data is empty', () => {
      renderWithIntl(
        <RevenueChart data={[]} timeRange="daily" locale="en" />
      );

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when data is empty', () => {
      renderWithIntl(
        <RevenueChart data={[]} timeRange="daily" locale="en" />
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      renderWithIntl(
        <RevenueChart data={[]} timeRange="daily" locale="en" isLoading={true} />
      );

      expect(screen.getByTestId('revenue-chart-loading')).toBeInTheDocument();
    });

    it('should not render line chart when loading', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" isLoading={true} />
      );

      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should still render the heading when loading', () => {
      renderWithIntl(
        <RevenueChart data={[]} timeRange="daily" locale="en" isLoading={true} />
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  describe('Color-blind Friendly Palette', () => {
    it('should use green color for the revenue line', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const line = screen.getByTestId('line-revenue');
      expect(line.getAttribute('data-stroke')).toBe('#16a34a');
    });

    it('should have appropriate stroke width for visibility', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const line = screen.getByTestId('line-revenue');
      expect(Number(line.getAttribute('data-stroke-width'))).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Locale Support', () => {
    it('should accept bn locale prop', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="bn" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should accept en locale prop', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render chart data regardless of locale', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="bn" />
      );

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(7);
    });
  });

  describe('Accessibility', () => {
    it('should have role=img on the chart container', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should have an aria-label on the chart container', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toHaveAttribute('aria-label');
    });

    it('should render a heading for the chart title', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render within a ResponsiveContainer', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should apply w-full class for responsive width', () => {
      const { container } = renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full');
    });

    it('should have a fixed height chart container', () => {
      renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" />
      );

      const chartWrapper = screen.getByRole('img');
      expect(chartWrapper).toHaveClass('h-80');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('mt-6');
    });

    it('should preserve default classes when custom className is provided', () => {
      const { container } = renderWithIntl(
        <RevenueChart data={mockDailyData} timeRange="daily" locale="en" className="mt-6" />
      );

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('w-full', 'mt-6');
    });
  });
});
