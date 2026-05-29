import { render, screen } from '@testing-library/react';
import { OptimizedImage, DEFAULT_BLUR_DATA_URL } from './OptimizedImage';

/**
 * Unit tests for OptimizedImage component
 *
 * Requirements:
 * - 16.3: Lazy-load images below the fold
 * - 15.5: Provide alternative text for all informational images
 */

// Mock next/image to render a standard img element for testing
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // next/image passes these props; render them as data attributes for testing
    const { blurDataURL, priority, placeholder, fill, ...rest } = props;
    return (
      <img
        {...rest}
        data-blur-data-url={blurDataURL as string | undefined}
        data-priority={priority ? 'true' : 'false'}
        data-placeholder={placeholder as string | undefined}
        data-fill={fill ? 'true' : undefined}
      />
    );
  },
}));

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/images/product.jpg',
    alt: 'A product image',
    width: 400,
    height: 300,
  };

  describe('lazy loading (Requirement 16.3)', () => {
    it('sets loading="lazy" by default for below-the-fold images', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('does not set loading="lazy" when priority is true (above-the-fold)', () => {
      render(<OptimizedImage {...defaultProps} priority />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).not.toHaveAttribute('loading', 'lazy');
    });

    it('sets priority data attribute when priority is true', () => {
      render(<OptimizedImage {...defaultProps} priority />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('data-priority', 'true');
    });

    it('does not set priority when not specified', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('data-priority', 'false');
    });
  });

  describe('alt text handling (Requirement 15.5)', () => {
    it('renders the provided alt text', () => {
      render(<OptimizedImage {...defaultProps} alt="Custom alt text" />);
      const img = screen.getByRole('img', { name: 'Custom alt text' });
      expect(img).toBeInTheDocument();
    });

    it('renders with empty alt for decorative images', () => {
      render(<OptimizedImage {...defaultProps} alt="" />);
      // An image with alt="" gets role="presentation" per accessibility spec
      const img = screen.getByRole('presentation');
      expect(img).toHaveAttribute('alt', '');
    });
  });

  describe('blur placeholder support', () => {
    it('uses blur placeholder when blurDataURL is provided', () => {
      const blurURL = 'data:image/jpeg;base64,abc123';
      render(<OptimizedImage {...defaultProps} blurDataURL={blurURL} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('data-placeholder', 'blur');
      expect(img).toHaveAttribute('data-blur-data-url', blurURL);
    });

    it('uses empty placeholder when no blurDataURL is provided', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('data-placeholder', 'empty');
    });

    it('does not pass blurDataURL when not provided', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img.getAttribute('data-blur-data-url')).toBeNull();
    });
  });

  describe('styling and className', () => {
    it('applies object-cover class by default', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveClass('object-cover');
    });

    it('merges custom className with default classes', () => {
      render(<OptimizedImage {...defaultProps} className="rounded-lg shadow-md" />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveClass('object-cover');
      expect(img).toHaveClass('rounded-lg');
      expect(img).toHaveClass('shadow-md');
    });

    it('applies aspect ratio style when provided', () => {
      render(<OptimizedImage {...defaultProps} aspectRatio="16/9" />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveStyle({ aspectRatio: '16/9' });
    });
  });

  describe('DEFAULT_BLUR_DATA_URL constant', () => {
    it('is a valid data URI', () => {
      expect(DEFAULT_BLUR_DATA_URL).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });

  describe('pass-through props', () => {
    it('passes width and height to the underlying image', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('width', '400');
      expect(img).toHaveAttribute('height', '300');
    });

    it('passes src to the underlying image', () => {
      render(<OptimizedImage {...defaultProps} />);
      const img = screen.getByRole('img', { name: 'A product image' });
      expect(img).toHaveAttribute('src', '/images/product.jpg');
    });
  });
});
