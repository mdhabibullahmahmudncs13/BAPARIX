import { render, screen } from '@testing-library/react';
import {
  BreakEvenProgress,
  calculateBreakEvenPercentage,
  getProgressColor,
} from './BreakEvenProgress';

describe('BreakEvenProgress', () => {
  describe('Rendering', () => {
    it('renders the component title', () => {
      render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('renders the progress container', () => {
      render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-progress')).toBeInTheDocument();
    });

    it('displays current revenue', () => {
      render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-current')).toBeInTheDocument();
    });

    it('displays break-even target', () => {
      render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-target')).toBeInTheDocument();
    });

    it('displays percentage complete', () => {
      render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-percentage')).toHaveTextContent('50%');
    });

    it('renders the progress bar', () => {
      render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-bar')).toBeInTheDocument();
    });
  });

  describe('Progress states', () => {
    it('shows 0% when no revenue', () => {
      render(
        <BreakEvenProgress currentRevenue={0} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-percentage')).toHaveTextContent('0%');
    });

    it('shows 100% when break-even is achieved', () => {
      render(
        <BreakEvenProgress currentRevenue={100000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-percentage')).toHaveTextContent('100%');
    });

    it('caps at 100% when revenue exceeds target', () => {
      render(
        <BreakEvenProgress currentRevenue={150000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByTestId('break-even-percentage')).toHaveTextContent('100%');
    });

    it('shows achieved message when break-even is reached', () => {
      render(
        <BreakEvenProgress currentRevenue={100000} breakEvenTarget={100000} locale="en" />
      );
      expect(screen.getByText('achieved')).toBeInTheDocument();
    });

    it('shows estimated time when not yet at break-even', () => {
      render(
        <BreakEvenProgress
          currentRevenue={50000}
          breakEvenTarget={100000}
          estimatedDaysToBreakEven={45}
          locale="en"
        />
      );
      expect(screen.getByTestId('break-even-status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('progress bar has correct ARIA attributes', () => {
      render(
        <BreakEvenProgress currentRevenue={75000} breakEvenTarget={100000} locale="en" />
      );
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'progressLabel');
    });

    it('decorative icons have aria-hidden', () => {
      const { container } = render(
        <BreakEvenProgress currentRevenue={50000} breakEvenTarget={100000} locale="en" />
      );
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the card', () => {
      const { container } = render(
        <BreakEvenProgress
          currentRevenue={50000}
          breakEvenTarget={100000}
          locale="en"
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('calculateBreakEvenPercentage', () => {
  it('calculates correct percentage', () => {
    expect(calculateBreakEvenPercentage(50000, 100000)).toBe(50);
    expect(calculateBreakEvenPercentage(25000, 100000)).toBe(25);
    expect(calculateBreakEvenPercentage(75000, 100000)).toBe(75);
  });

  it('caps at 100% when revenue exceeds target', () => {
    expect(calculateBreakEvenPercentage(150000, 100000)).toBe(100);
  });

  it('returns 0% when no revenue', () => {
    expect(calculateBreakEvenPercentage(0, 100000)).toBe(0);
  });

  it('returns 100% when target is zero', () => {
    expect(calculateBreakEvenPercentage(50000, 0)).toBe(100);
  });

  it('returns 100% when target is negative', () => {
    expect(calculateBreakEvenPercentage(50000, -1000)).toBe(100);
  });

  it('handles exact break-even', () => {
    expect(calculateBreakEvenPercentage(100000, 100000)).toBe(100);
  });
});

describe('getProgressColor', () => {
  it('returns green for 100%', () => {
    expect(getProgressColor(100)).toBe('bg-green-500');
  });

  it('returns blue for 75-99%', () => {
    expect(getProgressColor(75)).toBe('bg-blue-500');
    expect(getProgressColor(99)).toBe('bg-blue-500');
  });

  it('returns amber for 50-74%', () => {
    expect(getProgressColor(50)).toBe('bg-amber-500');
    expect(getProgressColor(74)).toBe('bg-amber-500');
  });

  it('returns red for below 50%', () => {
    expect(getProgressColor(0)).toBe('bg-red-500');
    expect(getProgressColor(49)).toBe('bg-red-500');
  });
});
