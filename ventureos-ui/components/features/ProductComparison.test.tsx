import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductComparison, Product } from './ProductComparison';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Product 1',
    titleTranslated: 'পণ্য ১',
    image: '/test-image-1.jpg',
    priceRange: { min: 100, max: 200, currency: 'BDT' },
    platform: 'alibaba',
    qualityTier: 'high',
    moq: 50,
    supplierRating: 4.5,
    leadTime: '7-10 days',
    supplierInfo: {
      name: 'Supplier A',
      yearsActive: 5,
      responseRate: 95,
    },
    shippingOptions: ['Air Freight', 'Sea Freight'],
  },
  {
    id: '2',
    title: 'Product 2',
    titleTranslated: 'পণ্য ২',
    image: '/test-image-2.jpg',
    priceRange: { min: 150, max: 250, currency: 'BDT' },
    platform: 'aliexpress',
    qualityTier: 'medium',
    moq: 100,
    supplierRating: 4.0,
    leadTime: '10-15 days',
    supplierInfo: {
      name: 'Supplier B',
      yearsActive: 3,
      responseRate: 88,
    },
    shippingOptions: ['Express Shipping'],
  },
  {
    id: '3',
    title: 'Product 3',
    image: '/test-image-3.jpg',
    priceRange: { min: 80, max: 120, currency: 'BDT' },
    platform: 'dhgate',
    qualityTier: 'cheap',
    moq: 200,
    supplierRating: 3.5,
    leadTime: '15-20 days',
  },
];

describe('ProductComparison', () => {
  const mockOnRemoveProduct = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state when no products are provided', () => {
      render(
        <ProductComparison
          products={[]}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText('No products selected for comparison')).toBeInTheDocument();
      expect(screen.getByText('Select up to 5 products to compare')).toBeInTheDocument();
    });

    it('should display empty state in Bengali', () => {
      render(
        <ProductComparison
          products={[]}
          locale="bn"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText('তুলনার জন্য কোনো পণ্য নির্বাচিত নেই')).toBeInTheDocument();
      expect(screen.getByText('তুলনা করতে ৫টি পর্যন্ত পণ্য নির্বাচন করুন')).toBeInTheDocument();
    });
  });

  describe('Product Display', () => {
    it('should display all products in comparison table', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText('Product Comparison')).toBeInTheDocument();
      expect(screen.getByText(/Compare up to 5 products side by side/i)).toBeInTheDocument();
      expect(screen.getByText(/\(3\/5\)/)).toBeInTheDocument();

      // Check if product titles are displayed (use titleTranslated for Bengali locale)
      expect(screen.getAllByText('পণ্য ১').length).toBeGreaterThan(0);
      expect(screen.getAllByText('পণ্য ২').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Product 3').length).toBeGreaterThan(0);
    });

    it('should display products with Bengali locale', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="bn"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText('পণ্য তুলনা')).toBeInTheDocument();
      expect(screen.getByText(/পাশাপাশি ৫টি পর্যন্ত পণ্য তুলনা করুন/i)).toBeInTheDocument();

      // Check if translated titles are displayed
      expect(screen.getAllByText('পণ্য ১').length).toBeGreaterThan(0);
      expect(screen.getAllByText('পণ্য ২').length).toBeGreaterThan(0);
    });

    it('should display product details correctly', () => {
      render(
        <ProductComparison
          products={[mockProducts[0]]}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      // Check price range
      expect(screen.getAllByText(/৳100/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/৳200/i).length).toBeGreaterThan(0);

      // Check MOQ
      expect(screen.getAllByText(/50/i).length).toBeGreaterThan(0);

      // Check lead time
      expect(screen.getAllByText('7-10 days').length).toBeGreaterThan(0);

      // Check supplier info
      expect(screen.getAllByText('Supplier A').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/5/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/95%/i).length).toBeGreaterThan(0);

      // Check shipping options
      expect(screen.getAllByText('Air Freight').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sea Freight').length).toBeGreaterThan(0);
    });

    it('should handle products without optional fields', () => {
      render(
        <ProductComparison
          products={[mockProducts[2]]}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      // Product should still display
      expect(screen.getAllByText('Product 3').length).toBeGreaterThan(0);
      expect(screen.getAllByText('15-20 days').length).toBeGreaterThan(0);
    });
  });

  describe('Remove Product', () => {
    it('should call onRemoveProduct when remove button is clicked', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(mockOnRemoveProduct).toHaveBeenCalledWith('1');
    });

    it('should call onRemoveProduct with correct product ID', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[1]);

      expect(mockOnRemoveProduct).toHaveBeenCalledWith('2');
    });
  });

  describe('Close Button', () => {
    it('should display close button when onClose is provided', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByText('Close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not display close button when onClose is not provided', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should display export button', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText('Export Comparison')).toBeInTheDocument();
    });

    it('should not show export button when no products', () => {
      render(
        <ProductComparison
          products={[]}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      // Empty state is shown, no export button
      expect(screen.queryByText('Export Comparison')).not.toBeInTheDocument();
    });
  });

  describe('Product Limit', () => {
    it('should display correct count when products are selected', () => {
      render(
        <ProductComparison
          products={mockProducts.slice(0, 2)}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText(/\(2\/5\)/)).toBeInTheDocument();
    });

    it('should display 5/5 when maximum products are selected', () => {
      const fiveProducts = [
        ...mockProducts,
        {
          id: '4',
          title: 'Product 4',
          image: '/test-image-4.jpg',
          priceRange: { min: 90, max: 130, currency: 'BDT' },
          platform: 'pinduoduo' as const,
          qualityTier: 'medium' as const,
          moq: 75,
          supplierRating: 4.2,
          leadTime: '8-12 days',
        },
        {
          id: '5',
          title: 'Product 5',
          image: '/test-image-5.jpg',
          priceRange: { min: 110, max: 180, currency: 'BDT' },
          platform: 'xianyu' as const,
          qualityTier: 'high' as const,
          moq: 60,
          supplierRating: 4.7,
          leadTime: '5-8 days',
        },
      ];

      render(
        <ProductComparison
          products={fiveProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      expect(screen.getByText(/\(5\/5\)/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for star ratings', () => {
      render(
        <ProductComparison
          products={[mockProducts[0]]}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      const ratings = screen.getAllByRole('img', { name: /rating/i });
      expect(ratings.length).toBeGreaterThan(0);
    });

    it('should have proper alt text for images', () => {
      render(
        <ProductComparison
          products={[mockProducts[0]]}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      const images = screen.getAllByAltText('পণ্য ১');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render comparison table for desktop', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      // Desktop table container should have hidden class for mobile
      const tableContainer = document.querySelector('.hidden.lg\\:block.overflow-x-auto');
      expect(tableContainer).toBeInTheDocument();
    });

    it('should render comparison cards for mobile', () => {
      render(
        <ProductComparison
          products={mockProducts}
          locale="en"
          onRemoveProduct={mockOnRemoveProduct}
        />
      );

      // Mobile cards container should have lg:hidden class
      const mobileContainer = document.querySelector('.lg\\:hidden');
      expect(mobileContainer).toBeInTheDocument();
    });
  });
});
