import { render, screen, fireEvent } from '@testing-library/react';
import { ExportJSONButton } from './ExportJSONButton';
import { Product } from '@/components/features/ProductComparison';
import * as jsonExport from '@/lib/utils/jsonExport';

// Mock the jsonExport module
jest.mock('@/lib/utils/jsonExport', () => ({
  exportComparisonDataToJson: jest.fn(),
}));

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Phone Case',
    image: '/images/phone-case.jpg',
    priceRange: { min: 50, max: 200, currency: 'BDT' },
    platform: 'alibaba',
    qualityTier: 'medium',
    moq: 100,
    supplierRating: 4.5,
    leadTime: '7-14 days',
  },
];

const defaultProps = {
  products: mockProducts,
  userName: 'Test User',
  userEmail: 'test@example.com',
};

describe('ExportJSONButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the export button', () => {
      render(<ExportJSONButton {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'jsonButton' })).toBeInTheDocument();
    });

    it('displays the button text from translations', () => {
      render(<ExportJSONButton {...defaultProps} />);

      expect(screen.getByText('jsonButton')).toBeInTheDocument();
    });

    it('renders the download icon', () => {
      const { container } = render(<ExportJSONButton {...defaultProps} />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls exportComparisonDataToJson on click', () => {
      render(<ExportJSONButton {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      expect(jsonExport.exportComparisonDataToJson).toHaveBeenCalledWith({
        products: mockProducts,
        userName: 'Test User',
        userEmail: 'test@example.com',
        fileName: undefined,
      });
    });

    it('passes custom fileName to export utility', () => {
      render(<ExportJSONButton {...defaultProps} fileName="custom.json" />);

      fireEvent.click(screen.getByRole('button'));

      expect(jsonExport.exportComparisonDataToJson).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'custom.json' })
      );
    });
  });

  describe('Disabled State', () => {
    it('is disabled when products array is empty', () => {
      render(<ExportJSONButton {...defaultProps} products={[]} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is enabled when products array has items', () => {
      render(<ExportJSONButton {...defaultProps} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('does not call export when disabled', () => {
      render(<ExportJSONButton {...defaultProps} products={[]} />);

      fireEvent.click(screen.getByRole('button'));

      expect(jsonExport.exportComparisonDataToJson).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has type="button" to prevent form submission', () => {
      render(<ExportJSONButton {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('has an accessible aria-label', () => {
      render(<ExportJSONButton {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'jsonButton');
    });

    it('icon is hidden from screen readers', () => {
      const { container } = render(<ExportJSONButton {...defaultProps} />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
