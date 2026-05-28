import { render, screen, fireEvent } from '@testing-library/react';
import { ExportCSVButton } from './ExportCSVButton';
import { FinancialEntryFormData } from '@/lib/validations/financialEntry';
import * as csvExport from '@/lib/utils/csvExport';

// Mock the csvExport module
jest.mock('@/lib/utils/csvExport', () => ({
  exportFinancialDataToCsv: jest.fn(),
}));

const mockEntries: FinancialEntryFormData[] = [
  {
    type: 'revenue',
    amount: 5000,
    category: 'product_sales',
    description: 'Test sale',
    date: '2024-01-15',
  },
];

const defaultProps = {
  entries: mockEntries,
  userName: 'Test User',
  userEmail: 'test@example.com',
};

describe('ExportCSVButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the export button', () => {
      render(<ExportCSVButton {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'csvButton' })).toBeInTheDocument();
    });

    it('displays the button text from translations', () => {
      render(<ExportCSVButton {...defaultProps} />);

      expect(screen.getByText('csvButton')).toBeInTheDocument();
    });

    it('renders the download icon', () => {
      const { container } = render(<ExportCSVButton {...defaultProps} />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls exportFinancialDataToCsv on click', () => {
      render(<ExportCSVButton {...defaultProps} />);

      fireEvent.click(screen.getByRole('button'));

      expect(csvExport.exportFinancialDataToCsv).toHaveBeenCalledWith({
        entries: mockEntries,
        userName: 'Test User',
        userEmail: 'test@example.com',
        fileName: undefined,
      });
    });

    it('passes custom fileName to export utility', () => {
      render(<ExportCSVButton {...defaultProps} fileName="custom.csv" />);

      fireEvent.click(screen.getByRole('button'));

      expect(csvExport.exportFinancialDataToCsv).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'custom.csv' })
      );
    });
  });

  describe('Disabled State', () => {
    it('is disabled when entries array is empty', () => {
      render(<ExportCSVButton {...defaultProps} entries={[]} />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('is enabled when entries array has items', () => {
      render(<ExportCSVButton {...defaultProps} />);

      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('does not call export when disabled', () => {
      render(<ExportCSVButton {...defaultProps} entries={[]} />);

      fireEvent.click(screen.getByRole('button'));

      expect(csvExport.exportFinancialDataToCsv).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has type="button" to prevent form submission', () => {
      render(<ExportCSVButton {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('has an accessible aria-label', () => {
      render(<ExportCSVButton {...defaultProps} />);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'csvButton');
    });

    it('icon is hidden from screen readers', () => {
      const { container } = render(<ExportCSVButton {...defaultProps} />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
