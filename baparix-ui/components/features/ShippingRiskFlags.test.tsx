import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ShippingRiskFlags,
  RiskFlag,
  HIGH_RISK_CATEGORIES,
} from './ShippingRiskFlags';

describe('ShippingRiskFlags', () => {
  const mockRiskFlags: RiskFlag[] = [
    {
      type: 'seizure',
      severity: 'high',
      description: 'Electronics are frequently inspected and may be seized.',
    },
    {
      type: 'delay',
      severity: 'medium',
      description: 'May face inspection delays at customs.',
    },
    {
      type: 'damage',
      severity: 'low',
      description: 'Minor risk of damage during handling.',
    },
  ];

  describe('Rendering with explicit riskFlags', () => {
    it('should render the risk flags title', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      expect(screen.getByText('riskFlags.title')).toBeInTheDocument();
    });

    it('should render all provided risk flags', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      expect(screen.getByText('Electronics are frequently inspected and may be seized.')).toBeInTheDocument();
      expect(screen.getByText('May face inspection delays at customs.')).toBeInTheDocument();
      expect(screen.getByText('Minor risk of damage during handling.')).toBeInTheDocument();
    });

    it('should display severity badges for each flag', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      expect(screen.getByText('riskFlags.severity.high')).toBeInTheDocument();
      expect(screen.getByText('riskFlags.severity.medium')).toBeInTheDocument();
      expect(screen.getByText('riskFlags.severity.low')).toBeInTheDocument();
    });

    it('should display risk type badges for each flag', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      expect(screen.getByText('riskFlags.types.seizure')).toBeInTheDocument();
      expect(screen.getByText('riskFlags.types.delay')).toBeInTheDocument();
      expect(screen.getByText('riskFlags.types.damage')).toBeInTheDocument();
    });

    it('should display the disclaimer text', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      expect(screen.getByText('riskFlags.disclaimer')).toBeInTheDocument();
    });
  });

  describe('Rendering from product category', () => {
    it('should derive risk flags from electronics category', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          locale="en"
        />
      );
      // Electronics has seizure and damage flags
      expect(screen.getByText(HIGH_RISK_CATEGORIES.electronics[0].description)).toBeInTheDocument();
      expect(screen.getByText(HIGH_RISK_CATEGORIES.electronics[1].description)).toBeInTheDocument();
    });

    it('should derive risk flags from chemicals category', () => {
      render(
        <ShippingRiskFlags
          productCategory="chemicals"
          locale="en"
        />
      );
      expect(screen.getByText(HIGH_RISK_CATEGORIES.chemicals[0].description)).toBeInTheDocument();
      expect(screen.getByText(HIGH_RISK_CATEGORIES.chemicals[1].description)).toBeInTheDocument();
    });

    it('should derive risk flags from beauty category', () => {
      render(
        <ShippingRiskFlags
          productCategory="beauty"
          locale="en"
        />
      );
      expect(screen.getByText(HIGH_RISK_CATEGORIES.beauty[0].description)).toBeInTheDocument();
      expect(screen.getByText(HIGH_RISK_CATEGORIES.beauty[1].description)).toBeInTheDocument();
    });

    it('should return null for low-risk categories with no flags', () => {
      const { container } = render(
        <ShippingRiskFlags
          productCategory="fashion"
          locale="en"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should return null for "other" category with no flags', () => {
      const { container } = render(
        <ShippingRiskFlags
          productCategory="other"
          locale="en"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Empty state', () => {
    it('should return null when riskFlags is an empty array', () => {
      const { container } = render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={[]}
          locale="en"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have a list role with aria-label', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'riskFlags.ariaLabel');
    });

    it('should have listitem roles for each flag', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('should have aria-hidden on decorative icons', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Severity color coding', () => {
    it('should apply red background for high severity', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={[{ type: 'seizure', severity: 'high', description: 'High risk item' }]}
          locale="en"
        />
      );
      const item = screen.getByRole('listitem');
      expect(item.className).toContain('bg-red-50');
      expect(item.className).toContain('border-red-200');
    });

    it('should apply yellow background for medium severity', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={[{ type: 'delay', severity: 'medium', description: 'Medium risk item' }]}
          locale="en"
        />
      );
      const item = screen.getByRole('listitem');
      expect(item.className).toContain('bg-yellow-50');
      expect(item.className).toContain('border-yellow-200');
    });

    it('should apply green background for low severity', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={[{ type: 'damage', severity: 'low', description: 'Low risk item' }]}
          locale="en"
        />
      );
      const item = screen.getByRole('listitem');
      expect(item.className).toContain('bg-green-50');
      expect(item.className).toContain('border-green-200');
    });
  });

  describe('Locale support', () => {
    it('should render with Bengali locale', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="bn"
        />
      );
      expect(screen.getByText('riskFlags.title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(
        <ShippingRiskFlags
          productCategory="electronics"
          riskFlags={mockRiskFlags}
          locale="en"
        />
      );
      expect(screen.getByText('riskFlags.title')).toBeInTheDocument();
    });
  });
});
