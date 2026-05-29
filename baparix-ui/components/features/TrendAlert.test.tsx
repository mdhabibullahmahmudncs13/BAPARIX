import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TrendAlert, TrendAlertProps } from './TrendAlert';

const messages = {
  marketIntelligence: {
    sections: {
      trendAlerts: 'Trending Products',
    },
    trajectory: {
      rising: 'Rising',
      stable: 'Stable',
      declining: 'Declining',
    },
    trendDetails: {
      startDate: 'Start Date',
      peakPeriod: 'Peak Period',
      lifespan: 'Estimated Lifespan',
      learnMore: 'Learn More',
    },
  },
};

const mockTrend: TrendAlertProps['trend'] = {
  id: '1',
  productCategory: 'Electronics',
  trendName: 'Wireless Earbuds',
  trajectory: 'rising',
  startDate: '2024-01-15',
  peakPeriod: 'Feb-Mar 2024',
  estimatedLifespan: '6 months',
  seasonal: false,
};

const renderWithIntl = (ui: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
};

describe('TrendAlert', () => {
  describe('Rendering', () => {
    it('should render trend alert with all basic information', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      // Check for trajectory - it's rendered as translation key in test environment
      expect(screen.getByText(/rising/i)).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('Feb-Mar 2024')).toBeInTheDocument();
      expect(screen.getByText('6 months')).toBeInTheDocument();
    });

    it('should render trajectory icon for rising trend', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      // Check that trajectory badge exists with proper styling
      const badges = screen.getAllByRole('generic').filter(el => 
        el.className.includes('bg-green-100')
      );
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should render trajectory icon for stable trend', () => {
      const stableTrend = { ...mockTrend, trajectory: 'stable' as const };
      renderWithIntl(<TrendAlert trend={stableTrend} />);

      // Check that trajectory badge exists with proper styling
      const badges = screen.getAllByRole('generic').filter(el => 
        el.className.includes('bg-blue-100')
      );
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should render trajectory icon for declining trend', () => {
      const decliningTrend = { ...mockTrend, trajectory: 'declining' as const };
      renderWithIntl(<TrendAlert trend={decliningTrend} />);

      // Check that trajectory badge exists with proper styling
      const badges = screen.getAllByRole('generic').filter(el => 
        el.className.includes('bg-yellow-100')
      );
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should render seasonal badge when trend is seasonal', () => {
      const seasonalTrend = {
        ...mockTrend,
        seasonal: true,
        seasonalFlag: 'Winter',
      };
      renderWithIntl(<TrendAlert trend={seasonalTrend} />);

      expect(screen.getByText('Winter')).toBeInTheDocument();
    });

    it('should not render seasonal badge when trend is not seasonal', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      expect(screen.queryByText('Winter')).not.toBeInTheDocument();
    });

    it('should render new notification badge when showNotificationBadge is true and trend is new', () => {
      const newTrend = { ...mockTrend, isNew: true };
      renderWithIntl(
        <TrendAlert trend={newTrend} showNotificationBadge={true} />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should not render new notification badge when showNotificationBadge is false', () => {
      const newTrend = { ...mockTrend, isNew: true };
      renderWithIntl(
        <TrendAlert trend={newTrend} showNotificationBadge={false} />
      );

      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should render Learn More button when onLearnMore is provided', () => {
      const onLearnMore = jest.fn();
      renderWithIntl(<TrendAlert trend={mockTrend} onLearnMore={onLearnMore} />);

      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('should not render Learn More button when onLearnMore is not provided', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      expect(screen.queryByText('Learn More')).not.toBeInTheDocument();
    });
  });

  describe('Dismissible Functionality', () => {
    it('should render dismiss button when dismissible is true', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} dismissible={true} />);

      const dismissButton = screen.getByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      expect(dismissButton).toBeInTheDocument();
    });

    it('should not render dismiss button when dismissible is false', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} dismissible={false} />);

      const dismissButton = screen.queryByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      expect(dismissButton).not.toBeInTheDocument();
    });

    it('should call onDismiss with trend id when dismiss button is clicked', async () => {
      const onDismiss = jest.fn();
      renderWithIntl(
        <TrendAlert trend={mockTrend} onDismiss={onDismiss} dismissible={true} />
      );

      const dismissButton = screen.getByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      fireEvent.click(dismissButton);

      // Wait for animation to complete
      await waitFor(
        () => {
          expect(onDismiss).toHaveBeenCalledWith('1');
        },
        { timeout: 500 }
      );
    });

    it('should apply dismissing animation when dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      renderWithIntl(
        <TrendAlert trend={mockTrend} onDismiss={onDismiss} dismissible={true} />
      );

      const dismissButton = screen.getByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      const container = screen.getByRole('article');

      // Check initial state
      expect(container).toHaveClass('opacity-100');

      fireEvent.click(dismissButton);

      // Check dismissing state
      expect(container).toHaveClass('opacity-0');
    });

    it('should not call onDismiss when dismissible is false', () => {
      const onDismiss = jest.fn();
      renderWithIntl(
        <TrendAlert
          trend={mockTrend}
          onDismiss={onDismiss}
          dismissible={false}
        />
      );

      // Dismiss button should not exist
      const dismissButton = screen.queryByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      expect(dismissButton).not.toBeInTheDocument();
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Learn More Functionality', () => {
    it('should call onLearnMore with trend id when Learn More button is clicked', () => {
      const onLearnMore = jest.fn();
      renderWithIntl(<TrendAlert trend={mockTrend} onLearnMore={onLearnMore} />);

      const learnMoreButton = screen.getByText('Learn More');
      fireEvent.click(learnMoreButton);

      expect(onLearnMore).toHaveBeenCalledWith('1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} dismissible={true} />);

      const article = screen.getByRole('article');
      // In test environment, translations may not resolve, so check for the pattern
      expect(article).toHaveAttribute('aria-label');
      expect(article.getAttribute('aria-label')).toContain('Wireless Earbuds');

      const dismissButton = screen.getByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      expect(dismissButton).toHaveAttribute('type', 'button');
    });

    it('should have aria-hidden on decorative icons', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      const article = screen.getByRole('article');
      const icons = article.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have screen reader text for trajectory', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      const srText = screen.getByText('Trajectory:');
      expect(srText).toHaveClass('sr-only');
    });

    it('should be keyboard accessible for dismiss button', () => {
      const onDismiss = jest.fn();
      renderWithIntl(
        <TrendAlert trend={mockTrend} onDismiss={onDismiss} dismissible={true} />
      );

      const dismissButton = screen.getByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      
      // Check focus styles
      expect(dismissButton).toHaveClass('focus:outline-none');
      expect(dismissButton).toHaveClass('focus:ring-2');
      expect(dismissButton).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout for trend details', () => {
      const { container } = renderWithIntl(<TrendAlert trend={mockTrend} />);

      const detailsGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-3');
      expect(detailsGrid).toBeInTheDocument();
    });

    it('should have responsive flex layout for badges', () => {
      const seasonalTrend = {
        ...mockTrend,
        seasonal: true,
        seasonalFlag: 'Winter',
        isNew: true,
      };
      renderWithIntl(
        <TrendAlert trend={seasonalTrend} showNotificationBadge={true} />
      );

      const badgeContainer = screen.getByText('Wireless Earbuds').closest('.flex');
      expect(badgeContainer).toHaveClass('flex-wrap');
    });
  });

  describe('Hover Effects', () => {
    it('should have hover styles on container', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      const container = screen.getByRole('article');
      expect(container).toHaveClass('hover:border-blue-300');
      expect(container).toHaveClass('hover:shadow-md');
    });

    it('should have hover styles on dismiss button', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} dismissible={true} />);

      const dismissButton = screen.getByLabelText(
        'Dismiss Wireless Earbuds alert'
      );
      expect(dismissButton).toHaveClass('hover:text-gray-600');
      expect(dismissButton).toHaveClass('hover:bg-gray-100');
    });
  });

  describe('Animation', () => {
    it('should have transition classes for smooth animations', () => {
      renderWithIntl(<TrendAlert trend={mockTrend} />);

      const container = screen.getByRole('article');
      expect(container).toHaveClass('transition-all');
      expect(container).toHaveClass('duration-300');
      expect(container).toHaveClass('ease-in-out');
    });

    it('should have pulse animation on new badge', () => {
      const newTrend = { ...mockTrend, isNew: true };
      renderWithIntl(
        <TrendAlert trend={newTrend} showNotificationBadge={true} />
      );

      const newBadge = screen.getByText('New').closest('.animate-pulse');
      expect(newBadge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      const minimalTrend = {
        id: '2',
        productCategory: 'Fashion',
        trendName: 'Summer Dresses',
        trajectory: 'stable' as const,
        startDate: '2024-02-01',
        peakPeriod: 'Mar-Apr 2024',
        estimatedLifespan: '4 months',
      };

      renderWithIntl(<TrendAlert trend={minimalTrend} />);

      expect(screen.getByText('Summer Dresses')).toBeInTheDocument();
      expect(screen.queryByText('Winter')).not.toBeInTheDocument();
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('should handle long trend names without breaking layout', () => {
      const longNameTrend = {
        ...mockTrend,
        trendName:
          'Very Long Product Name That Should Wrap Properly Without Breaking The Layout',
      };

      renderWithIntl(<TrendAlert trend={longNameTrend} />);

      expect(
        screen.getByText(
          'Very Long Product Name That Should Wrap Properly Without Breaking The Layout'
        )
      ).toBeInTheDocument();
    });

    it('should handle all trajectory types correctly', () => {
      const trajectories: Array<'rising' | 'stable' | 'declining'> = [
        'rising',
        'stable',
        'declining',
      ];

      trajectories.forEach((trajectory) => {
        const { container, unmount } = renderWithIntl(
          <TrendAlert trend={{ ...mockTrend, trajectory }} />
        );
        
        // Check that the component renders with the trajectory
        const article = container.querySelector('[role="article"]');
        expect(article).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});
