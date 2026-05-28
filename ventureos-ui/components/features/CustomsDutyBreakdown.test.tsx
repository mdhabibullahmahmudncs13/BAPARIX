import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomsDutyBreakdown } from './CustomsDutyBreakdown';

describe('CustomsDutyBreakdown', () => {
  const defaultProps = {
    productCost: 10000,
    shippingCost: 2000,
    productCategory: 'electronics' as const,
    locale: 'en' as const,
  };

  describe('Rendering', () => {
    it('should render customs duty title', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('customsDuty.title')).toBeInTheDocument();
    });

    it('should render landed cost title', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('landedCost.title')).toBeInTheDocument();
    });

    it('should render product category badge', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('categories.electronics')).toBeInTheDocument();
    });

    it('should render NBR duty rate', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      // Electronics rate is 31%
      expect(screen.getByText('31%')).toBeInTheDocument();
    });

    it('should render disclaimer text', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('customsDuty.disclaimer')).toBeInTheDocument();
    });
  });

  describe('Landed Cost Breakdown', () => {
    it('should display product cost label', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('landedCost.productCost')).toBeInTheDocument();
    });

    it('should display shipping cost label', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('landedCost.shippingCost')).toBeInTheDocument();
    });

    it('should display customs duty label', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('landedCost.customsDuty')).toBeInTheDocument();
    });

    it('should display agent fees label', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('landedCost.agentFees')).toBeInTheDocument();
    });

    it('should display total landed cost label', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('landedCost.total')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format amounts with BDT symbol', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      // Check that ৳ symbol is present in the rendered output
      const container = screen.getByText('landedCost.total').closest('div');
      expect(container?.textContent).toContain('৳');
    });

    it('should render with Bengali locale', () => {
      render(<CustomsDutyBreakdown {...defaultProps} locale="bn" />);
      expect(screen.getByText('customsDuty.title')).toBeInTheDocument();
    });
  });

  describe('Different Categories', () => {
    it('should show 45% rate for fashion category', () => {
      render(
        <CustomsDutyBreakdown
          {...defaultProps}
          productCategory="fashion"
        />
      );
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should show 12% rate for machinery category', () => {
      render(
        <CustomsDutyBreakdown
          {...defaultProps}
          productCategory="machinery"
        />
      );
      expect(screen.getByText('12%')).toBeInTheDocument();
    });

    it('should show 20% rate for food_beverage category', () => {
      render(
        <CustomsDutyBreakdown
          {...defaultProps}
          productCategory="food_beverage"
        />
      );
      expect(screen.getByText('20%')).toBeInTheDocument();
    });
  });

  describe('Custom Agent Fee Rate', () => {
    it('should display custom agent fee rate', () => {
      render(
        <CustomsDutyBreakdown
          {...defaultProps}
          agentFeeRate={0.10}
        />
      );
      expect(screen.getByText('(10%)')).toBeInTheDocument();
    });

    it('should display default 5% agent fee rate', () => {
      render(<CustomsDutyBreakdown {...defaultProps} />);
      expect(screen.getByText('(5%)')).toBeInTheDocument();
    });
  });
});
