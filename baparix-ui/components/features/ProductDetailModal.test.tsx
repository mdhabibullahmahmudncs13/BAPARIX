import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductDetailModal } from './ProductDetailModal';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const mockProduct = {
  id: 'prod-123',
  title: 'Wireless Bluetooth Headphones',
  titleTranslated: 'ওয়্যারলেস ব্লুটুথ হেডফোন',
  description: 'High-quality wireless headphones with noise cancellation',
  descriptionTranslated: 'নয়েজ ক্যান্সেলেশন সহ উচ্চ মানের ওয়্যারলেস হেডফোন',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ],
  platform: 'alibaba' as const,
  priceRange: {
    min: 1500,
    max: 2500,
    currency: 'BDT',
  },
  qualityTier: 'high' as const,
  moq: 100,
  supplierInfo: {
    name: 'TechSupply Co.',
    rating: 4.5,
    yearsActive: 8,
    responseRate: 0.95,
    reliabilityScore: 0.85,
  },
  leadTime: '15-20 days',
  shippingOptions: ['Air Freight', 'Sea Freight', 'Express Courier'],
  priceHistory: [
    { date: new Date('2024-01-01'), price: 2000 },
    { date: new Date('2024-02-01'), price: 1900 },
    { date: new Date('2024-03-01'), price: 1800 },
  ],
  category: 'Electronics',
  tags: ['wireless', 'bluetooth', 'headphones', 'audio'],
};

describe('ProductDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCalculateMargin = jest.fn();
  const mockOnAddToComparison = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Product Details')).toBeInTheDocument();
      // Product has titleTranslated, so it will display the translated version
      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <ProductDetailModal
          isOpen={false}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.queryByText('Product Details')).not.toBeInTheDocument();
    });

    it('should display translated title when available', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="bn"
        />
      );

      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
    });

    it('should display original title when translation is not available', () => {
      const productWithoutTranslation = {
        ...mockProduct,
        titleTranslated: undefined,
      };

      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={productWithoutTranslation}
          locale="en"
        />
      );

      expect(screen.getByText('Wireless Bluetooth Headphones')).toBeInTheDocument();
    });
  });

  describe('Product Information Display', () => {
    it('should display price range correctly', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText(/৳1,500 - ৳2,500/)).toBeInTheDocument();
    });

    it('should display MOQ (Minimum Order Quantity)', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Minimum Order Quantity:')).toBeInTheDocument();
      expect(screen.getByText(/100 units/)).toBeInTheDocument();
    });

    it('should display lead time', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Lead Time:')).toBeInTheDocument();
      expect(screen.getByText('15-20 days')).toBeInTheDocument();
    });

    it('should display category', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Category:')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should display shipping options', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Shipping Options:')).toBeInTheDocument();
      expect(screen.getByText(/Air Freight, Sea Freight, Express Courier/)).toBeInTheDocument();
    });

    it('should display product description', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Description')).toBeInTheDocument();
      // Product has descriptionTranslated, so it will display the translated version
      expect(
        screen.getByText('নয়েজ ক্যান্সেলেশন সহ উচ্চ মানের ওয়্যারলেস হেডফোন')
      ).toBeInTheDocument();
    });

    it('should display translated description when available', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="bn"
        />
      );

      expect(
        screen.getByText('নয়েজ ক্যান্সেলেশন সহ উচ্চ মানের ওয়্যারলেস হেডফোন')
      ).toBeInTheDocument();
    });

    it('should display product tags', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('wireless')).toBeInTheDocument();
      expect(screen.getByText('bluetooth')).toBeInTheDocument();
      expect(screen.getByText('headphones')).toBeInTheDocument();
      expect(screen.getByText('audio')).toBeInTheDocument();
    });

    it('should display platform and quality badges', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Alibaba')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });

  describe('Supplier Information Display', () => {
    it('should display supplier information section', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Supplier Information')).toBeInTheDocument();
    });

    it('should display supplier name', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Supplier Name:')).toBeInTheDocument();
      expect(screen.getByText('TechSupply Co.')).toBeInTheDocument();
    });

    it('should display supplier rating with stars', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      const ratingElements = screen.getAllByText('Rating:');
      expect(ratingElements.length).toBeGreaterThan(0);
      
      // Check for star rating display
      const stars = screen.getAllByRole('img', { name: /4.5 Rating/i });
      expect(stars.length).toBeGreaterThan(0);
    });

    it('should display years active', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Years Active:')).toBeInTheDocument();
      expect(screen.getByText(/8 years/)).toBeInTheDocument();
    });

    it('should display response rate', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Response Rate:')).toBeInTheDocument();
      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });

    it('should display reliability score with progress bar', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Reliability Score')).toBeInTheDocument();
      expect(screen.getByText(/85%/)).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
    });

    it('should display reliability score in Bengali locale', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="bn"
        />
      );

      expect(screen.getByText('নির্ভরযোগ্যতা স্কোর')).toBeInTheDocument();
    });
  });

  describe('Price History Chart', () => {
    it('should display price history chart when data is available', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Price History')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should display "no price history" message when data is not available', () => {
      const productWithoutHistory = {
        ...mockProduct,
        priceHistory: undefined,
      };

      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={productWithoutHistory}
          locale="en"
        />
      );

      expect(screen.getByText('Price History')).toBeInTheDocument();
      expect(screen.getByText('No price history available')).toBeInTheDocument();
    });

    it('should display "no price history" message when data array is empty', () => {
      const productWithEmptyHistory = {
        ...mockProduct,
        priceHistory: [],
      };

      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={productWithEmptyHistory}
          locale="en"
        />
      );

      expect(screen.getByText('No price history available')).toBeInTheDocument();
    });
  });

  describe('Product Images', () => {
    it('should display product images', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      const images = screen.getAllByRole('img', {
        name: /Image/,
      });
      // Filter out the star rating image
      const productImages = images.filter(img => 
        img.getAttribute('alt')?.includes('Image')
      );
      expect(productImages).toHaveLength(3);
    });

    it('should limit displayed images to 6', () => {
      const productWithManyImages = {
        ...mockProduct,
        images: Array(10).fill('https://example.com/image.jpg'),
      };

      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={productWithManyImages}
          locale="en"
        />
      );

      const images = screen.getAllByRole('img', {
        name: /Image/,
      });
      // Filter out the star rating image
      const productImages = images.filter(img => 
        img.getAttribute('alt')?.includes('Image')
      );
      expect(productImages).toHaveLength(6);
    });
  });

  describe('Action Buttons', () => {
    it('should display Calculate Margin button', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
          onCalculateMargin={mockOnCalculateMargin}
        />
      );

      expect(screen.getByText('Calculate Margin')).toBeInTheDocument();
    });

    it('should call onCalculateMargin when Calculate Margin button is clicked', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
          onCalculateMargin={mockOnCalculateMargin}
        />
      );

      const button = screen.getByText('Calculate Margin');
      fireEvent.click(button);

      expect(mockOnCalculateMargin).toHaveBeenCalledWith('prod-123');
      expect(mockOnCalculateMargin).toHaveBeenCalledTimes(1);
    });

    it('should display Add to Comparison button', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
          onAddToComparison={mockOnAddToComparison}
        />
      );

      expect(screen.getByText('Add to Comparison')).toBeInTheDocument();
    });

    it('should call onAddToComparison when Add to Comparison button is clicked', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
          onAddToComparison={mockOnAddToComparison}
        />
      );

      const button = screen.getByText('Add to Comparison');
      fireEvent.click(button);

      expect(mockOnAddToComparison).toHaveBeenCalledWith('prod-123');
      expect(mockOnAddToComparison).toHaveBeenCalledTimes(1);
    });

    it('should display Close button', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should call onClose when Close button is clicked', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      const button = screen.getByText('Close');
      fireEvent.click(button);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bilingual Support', () => {
    it('should display all labels in English when locale is "en"', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      expect(screen.getByText('Product Details')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Supplier Information')).toBeInTheDocument();
      expect(screen.getByText('Price History')).toBeInTheDocument();
    });

    it('should display all labels in Bengali when locale is "bn"', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="bn"
        />
      );

      expect(screen.getByText('পণ্যের বিবরণ')).toBeInTheDocument();
      expect(screen.getByText('বর্ণনা')).toBeInTheDocument();
      expect(screen.getByText('সরবরাহকারীর তথ্য')).toBeInTheDocument();
      expect(screen.getByText('মূল্য ইতিহাস')).toBeInTheDocument();
    });

    it('should format numbers according to Bengali locale', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="bn"
        />
      );

      // Bengali numerals should be used
      expect(screen.getByText(/১০০/)).toBeInTheDocument(); // MOQ
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for star rating', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      const ratingImages = screen.getAllByRole('img', { name: /4.5 Rating/i });
      expect(ratingImages.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for progress bar', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have proper alt text for product images', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      const images = screen.getAllByRole('img');
      // Filter product images (exclude star rating)
      const productImages = images.filter(img => 
        img.getAttribute('alt')?.includes('Image')
      );
      
      expect(productImages.length).toBeGreaterThan(0);
      productImages.forEach((img) => {
        expect(img.getAttribute('alt')).toMatch(/Image \d+/);
      });
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 4.5: Display detailed product information', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      // Verify all required product details are displayed
      // Product has titleTranslated, so it will display the translated version
      const headings = screen.getAllByRole('heading');
      const hasProductTitle = headings.some(h => h.textContent?.includes('হেডফোন'));
      expect(hasProductTitle).toBe(true);
      
      expect(screen.getByText(/৳1,500 - ৳2,500/)).toBeInTheDocument();
      expect(screen.getByText(/100 units/)).toBeInTheDocument();
      expect(screen.getByText('15-20 days')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(
        screen.getByText(/নয়েজ ক্যান্সেলেশন/)
      ).toBeInTheDocument();
    });

    it('should satisfy Requirement 4.5: Show supplier reliability score', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      // Verify supplier reliability score is displayed
      expect(screen.getByText('Reliability Score')).toBeInTheDocument();
      expect(screen.getByText(/85%/)).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
    });

    it('should satisfy Requirement 4.5: Display price history chart', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="en"
        />
      );

      // Verify price history chart is displayed
      expect(screen.getByText('Price History')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should satisfy Requirement 4.6: Show translated descriptions', () => {
      render(
        <ProductDetailModal
          isOpen={true}
          onClose={mockOnClose}
          product={mockProduct}
          locale="bn"
        />
      );

      // Verify translated title and description are displayed
      expect(screen.getByText('ওয়্যারলেস ব্লুটুথ হেডফোন')).toBeInTheDocument();
      expect(
        screen.getByText('নয়েজ ক্যান্সেলেশন সহ উচ্চ মানের ওয়্যারলেস হেডফোন')
      ).toBeInTheDocument();
    });
  });
});
