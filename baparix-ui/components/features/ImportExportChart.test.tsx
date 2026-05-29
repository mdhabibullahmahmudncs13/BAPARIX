import { render, screen, fireEvent, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ImportExportChart } from './ImportExportChart';

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
    BarChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
      <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
      <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
    ),
    Bar: ({ dataKey, fill }: { dataKey: string; fill: string }) => (
      <div data-testid={`bar-${dataKey}`} data-fill={fill} />
    ),
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

const messages = {
  marketIntelligence: {
    importExport: {
      title: 'Import/Export Data',
      period: 'Period',
      '6months': '6 Months',
      '1year': '1 Year',
      chartType: 'Chart Type',
      lineChart: 'Line Chart',
      barChart: 'Bar Chart',
      imports: 'Imports',
      exports: 'Exports',
      volume: 'Volume (Units)',
      value: 'Value (৳)',
      month: 'Month',
      noData: 'No data available for the selected period',
      loading: 'Loading chart data...',
      tooltipVolume: 'Volume: {value} units',
      tooltipValue: 'Value: ৳{value}',
      months: {
        jan: 'Jan',
        feb: 'Feb',
        mar: 'Mar',
        apr: 'Apr',
        may: 'May',
        jun: 'Jun',
        jul: 'Jul',
        aug: 'Aug',
        sep: 'Sep',
        oct: 'Oct',
        nov: 'Nov',
        dec: 'Dec',
      },
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

describe('ImportExportChart', () => {
  describe('Rendering', () => {
    it('should render the component with default settings', () => {
      renderWithIntl(<ImportExportChart />);

      expect(screen.getByLabelText('period')).toBeInTheDocument();
      expect(screen.getByLabelText('chartType')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render period selector with correct options', () => {
      renderWithIntl(<ImportExportChart />);

      const periodSelect = screen.getByLabelText('period') as HTMLSelectElement;
      const options = within(periodSelect).getAllByRole('option');

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('6months');
      expect(options[1]).toHaveTextContent('1year');
    });

    it('should render chart type selector with correct options', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      const options = within(chartTypeSelect).getAllByRole('option');

      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('lineChart');
      expect(options[1]).toHaveTextContent('barChart');
    });

    it('should render line chart by default', () => {
      renderWithIntl(<ImportExportChart />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('should render legend with imports and exports labels', () => {
      renderWithIntl(<ImportExportChart />);

      expect(screen.getByText('imports')).toBeInTheDocument();
      expect(screen.getByText('exports')).toBeInTheDocument();
    });
  });

  describe('Period Toggle', () => {
    it('should default to 6 months period', () => {
      renderWithIntl(<ImportExportChart />);

      const periodSelect = screen.getByLabelText('period') as HTMLSelectElement;
      expect(periodSelect.value).toBe('6months');
    });

    it('should switch to 1 year period when selected', () => {
      renderWithIntl(<ImportExportChart />);

      const periodSelect = screen.getByLabelText('period') as HTMLSelectElement;
      fireEvent.change(periodSelect, { target: { value: '1year' } });

      expect(periodSelect.value).toBe('1year');
    });

    it('should display 6 data points for 6 months period', () => {
      renderWithIntl(<ImportExportChart />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(6);
    });

    it('should display 12 data points for 1 year period', () => {
      renderWithIntl(<ImportExportChart />);

      const periodSelect = screen.getByLabelText('period') as HTMLSelectElement;
      fireEvent.change(periodSelect, { target: { value: '1year' } });

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(12);
    });
  });

  describe('Chart Type Toggle', () => {
    it('should default to line chart', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      expect(chartTypeSelect.value).toBe('line');
    });

    it('should switch to bar chart when selected', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });

      expect(chartTypeSelect.value).toBe('bar');
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should switch back to line chart from bar chart', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      
      // Switch to bar chart
      fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

      // Switch back to line chart
      fireEvent.change(chartTypeSelect, { target: { value: 'line' } });
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });
  });

  describe('Color-blind Friendly Palette', () => {
    it('should use blue color for imports in line chart', () => {
      renderWithIntl(<ImportExportChart />);

      const importsLine = screen.getByTestId('line-imports');
      expect(importsLine.getAttribute('data-stroke')).toBe('#2563eb');
    });

    it('should use orange color for exports in line chart', () => {
      renderWithIntl(<ImportExportChart />);

      const exportsLine = screen.getByTestId('line-exports');
      expect(exportsLine.getAttribute('data-stroke')).toBe('#ea580c');
    });

    it('should use blue color for imports in bar chart', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });

      const importsBar = screen.getByTestId('bar-imports');
      expect(importsBar.getAttribute('data-fill')).toBe('#2563eb');
    });

    it('should use orange color for exports in bar chart', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });

      const exportsBar = screen.getByTestId('bar-exports');
      expect(exportsBar.getAttribute('data-fill')).toBe('#ea580c');
    });
  });

  describe('Data Structure', () => {
    it('should generate data with month, imports, and exports fields', () => {
      renderWithIntl(<ImportExportChart />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData.length).toBeGreaterThan(0);
      chartData.forEach((dataPoint: any) => {
        expect(dataPoint).toHaveProperty('month');
        expect(dataPoint).toHaveProperty('imports');
        expect(dataPoint).toHaveProperty('exports');
        expect(typeof dataPoint.imports).toBe('number');
        expect(typeof dataPoint.exports).toBe('number');
      });
    });

    it('should generate realistic data values', () => {
      renderWithIntl(<ImportExportChart />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      chartData.forEach((dataPoint: any) => {
        // Imports should be between 30000 and 80000
        expect(dataPoint.imports).toBeGreaterThanOrEqual(30000);
        expect(dataPoint.imports).toBeLessThanOrEqual(80000);
        
        // Exports should be between 20000 and 60000
        expect(dataPoint.exports).toBeGreaterThanOrEqual(20000);
        expect(dataPoint.exports).toBeLessThanOrEqual(60000);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      renderWithIntl(<ImportExportChart />);

      expect(screen.getByLabelText('period')).toBeInTheDocument();
      expect(screen.getByLabelText('chartType')).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative legend icons', () => {
      renderWithIntl(<ImportExportChart />);

      const container = screen.getByText('imports').closest('div')?.parentElement;
      const icons = container?.querySelectorAll('[aria-hidden="true"]');
      expect(icons).toBeDefined();
      expect(icons!.length).toBeGreaterThan(0);
    });

    it('should render chart components with proper structure', () => {
      renderWithIntl(<ImportExportChart />);

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render responsive container', () => {
      renderWithIntl(<ImportExportChart />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should apply responsive classes to controls', () => {
      renderWithIntl(<ImportExportChart />);

      const periodSelect = screen.getByLabelText('period');
      const controlsContainer = periodSelect.closest('div')?.parentElement?.parentElement;
      expect(controlsContainer).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to root element', () => {
      const { container } = renderWithIntl(<ImportExportChart className="custom-class" />);

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('custom-class');
    });

    it('should preserve default classes when custom className is provided', () => {
      const { container } = renderWithIntl(<ImportExportChart className="custom-class" />);

      const rootElement = container.firstChild as HTMLElement;
      expect(rootElement).toHaveClass('space-y-4', 'custom-class');
    });
  });

  describe('Integration', () => {
    it('should maintain chart type when switching periods', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      const periodSelect = screen.getByLabelText('period') as HTMLSelectElement;

      // Switch to bar chart
      fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

      // Change period
      fireEvent.change(periodSelect, { target: { value: '1year' } });

      // Chart type should still be bar
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });

    it('should maintain period when switching chart types', () => {
      renderWithIntl(<ImportExportChart />);

      const chartTypeSelect = screen.getByLabelText('chartType') as HTMLSelectElement;
      const periodSelect = screen.getByLabelText('period') as HTMLSelectElement;

      // Switch to 1 year
      fireEvent.change(periodSelect, { target: { value: '1year' } });
      
      let lineChart = screen.getByTestId('line-chart');
      let chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(12);

      // Switch to bar chart
      fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });

      // Should still have 12 data points
      const barChart = screen.getByTestId('bar-chart');
      chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      expect(chartData).toHaveLength(12);
    });
  });
});
