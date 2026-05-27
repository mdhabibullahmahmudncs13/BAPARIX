import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  SeasonalWarnings,
  SeasonalWarning,
  SEASONAL_DELAY_PERIODS,
  getActiveSeasonalWarnings,
} from './SeasonalWarnings';

describe('SeasonalWarnings', () => {
  const mockWarnings: SeasonalWarning[] = [
    {
      period: 'Eid ul-Fitr',
      impact: 'Expect 5-10 day delays due to reduced customs operations.',
    },
    {
      period: 'Chinese New Year',
      impact: 'Expect 14-21 day delays for shipments from China.',
    },
    {
      period: 'Port Congestion (Chittagong)',
      impact: 'Chittagong port congestion causing 3-7 day delays.',
    },
  ];

  describe('Rendering with explicit warnings', () => {
    it('should render the seasonal warnings title', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      expect(screen.getByText('seasonalWarnings.title')).toBeInTheDocument();
    });

    it('should render all provided warnings', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      expect(screen.getByText('Expect 5-10 day delays due to reduced customs operations.')).toBeInTheDocument();
      expect(screen.getByText('Expect 14-21 day delays for shipments from China.')).toBeInTheDocument();
      expect(screen.getByText('Chittagong port congestion causing 3-7 day delays.')).toBeInTheDocument();
    });

    it('should display period badges for each warning', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      expect(screen.getByText('Eid ul-Fitr')).toBeInTheDocument();
      expect(screen.getByText('Chinese New Year')).toBeInTheDocument();
      expect(screen.getByText('Port Congestion (Chittagong)')).toBeInTheDocument();
    });

    it('should display the disclaimer text', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      expect(screen.getByText('seasonalWarnings.disclaimer')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should return null when seasonalWarnings is an empty array', () => {
      const { container } = render(
        <SeasonalWarnings
          seasonalWarnings={[]}
          locale="en"
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have a list role with aria-label', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'seasonalWarnings.ariaLabel');
    });

    it('should have listitem roles for each warning', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('should have aria-hidden on decorative icons', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('Locale support', () => {
    it('should render with Bengali locale', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="bn"
        />
      );
      expect(screen.getByText('seasonalWarnings.title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(
        <SeasonalWarnings
          seasonalWarnings={mockWarnings}
          locale="en"
        />
      );
      expect(screen.getByText('seasonalWarnings.title')).toBeInTheDocument();
    });
  });
});

describe('SEASONAL_DELAY_PERIODS', () => {
  it('should contain Eid ul-Fitr warning', () => {
    const eidWarning = SEASONAL_DELAY_PERIODS.find(w => w.period === 'Eid ul-Fitr');
    expect(eidWarning).toBeDefined();
    expect(eidWarning!.impact).toContain('delay');
  });

  it('should contain Eid ul-Adha warning', () => {
    const eidWarning = SEASONAL_DELAY_PERIODS.find(w => w.period === 'Eid ul-Adha');
    expect(eidWarning).toBeDefined();
    expect(eidWarning!.impact).toContain('delay');
  });

  it('should contain Chinese New Year warning', () => {
    const cnyWarning = SEASONAL_DELAY_PERIODS.find(w => w.period === 'Chinese New Year');
    expect(cnyWarning).toBeDefined();
    expect(cnyWarning!.impact).toContain('delay');
  });

  it('should contain Port Congestion warning', () => {
    const portWarning = SEASONAL_DELAY_PERIODS.find(w => w.period.includes('Port Congestion'));
    expect(portWarning).toBeDefined();
    expect(portWarning!.impact).toContain('delay');
  });
});

describe('getActiveSeasonalWarnings', () => {
  it('should return Chinese New Year warning in January', () => {
    const january = new Date(2024, 0, 15); // January 15
    const warnings = getActiveSeasonalWarnings(january);
    const cnyWarning = warnings.find(w => w.period === 'Chinese New Year');
    expect(cnyWarning).toBeDefined();
  });

  it('should return Chinese New Year warning in February', () => {
    const february = new Date(2024, 1, 10); // February 10
    const warnings = getActiveSeasonalWarnings(february);
    const cnyWarning = warnings.find(w => w.period === 'Chinese New Year');
    expect(cnyWarning).toBeDefined();
  });

  it('should return Eid ul-Fitr warning in April', () => {
    const april = new Date(2024, 3, 10); // April 10
    const warnings = getActiveSeasonalWarnings(april);
    const eidWarning = warnings.find(w => w.period === 'Eid ul-Fitr');
    expect(eidWarning).toBeDefined();
  });

  it('should return Eid ul-Adha warning in June', () => {
    const june = new Date(2024, 5, 15); // June 15
    const warnings = getActiveSeasonalWarnings(june);
    const eidWarning = warnings.find(w => w.period === 'Eid ul-Adha');
    expect(eidWarning).toBeDefined();
  });

  it('should return Port Congestion warning during monsoon season (July)', () => {
    const july = new Date(2024, 6, 15); // July 15
    const warnings = getActiveSeasonalWarnings(july);
    const portWarning = warnings.find(w => w.period.includes('Port Congestion'));
    expect(portWarning).toBeDefined();
  });

  it('should return Port Congestion warning during peak import season (November)', () => {
    const november = new Date(2024, 10, 15); // November 15
    const warnings = getActiveSeasonalWarnings(november);
    const portWarning = warnings.find(w => w.period.includes('Port Congestion'));
    expect(portWarning).toBeDefined();
  });

  it('should not return Chinese New Year warning in June', () => {
    const june = new Date(2024, 5, 15); // June 15
    const warnings = getActiveSeasonalWarnings(june);
    const cnyWarning = warnings.find(w => w.period === 'Chinese New Year');
    expect(cnyWarning).toBeUndefined();
  });

  it('should not return Eid ul-Fitr warning in January', () => {
    const january = new Date(2024, 0, 15); // January 15
    const warnings = getActiveSeasonalWarnings(january);
    const eidWarning = warnings.find(w => w.period === 'Eid ul-Fitr');
    expect(eidWarning).toBeUndefined();
  });

  it('should return empty array in March (no active warnings)', () => {
    const march = new Date(2024, 2, 15); // March 15
    const warnings = getActiveSeasonalWarnings(march);
    expect(warnings).toHaveLength(0);
  });
});
