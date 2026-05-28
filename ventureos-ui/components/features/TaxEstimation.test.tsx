import { render, screen } from '@testing-library/react';
import { TaxEstimation, calculateVAT, VAT_RATE } from './TaxEstimation';

describe('TaxEstimation', () => {
  describe('Rendering', () => {
    it('renders the component title', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('renders the tax estimation container', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByTestId('tax-estimation')).toBeInTheDocument();
    });

    it('displays total revenue', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByTestId('tax-total-revenue')).toBeInTheDocument();
    });

    it('displays taxable amount', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByTestId('tax-taxable-amount')).toBeInTheDocument();
    });

    it('displays estimated VAT amount', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByTestId('tax-estimated-vat')).toBeInTheDocument();
    });

    it('displays the 15% rate badge', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByText(/15%/)).toBeInTheDocument();
    });

    it('displays NBR filing reminder', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByTestId('nbr-filing-reminder')).toBeInTheDocument();
      expect(screen.getByText('nbrReminder')).toBeInTheDocument();
    });

    it('displays NBR reminder detail text', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      expect(screen.getByText('nbrReminderDetail')).toBeInTheDocument();
    });
  });

  describe('Zero revenue', () => {
    it('renders correctly with zero revenue', () => {
      render(<TaxEstimation totalRevenue={0} locale="en" />);
      expect(screen.getByTestId('tax-estimation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('NBR reminder has role="note"', () => {
      render(<TaxEstimation totalRevenue={100000} locale="en" />);
      const reminder = screen.getByTestId('nbr-filing-reminder');
      expect(reminder).toHaveAttribute('role', 'note');
    });

    it('decorative icons have aria-hidden', () => {
      const { container } = render(<TaxEstimation totalRevenue={100000} locale="en" />);
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Custom className', () => {
    it('applies custom className to the card', () => {
      const { container } = render(
        <TaxEstimation totalRevenue={100000} locale="en" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('calculateVAT', () => {
  it('calculates VAT at 15% rate', () => {
    const result = calculateVAT(100000);
    expect(result.estimatedVAT).toBe(15000);
  });

  it('returns taxable amount equal to total revenue', () => {
    const result = calculateVAT(50000);
    expect(result.taxableAmount).toBe(50000);
  });

  it('returns effective rate of 0.15', () => {
    const result = calculateVAT(100000);
    expect(result.effectiveRate).toBe(0.15);
  });

  it('handles zero revenue', () => {
    const result = calculateVAT(0);
    expect(result.estimatedVAT).toBe(0);
    expect(result.taxableAmount).toBe(0);
  });

  it('handles large revenue amounts', () => {
    const result = calculateVAT(10000000);
    expect(result.estimatedVAT).toBe(1500000);
  });
});

describe('VAT_RATE constant', () => {
  it('is set to 0.15 (15%)', () => {
    expect(VAT_RATE).toBe(0.15);
  });
});
