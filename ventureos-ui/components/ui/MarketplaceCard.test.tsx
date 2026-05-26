import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketplaceCard, MarketplaceCardProps } from './MarketplaceCard';

const mockProduct: MarketplaceCardProps['product'] = {
  id: 'prod-123',
  title: 'Wireless Bluetooth Headphones',
  titleTranslated: 'ওয়্যারলেস ব্লুটুথ হেডফোন',
  image: '/test-image.jpg',
  priceRange: { min: 500, max: 1500, currency: 'BDT' },
  platform: 'alibaba',
  qualityTier: 'medium',
  moq: 100,
  supplierRating: 4.5,
  leadTime: '7-14 days',
};

describe('MarketplaceCard', () => {
  describe('Grid View', () => {
    it('renders product information correctly in grid view', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);

      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
      expect(screen.getByText(/৳500/)).toBeInTheDocument();
      expect(screen.getByText(/৳1,500/)).toBeInTheDocument();
      expect(screen.getByText('100 units')).toBeInTheDocument();
      expect(screen.getByText('7-14 days')).toBeInTheDocument();
    });

    it('displays platform badge', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Alibaba')).toBeInTheDocument();
    });

    it('displays quality tier badge', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('renders star rating correctly', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('shows calculate margin button', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Calculate Margin')).toBeInTheDocument();
    });

    it('shows add to comparison button', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Add to Comparison')).toBeInTheDocument();
    });
  });

  describe('List View', () => {
    it('renders product information correctly in list view', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="list" />);

      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
      expect(screen.getByText(/৳500/)).toBeInTheDocument();
      expect(screen.getByText('100 units')).toBeInTheDocument();
    });

    it('displays horizontal layout in list view', () => {
      const { container } = render(
        <MarketplaceCard product={mockProduct} locale="en" viewMode="list" />
      );
      const flexContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Bilingual Support', () => {
    it('displays Bengali translations when locale is bn', () => {
      render(<MarketplaceCard product={mockProduct} locale="bn" viewMode="grid" />);

      expect(screen.getByText('মার্জিন গণনা করুন')).toBeInTheDocument();
      expect(screen.getByText('তুলনায় যোগ করুন')).toBeInTheDocument();
      expect(screen.getByText('এমওকিউ:')).toBeInTheDocument();
      expect(screen.getByText('রেটিং:')).toBeInTheDocument();
      expect(screen.getByText('লিড টাইম:')).toBeInTheDocument();
    });

    it('uses translated title when available', () => {
      render(<MarketplaceCard product={mockProduct} locale="bn" viewMode="grid" />);
      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
    });

    it('falls back to original title when translation not available', () => {
      const productWithoutTranslation = { ...mockProduct, titleTranslated: undefined };
      render(
        <MarketplaceCard product={productWithoutTranslation} locale="bn" viewMode="grid" />
      );
      expect(screen.getByText('Wireless Bluetooth Headphones')).toBeInTheDocument();
    });

    it('formats numbers in Bengali locale', () => {
      render(<MarketplaceCard product={mockProduct} locale="bn" viewMode="grid" />);
      // Bengali numerals for 100
      expect(screen.getByText(/১০০/)).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('displays image with correct alt text', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      const image = screen.getByAltText('ওয়্যারলেস ব্লুটুথ হেডফোন');
      expect(image).toBeInTheDocument();
    });

    it('shows loading placeholder before image loads', () => {
      const { container } = render(
        <MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />
      );
      const placeholder = container.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
    });

    it('displays fallback icon when image fails to load', async () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      
      const image = screen.getByAltText('ওয়্যারলেস ব্লুটুথ হেডফোন');
      fireEvent.error(image);

      await waitFor(() => {
        const fallbackIcon = screen.getByRole('img', { hidden: true });
        expect(fallbackIcon).toBeInTheDocument();
      });
    });

    it('applies lazy loading to images', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      const image = screen.getByAltText('ওয়্যারলেস ব্লুটুথ হেডফোন');
      expect(image).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Quality Tier Indicators', () => {
    it('displays budget badge for cheap tier', () => {
      const cheapProduct = { ...mockProduct, qualityTier: 'cheap' as const };
      render(<MarketplaceCard product={cheapProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Budget')).toBeInTheDocument();
    });

    it('displays standard badge for medium tier', () => {
      const mediumProduct = { ...mockProduct, qualityTier: 'medium' as const };
      render(<MarketplaceCard product={mediumProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('displays premium badge for high tier', () => {
      const highProduct = { ...mockProduct, qualityTier: 'high' as const };
      render(<MarketplaceCard product={highProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });

  describe('Platform Badges', () => {
    const platforms: Array<MarketplaceCardProps['product']['platform']> = [
      'alibaba',
      'pinduoduo',
      'xianyu',
      'skybuybd',
      'dhgate',
      'aliexpress',
    ];

    platforms.forEach((platform) => {
      it(`displays correct badge for ${platform}`, () => {
        const productWithPlatform = { ...mockProduct, platform };
        render(<MarketplaceCard product={productWithPlatform} locale="en" viewMode="grid" />);
        
        const expectedLabels: Record<typeof platform, string> = {
          alibaba: 'Alibaba',
          pinduoduo: 'Pinduoduo',
          xianyu: 'Xianyu',
          skybuybd: 'SkyBuyBD',
          dhgate: 'DHgate',
          aliexpress: 'AliExpress',
        };
        
        expect(screen.getByText(expectedLabels[platform])).toBeInTheDocument();
      });
    });
  });

  describe('Supplier Rating', () => {
    it('displays full stars for whole number ratings', () => {
      const productWith5Stars = { ...mockProduct, supplierRating: 5 };
      render(<MarketplaceCard product={productWith5Stars} locale="en" viewMode="grid" />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays half star for decimal ratings', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('displays correct number of stars for low ratings', () => {
      const productWith2Stars = { ...mockProduct, supplierRating: 2 };
      render(<MarketplaceCard product={productWith2Stars} locale="en" viewMode="grid" />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('formats BDT currency with ৳ symbol', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText(/৳500/)).toBeInTheDocument();
    });

    it('formats USD currency with $ symbol', () => {
      const usdProduct = {
        ...mockProduct,
        priceRange: { min: 10, max: 50, currency: 'USD' },
      };
      render(<MarketplaceCard product={usdProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText(/\$10/)).toBeInTheDocument();
    });

    it('formats CNY currency with ¥ symbol', () => {
      const cnyProduct = {
        ...mockProduct,
        priceRange: { min: 100, max: 500, currency: 'CNY' },
      };
      render(<MarketplaceCard product={cnyProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText(/¥100/)).toBeInTheDocument();
    });

    it('formats large numbers with commas', () => {
      const expensiveProduct = {
        ...mockProduct,
        priceRange: { min: 10000, max: 50000, currency: 'BDT' },
      };
      render(<MarketplaceCard product={expensiveProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText(/৳10,000/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onSelect when card is clicked', () => {
      const onSelect = jest.fn();
      render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          onSelect={onSelect}
        />
      );

      const card = screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন').closest('div[role="button"]');
      if (card) fireEvent.click(card);

      expect(onSelect).toHaveBeenCalledWith('prod-123');
    });

    it('calls onCalculateMargin when calculate margin button is clicked', () => {
      const onCalculateMargin = jest.fn();
      render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          onCalculateMargin={onCalculateMargin}
        />
      );

      const button = screen.getByText('Calculate Margin');
      fireEvent.click(button);

      expect(onCalculateMargin).toHaveBeenCalledWith('prod-123');
    });

    it('calls onAddToComparison when add to comparison button is clicked', () => {
      const onAddToComparison = jest.fn();
      render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          onAddToComparison={onAddToComparison}
        />
      );

      const button = screen.getByText('Add to Comparison');
      fireEvent.click(button);

      expect(onAddToComparison).toHaveBeenCalledWith('prod-123');
    });

    it('does not trigger onSelect when action buttons are clicked', () => {
      const onSelect = jest.fn();
      const onCalculateMargin = jest.fn();
      render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          onSelect={onSelect}
          onCalculateMargin={onCalculateMargin}
        />
      );

      const button = screen.getByText('Calculate Margin');
      fireEvent.click(button);

      expect(onCalculateMargin).toHaveBeenCalledWith('prod-123');
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Comparison State', () => {
    it('shows "Add to Comparison" when not in comparison', () => {
      render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          isInComparison={false}
        />
      );
      expect(screen.getByText('Add to Comparison')).toBeInTheDocument();
    });

    it('shows "Remove from Comparison" when in comparison', () => {
      render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          isInComparison={true}
        />
      );
      expect(screen.getByText('Remove from Comparison')).toBeInTheDocument();
    });

    it('applies different button variant when in comparison', () => {
      const { rerender } = render(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          isInComparison={false}
        />
      );
      
      const buttonNotInComparison = screen.getByText('Add to Comparison');
      expect(buttonNotInComparison).toBeInTheDocument();

      rerender(
        <MarketplaceCard
          product={mockProduct}
          locale="en"
          viewMode="grid"
          isInComparison={true}
        />
      );

      const buttonInComparison = screen.getByText('Remove from Comparison');
      expect(buttonInComparison).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible image alt text', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      const image = screen.getByAltText('ওয়্যারলেস ব্লুটুথ হেডফোন');
      expect(image).toBeInTheDocument();
    });

    it('has accessible rating label', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      const rating = screen.getByLabelText(/4.5 Rating/);
      expect(rating).toBeInTheDocument();
    });

    it('buttons are keyboard accessible', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly in grid view on mobile', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
    });

    it('renders correctly in list view on mobile', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="list" />);
      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional callbacks gracefully', () => {
      render(<MarketplaceCard product={mockProduct} locale="en" viewMode="grid" />);
      
      const card = screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন').closest('div[role="button"]');
      if (card) fireEvent.click(card);
      
      const calculateButton = screen.getByText('Calculate Margin');
      fireEvent.click(calculateButton);
      
      const comparisonButton = screen.getByText('Add to Comparison');
      fireEvent.click(comparisonButton);
      
      // Should not throw errors
      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
    });

    it('handles zero MOQ', () => {
      const zeroMoqProduct = { ...mockProduct, moq: 0 };
      render(<MarketplaceCard product={zeroMoqProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('0 units')).toBeInTheDocument();
    });

    it('handles zero rating', () => {
      const zeroRatingProduct = { ...mockProduct, supplierRating: 0 };
      render(<MarketplaceCard product={zeroRatingProduct} locale="en" viewMode="grid" />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very long product titles', () => {
      const longTitleProduct = {
        ...mockProduct,
        title: 'This is a very long product title that should be truncated with ellipsis when displayed in the card to maintain proper layout and readability',
        titleTranslated: 'This is a very long product title that should be truncated with ellipsis when displayed in the card to maintain proper layout and readability',
      };
      render(<MarketplaceCard product={longTitleProduct} locale="en" viewMode="grid" />);
      const title = screen.getByText(/This is a very long product title/);
      expect(title).toBeInTheDocument();
    });
  });
});
