import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SubscriptionTierComparison,
  getDefaultTiers,
  formatTierPrice,
} from './SubscriptionTierComparison';

describe('SubscriptionTierComparison', () => {
  describe('Rendering', () => {
    it('renders the component with title and subtitle', () => {
      render(<SubscriptionTierComparison locale="en" />);
      expect(screen.getByTestId('subscription-tier-comparison')).toBeInTheDocument();
      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });

    it('renders three tier cards', () => {
      render(<SubscriptionTierComparison locale="en" />);
      expect(screen.getByTestId('tier-header-free')).toBeInTheDocument();
      expect(screen.getByTestId('tier-header-pro')).toBeInTheDocument();
      expect(screen.getByTestId('tier-header-enterprise')).toBeInTheDocument();
    });

    it('renders the tier cards grid', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const grid = screen.getByTestId('tier-cards-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('displays the popular badge on Pro tier', () => {
      render(<SubscriptionTierComparison locale="en" />);
      expect(screen.getByText('popularBadge')).toBeInTheDocument();
    });

    it('renders feature lists for each tier', () => {
      render(<SubscriptionTierComparison locale="en" />);
      expect(screen.getByTestId('tier-features-free')).toBeInTheDocument();
      expect(screen.getByTestId('tier-features-pro')).toBeInTheDocument();
      expect(screen.getByTestId('tier-features-enterprise')).toBeInTheDocument();
    });

    it('renders select plan buttons for each tier', () => {
      render(<SubscriptionTierComparison locale="en" />);
      expect(screen.getByTestId('select-plan-free')).toBeInTheDocument();
      expect(screen.getByTestId('select-plan-pro')).toBeInTheDocument();
      expect(screen.getByTestId('select-plan-enterprise')).toBeInTheDocument();
    });

    it('renders the feature comparison table', () => {
      render(<SubscriptionTierComparison locale="en" />);
      expect(screen.getByTestId('feature-comparison-table')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SubscriptionTierComparison locale="en" className="custom-class" />);
      expect(screen.getByTestId('subscription-tier-comparison')).toHaveClass('custom-class');
    });
  });

  describe('Pricing Display', () => {
    it('displays Free tier with ৳0 price', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const freeHeader = screen.getByTestId('tier-header-free');
      expect(within(freeHeader).getByText('৳0')).toBeInTheDocument();
    });

    it('displays Pro tier with ৳999 price', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const proHeader = screen.getByTestId('tier-header-pro');
      expect(within(proHeader).getByText('৳999')).toBeInTheDocument();
    });

    it('displays Enterprise tier with ৳3,499 price', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const enterpriseHeader = screen.getByTestId('tier-header-enterprise');
      expect(within(enterpriseHeader).getByText('৳3,499')).toBeInTheDocument();
    });
  });

  describe('Feature Comparison', () => {
    it('renders 6 features per tier', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const freeFeatures = screen.getByTestId('tier-features-free');
      const items = within(freeFeatures).getAllByRole('listitem');
      expect(items).toHaveLength(6);
    });

    it('renders comparison table with correct number of rows', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      // 1 header row + 6 feature rows
      expect(rows).toHaveLength(7);
    });

    it('renders comparison table with 4 columns (feature + 3 tiers)', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const table = screen.getByRole('table');
      const headerCells = within(table).getAllByRole('columnheader');
      expect(headerCells).toHaveLength(4);
    });
  });

  describe('Interactions', () => {
    it('calls onSelectPlan with tier id when button is clicked', async () => {
      const user = userEvent.setup();
      const onSelectPlan = jest.fn();
      render(<SubscriptionTierComparison locale="en" onSelectPlan={onSelectPlan} />);

      await user.click(screen.getByTestId('select-plan-pro'));
      expect(onSelectPlan).toHaveBeenCalledWith('pro');
    });

    it('calls onSelectPlan with free tier id', async () => {
      const user = userEvent.setup();
      const onSelectPlan = jest.fn();
      render(<SubscriptionTierComparison locale="en" onSelectPlan={onSelectPlan} />);

      await user.click(screen.getByTestId('select-plan-free'));
      expect(onSelectPlan).toHaveBeenCalledWith('free');
    });

    it('calls onSelectPlan with enterprise tier id', async () => {
      const user = userEvent.setup();
      const onSelectPlan = jest.fn();
      render(<SubscriptionTierComparison locale="en" onSelectPlan={onSelectPlan} />);

      await user.click(screen.getByTestId('select-plan-enterprise'));
      expect(onSelectPlan).toHaveBeenCalledWith('enterprise');
    });

    it('does not throw when onSelectPlan is not provided', async () => {
      const user = userEvent.setup();
      render(<SubscriptionTierComparison locale="en" />);

      await expect(
        user.click(screen.getByTestId('select-plan-pro'))
      ).resolves.not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has a section with aria-labelledby', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const section = screen.getByTestId('subscription-tier-comparison');
      expect(section).toHaveAttribute('aria-labelledby', 'subscription-comparison-title');
    });

    it('has proper heading hierarchy', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBeGreaterThanOrEqual(3);
    });

    it('feature lists have aria-label', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const lists = screen.getAllByRole('list');
      lists.forEach((list) => {
        expect(list).toHaveAttribute('aria-label');
      });
    });

    it('select plan buttons have aria-label', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const buttons = [
        screen.getByTestId('select-plan-free'),
        screen.getByTestId('select-plan-pro'),
        screen.getByTestId('select-plan-enterprise'),
      ];
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('comparison table has aria-label', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label');
    });

    it('table headers have proper scope attributes', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('icons have aria-hidden attribute', () => {
      const { container } = render(<SubscriptionTierComparison locale="en" />);
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('grid uses responsive classes for mobile stacking', () => {
      render(<SubscriptionTierComparison locale="en" />);
      const grid = screen.getByTestId('tier-cards-grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-3');
    });
  });
});

describe('getDefaultTiers', () => {
  const mockT = (key: string) => key;

  it('returns 3 tiers', () => {
    const tiers = getDefaultTiers(mockT);
    expect(tiers).toHaveLength(3);
  });

  it('returns free, pro, and enterprise tiers', () => {
    const tiers = getDefaultTiers(mockT);
    expect(tiers[0].id).toBe('free');
    expect(tiers[1].id).toBe('pro');
    expect(tiers[2].id).toBe('enterprise');
  });

  it('sets correct prices', () => {
    const tiers = getDefaultTiers(mockT);
    expect(tiers[0].price).toBe(0);
    expect(tiers[1].price).toBe(999);
    expect(tiers[2].price).toBe(3499);
  });

  it('marks pro tier as popular', () => {
    const tiers = getDefaultTiers(mockT);
    expect(tiers[0].isPopular).toBe(false);
    expect(tiers[1].isPopular).toBe(true);
    expect(tiers[2].isPopular).toBe(false);
  });

  it('each tier has 6 features', () => {
    const tiers = getDefaultTiers(mockT);
    tiers.forEach((tier) => {
      expect(tier.features).toHaveLength(6);
    });
  });

  it('free tier has priority support not included', () => {
    const tiers = getDefaultTiers(mockT);
    const prioritySupport = tiers[0].features[5];
    expect(prioritySupport.included).toBe(false);
  });

  it('pro and enterprise tiers have all features included', () => {
    const tiers = getDefaultTiers(mockT);
    tiers[1].features.forEach((feature) => {
      expect(feature.included).toBe(true);
    });
    tiers[2].features.forEach((feature) => {
      expect(feature.included).toBe(true);
    });
  });
});

describe('formatTierPrice', () => {
  it('formats zero price for English locale', () => {
    expect(formatTierPrice(0, 'en')).toBe('৳0');
  });

  it('formats zero price for Bengali locale', () => {
    expect(formatTierPrice(0, 'bn')).toBe('৳০');
  });

  it('formats 999 price for English locale', () => {
    expect(formatTierPrice(999, 'en')).toBe('৳999');
  });

  it('formats 3499 price with comma separator for English locale', () => {
    expect(formatTierPrice(3499, 'en')).toBe('৳3,499');
  });

  it('formats price for Bengali locale with Bengali numerals', () => {
    const result = formatTierPrice(999, 'bn');
    expect(result).toContain('৳');
    // Bengali numerals for 999 are ৯৯৯
    expect(result).toContain('৯৯৯');
  });
});
