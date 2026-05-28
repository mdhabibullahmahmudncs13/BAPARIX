import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ContentGenerationTools,
  AdCopy,
  TikTokScript,
  PricePoint,
  UpsellSuggestion,
} from './ContentGenerationTools';

const mockAdCopies: AdCopy[] = [
  {
    platform: 'facebook',
    bengaliCopy: 'আপনার ব্যবসার জন্য সেরা পণ্য খুঁজুন',
    englishCopy: 'Find the best products for your business',
    headline: 'Summer Sale',
    callToAction: 'Shop Now',
  },
  {
    platform: 'instagram',
    bengaliCopy: 'নতুন কালেকশন এসেছে! এখনই অর্ডার করুন',
    englishCopy: 'New collection is here! Order now',
    headline: 'New Arrivals',
  },
];

const mockTikTokScripts: TikTokScript[] = [
  {
    title: 'Product Unboxing',
    hook: 'Wait until you see what just arrived from China...',
    middle: 'Show the product quality, packaging, and compare with local alternatives',
    cta: 'Link in bio for wholesale pricing!',
    estimatedDuration: '30s',
  },
  {
    title: 'Price Comparison',
    hook: 'You won\'t believe the price difference!',
    middle: 'Side by side comparison of import vs local pricing',
    cta: 'DM me for supplier details',
  },
];

const mockPricePoints: PricePoint[] = [
  {
    productName: 'Wireless Earbuds',
    suggestedPrice: 1500,
    competitorMin: 1200,
    competitorMax: 2500,
    competitorAvg: 1800,
    currency: 'BDT',
    confidence: 'high',
  },
  {
    productName: 'Phone Case',
    suggestedPrice: 350,
    competitorMin: 200,
    competitorMax: 800,
    competitorAvg: 450,
    currency: 'BDT',
    confidence: 'medium',
  },
];

const mockUpsellSuggestions: UpsellSuggestion[] = [
  {
    id: 'upsell-1',
    productName: 'Charging Cable',
    reason: 'Frequently bought together with earbuds',
    priceRange: { min: 150, max: 400, currency: 'BDT' },
    relevanceScore: 92,
    category: 'Accessories',
  },
  {
    id: 'upsell-2',
    productName: 'Screen Protector',
    reason: 'Complementary product for phone case buyers',
    priceRange: { min: 100, max: 300, currency: 'BDT' },
    relevanceScore: 85,
    category: 'Protection',
  },
  {
    id: 'upsell-3',
    productName: 'Power Bank',
    reason: 'Popular add-on for electronics buyers',
    priceRange: { min: 800, max: 2000, currency: 'BDT' },
    relevanceScore: 78,
    category: 'Electronics',
  },
];

describe('ContentGenerationTools', () => {
  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'loading');
    });

    it('should not render content sections when loading', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={mockTikTokScripts}
          pricePoints={mockPricePoints}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
          isLoading={true}
        />
      );
      expect(screen.queryByText('adCopy.title')).not.toBeInTheDocument();
      expect(screen.queryByText('tiktokScripts.title')).not.toBeInTheDocument();
      expect(screen.queryByText('pricePoints.title')).not.toBeInTheDocument();
      expect(screen.queryByText('upsell.title')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no results message when all data is empty', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('noResults')).toBeInTheDocument();
    });

    it('should not render any sections when in empty state', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('adCopy.title')).not.toBeInTheDocument();
      expect(screen.queryByText('tiktokScripts.title')).not.toBeInTheDocument();
      expect(screen.queryByText('pricePoints.title')).not.toBeInTheDocument();
      expect(screen.queryByText('upsell.title')).not.toBeInTheDocument();
    });
  });

  describe('Ad Copy Section', () => {
    it('should render ad copy section title', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('adCopy.title')).toBeInTheDocument();
    });

    it('should display language tabs for Bengali and English', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByRole('tab', { name: 'adCopy.bengaliTab' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'adCopy.englishTab' })).toBeInTheDocument();
    });

    it('should show Bengali copy by default', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('আপনার ব্যবসার জন্য সেরা পণ্য খুঁজুন')).toBeInTheDocument();
    });

    it('should switch to English copy when English tab is clicked', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'adCopy.englishTab' }));
      expect(screen.getByText('Find the best products for your business')).toBeInTheDocument();
    });

    it('should display platform badges', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('adCopy.platforms.facebook')).toBeInTheDocument();
      expect(screen.getByText('adCopy.platforms.instagram')).toBeInTheDocument();
    });

    it('should display headline when provided', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('Summer Sale')).toBeInTheDocument();
      expect(screen.getByText('New Arrivals')).toBeInTheDocument();
    });

    it('should display call to action when provided', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    it('should have proper tab ARIA attributes', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      const bengaliTab = screen.getByRole('tab', { name: 'adCopy.bengaliTab' });
      expect(bengaliTab).toHaveAttribute('aria-selected', 'true');
      expect(bengaliTab).toHaveAttribute('aria-controls', 'tabpanel-bengali');

      const englishTab = screen.getByRole('tab', { name: 'adCopy.englishTab' });
      expect(englishTab).toHaveAttribute('aria-selected', 'false');
      expect(englishTab).toHaveAttribute('aria-controls', 'tabpanel-english');
    });

    it('should not render ad copy section when adCopies is empty', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('adCopy.title')).not.toBeInTheDocument();
    });
  });

  describe('TikTok Scripts Section', () => {
    it('should render TikTok scripts section title', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('tiktokScripts.title')).toBeInTheDocument();
    });

    it('should display script titles', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('Product Unboxing')).toBeInTheDocument();
      expect(screen.getByText('Price Comparison')).toBeInTheDocument();
    });

    it('should display hook, middle, and CTA labels', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      const hookBadges = screen.getAllByText('tiktokScripts.hook');
      const middleBadges = screen.getAllByText('tiktokScripts.middle');
      const ctaBadges = screen.getAllByText('tiktokScripts.cta');
      expect(hookBadges).toHaveLength(2);
      expect(middleBadges).toHaveLength(2);
      expect(ctaBadges).toHaveLength(2);
    });

    it('should display script content for each section', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('Wait until you see what just arrived from China...')).toBeInTheDocument();
      expect(screen.getByText('Show the product quality, packaging, and compare with local alternatives')).toBeInTheDocument();
      expect(screen.getByText('Link in bio for wholesale pricing!')).toBeInTheDocument();
    });

    it('should display estimated duration when provided', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('30s')).toBeInTheDocument();
    });

    it('should not render TikTok section when tiktokScripts is empty', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('tiktokScripts.title')).not.toBeInTheDocument();
    });
  });

  describe('Price Points Section', () => {
    it('should render price points section title', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={mockPricePoints}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('pricePoints.title')).toBeInTheDocument();
    });

    it('should display product names', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={mockPricePoints}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('Phone Case')).toBeInTheDocument();
    });

    it('should display confidence badges', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={mockPricePoints}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('pricePoints.confidence.high')).toBeInTheDocument();
      expect(screen.getByText('pricePoints.confidence.medium')).toBeInTheDocument();
    });

    it('should display table with proper column headers', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={mockPricePoints}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('pricePoints.columns.product')).toBeInTheDocument();
      expect(screen.getByText('pricePoints.columns.suggested')).toBeInTheDocument();
      expect(screen.getByText('pricePoints.columns.competitorRange')).toBeInTheDocument();
      expect(screen.getByText('pricePoints.columns.competitorAvg')).toBeInTheDocument();
      expect(screen.getByText('pricePoints.columns.confidence')).toBeInTheDocument();
    });

    it('should have accessible table with aria-label', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={mockPricePoints}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByRole('grid', { name: 'pricePoints.tableAriaLabel' })).toBeInTheDocument();
    });

    it('should not render price points section when pricePoints is empty', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('pricePoints.title')).not.toBeInTheDocument();
    });
  });

  describe('Upsell Suggestions Section', () => {
    it('should render upsell suggestions section title', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('upsell.title')).toBeInTheDocument();
    });

    it('should display product names as cards', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('Charging Cable')).toBeInTheDocument();
      expect(screen.getByText('Screen Protector')).toBeInTheDocument();
      expect(screen.getByText('Power Bank')).toBeInTheDocument();
    });

    it('should display reasons for upsell', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('Frequently bought together with earbuds')).toBeInTheDocument();
      expect(screen.getByText('Complementary product for phone case buyers')).toBeInTheDocument();
      expect(screen.getByText('Popular add-on for electronics buyers')).toBeInTheDocument();
    });

    it('should display category badges', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('Accessories')).toBeInTheDocument();
      expect(screen.getByText('Protection')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should display relevance scores', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('should not render upsell section when upsellSuggestions is empty', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('upsell.title')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have section headings with proper ids for aria-labelledby', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={mockTikTokScripts}
          pricePoints={mockPricePoints}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(document.getElementById('ad-copy-heading')).toBeInTheDocument();
      expect(document.getElementById('tiktok-scripts-heading')).toBeInTheDocument();
      expect(document.getElementById('price-points-heading')).toBeInTheDocument();
      expect(document.getElementById('upsell-suggestions-heading')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={mockTikTokScripts}
          pricePoints={mockPricePoints}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('title');

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBe(4);
    });

    it('should have tablist with proper aria-label', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByRole('tablist', { name: 'adCopy.languageTabsAriaLabel' })).toBeInTheDocument();
    });

    it('should have tabpanel with proper role and aria attributes', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-bengali');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-bengali');
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={mockTikTokScripts}
          pricePoints={mockPricePoints}
          upsellSuggestions={mockUpsellSuggestions}
          locale="bn"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={mockTikTokScripts}
          pricePoints={mockPricePoints}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Partial Data', () => {
    it('should render only ad copy section when only adCopies provided', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={[]}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.getByText('adCopy.title')).toBeInTheDocument();
      expect(screen.queryByText('tiktokScripts.title')).not.toBeInTheDocument();
      expect(screen.queryByText('pricePoints.title')).not.toBeInTheDocument();
      expect(screen.queryByText('upsell.title')).not.toBeInTheDocument();
    });

    it('should render only TikTok section when only tiktokScripts provided', () => {
      render(
        <ContentGenerationTools
          adCopies={[]}
          tiktokScripts={mockTikTokScripts}
          pricePoints={[]}
          upsellSuggestions={[]}
          locale="en"
        />
      );
      expect(screen.queryByText('adCopy.title')).not.toBeInTheDocument();
      expect(screen.getByText('tiktokScripts.title')).toBeInTheDocument();
      expect(screen.queryByText('pricePoints.title')).not.toBeInTheDocument();
      expect(screen.queryByText('upsell.title')).not.toBeInTheDocument();
    });

    it('should render all sections when all data is provided', () => {
      render(
        <ContentGenerationTools
          adCopies={mockAdCopies}
          tiktokScripts={mockTikTokScripts}
          pricePoints={mockPricePoints}
          upsellSuggestions={mockUpsellSuggestions}
          locale="en"
        />
      );
      expect(screen.getByText('adCopy.title')).toBeInTheDocument();
      expect(screen.getByText('tiktokScripts.title')).toBeInTheDocument();
      expect(screen.getByText('pricePoints.title')).toBeInTheDocument();
      expect(screen.getByText('upsell.title')).toBeInTheDocument();
    });
  });
});
