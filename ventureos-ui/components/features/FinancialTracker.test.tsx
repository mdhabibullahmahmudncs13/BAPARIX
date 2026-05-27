import { render, screen, fireEvent } from '@testing-library/react';
import { FinancialTracker } from './FinancialTracker';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';

// next-intl is globally mocked in jest.setup.ts to return the key as the value
// So t('title') renders "title", t('sections.revenueChart') renders "sections.revenueChart"

describe('FinancialTracker', () => {
  describe('Layout and Structure', () => {
    it('renders the dashboard title and subtitle', () => {
      render(<FinancialTracker locale="en" />);

      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });

    it('renders the time range selector', () => {
      render(<FinancialTracker locale="en" />);

      expect(screen.getByRole('group', { name: 'label' })).toBeInTheDocument();
      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });

    it('renders all four dashboard sections', () => {
      render(<FinancialTracker locale="en" />);

      expect(screen.getByText('sections.revenueChart')).toBeInTheDocument();
      expect(screen.getByText('sections.expenseChart')).toBeInTheDocument();
      expect(screen.getByText('sections.profitTable')).toBeInTheDocument();
      expect(screen.getByText('sections.alerts')).toBeInTheDocument();
    });

    it('renders placeholder content in each section', () => {
      render(<FinancialTracker locale="en" />);

      expect(screen.getByText('placeholders.revenueChart')).toBeInTheDocument();
      expect(screen.getByText('placeholders.expenseChart')).toBeInTheDocument();
      expect(screen.getByText('placeholders.profitTable')).toBeInTheDocument();
      expect(screen.getByText('placeholders.alerts')).toBeInTheDocument();
    });

    it('renders placeholder slots with test IDs', () => {
      render(<FinancialTracker locale="en" />);

      expect(screen.getByTestId('revenue-chart-slot')).toBeInTheDocument();
      expect(screen.getByTestId('expense-chart-slot')).toBeInTheDocument();
      expect(screen.getByTestId('profit-table-slot')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-slot')).toBeInTheDocument();
    });
  });

  describe('Responsive Grid', () => {
    it('uses responsive grid classes', () => {
      const { container } = render(<FinancialTracker locale="en" />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('header uses responsive flex layout', () => {
      const { container } = render(<FinancialTracker locale="en" />);

      const header = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Time Range Interaction', () => {
    it('defaults to monthly time range', () => {
      render(<FinancialTracker locale="en" />);

      const monthlyButton = screen.getByText('monthly');
      expect(monthlyButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('allows switching time range to daily', () => {
      render(<FinancialTracker locale="en" />);

      const dailyButton = screen.getByText('daily');
      fireEvent.click(dailyButton);

      expect(dailyButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('monthly')).toHaveAttribute('aria-pressed', 'false');
    });

    it('allows switching time range to weekly', () => {
      render(<FinancialTracker locale="en" />);

      const weeklyButton = screen.getByText('weekly');
      fireEvent.click(weeklyButton);

      expect(weeklyButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Accessibility', () => {
    it('uses proper heading hierarchy', () => {
      const { container } = render(<FinancialTracker locale="en" />);

      const h2 = container.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent('title');

      const h3s = container.querySelectorAll('h3');
      expect(h3s.length).toBe(4);
    });

    it('decorative icons have aria-hidden', () => {
      const { container } = render(<FinancialTracker locale="en" />);

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it('time range selector has accessible group label', () => {
      render(<FinancialTracker locale="en" />);

      expect(screen.getByRole('group', { name: 'label' })).toBeInTheDocument();
    });
  });
});

describe('TimeRangeSelector', () => {
  const renderSelector = (value: TimeRange = 'monthly', onChange = jest.fn()) => {
    return render(<TimeRangeSelector value={value} onChange={onChange} />);
  };

  describe('Rendering', () => {
    it('renders all three time range options', () => {
      renderSelector();

      expect(screen.getByText('daily')).toBeInTheDocument();
      expect(screen.getByText('weekly')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });

    it('renders as a group with accessible label', () => {
      renderSelector();

      expect(screen.getByRole('group', { name: 'label' })).toBeInTheDocument();
    });

    it('marks the active option with aria-pressed', () => {
      renderSelector('weekly');

      expect(screen.getByText('daily')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('weekly')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('monthly')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Interaction', () => {
    it('calls onChange when a different option is clicked', () => {
      const onChange = jest.fn();
      renderSelector('monthly', onChange);

      fireEvent.click(screen.getByText('daily'));
      expect(onChange).toHaveBeenCalledWith('daily');
    });

    it('calls onChange with weekly when weekly is clicked', () => {
      const onChange = jest.fn();
      renderSelector('daily', onChange);

      fireEvent.click(screen.getByText('weekly'));
      expect(onChange).toHaveBeenCalledWith('weekly');
    });

    it('calls onChange with monthly when monthly is clicked', () => {
      const onChange = jest.fn();
      renderSelector('daily', onChange);

      fireEvent.click(screen.getByText('monthly'));
      expect(onChange).toHaveBeenCalledWith('monthly');
    });

    it('calls onChange even when clicking the already-active option', () => {
      const onChange = jest.fn();
      renderSelector('monthly', onChange);

      fireEvent.click(screen.getByText('monthly'));
      expect(onChange).toHaveBeenCalledWith('monthly');
    });
  });

  describe('Styling', () => {
    it('applies active styles to the selected button', () => {
      renderSelector('daily');

      const dailyButton = screen.getByText('daily');
      expect(dailyButton.className).toContain('bg-white');
      expect(dailyButton.className).toContain('text-blue-700');
    });

    it('applies inactive styles to non-selected buttons', () => {
      renderSelector('daily');

      const weeklyButton = screen.getByText('weekly');
      expect(weeklyButton.className).toContain('text-gray-600');
    });
  });

  describe('Accessibility', () => {
    it('all buttons are type="button" to prevent form submission', () => {
      renderSelector();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('buttons have focus ring styles for keyboard navigation', () => {
      renderSelector();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.className).toContain('focus:ring-2');
      });
    });
  });
});
