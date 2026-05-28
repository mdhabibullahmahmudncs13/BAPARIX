import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExportHistory, ExportRecord } from './ExportHistory';

describe('ExportHistory', () => {
  const mockExports: ExportRecord[] = [
    {
      id: 'exp-001',
      date: '2024-01-15T10:30:00Z',
      type: 'csv',
      fileName: 'financial-data-jan-2024.csv',
      size: '2.4 MB',
      downloadUrl: '/api/exports/exp-001/download',
    },
    {
      id: 'exp-002',
      date: '2024-02-01T14:00:00Z',
      type: 'pdf',
      fileName: 'business-blueprint-v2.pdf',
      size: '5.1 MB',
      downloadUrl: '/api/exports/exp-002/download',
    },
    {
      id: 'exp-003',
      date: '2024-02-10T09:15:00Z',
      type: 'json',
      fileName: 'product-comparison.json',
      size: '128 KB',
      downloadUrl: '/api/exports/exp-003/download',
    },
  ];

  const defaultProps = {
    exports: mockExports,
    locale: 'en' as const,
  };

  describe('Rendering', () => {
    it('should render the export history component', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByTestId('export-history')).toBeInTheDocument();
    });

    it('should display the title', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render the exports table', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByTestId('export-history-table')).toBeInTheDocument();
    });

    it('should render all export rows', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByTestId('export-row-exp-001')).toBeInTheDocument();
      expect(screen.getByTestId('export-row-exp-002')).toBeInTheDocument();
      expect(screen.getByTestId('export-row-exp-003')).toBeInTheDocument();
    });

    it('should render table column headers', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByRole('columnheader', { name: 'columns.date' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.type' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.fileName' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.size' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'columns.actions' })).toBeInTheDocument();
    });

    it('should display export type as uppercase badge', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    it('should display file names', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByText('financial-data-jan-2024.csv')).toBeInTheDocument();
      expect(screen.getByText('business-blueprint-v2.pdf')).toBeInTheDocument();
      expect(screen.getByText('product-comparison.json')).toBeInTheDocument();
    });

    it('should display file sizes', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByText('2.4 MB')).toBeInTheDocument();
      expect(screen.getByText('5.1 MB')).toBeInTheDocument();
      expect(screen.getByText('128 KB')).toBeInTheDocument();
    });
  });

  describe('Download Links', () => {
    it('should render download links for each export', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByTestId('download-link-exp-001')).toBeInTheDocument();
      expect(screen.getByTestId('download-link-exp-002')).toBeInTheDocument();
      expect(screen.getByTestId('download-link-exp-003')).toBeInTheDocument();
    });

    it('should have correct href on download links', () => {
      render(<ExportHistory {...defaultProps} />);
      const link = screen.getByTestId('download-link-exp-001');
      expect(link).toHaveAttribute('href', '/api/exports/exp-001/download');
    });

    it('should have download attribute with file name', () => {
      render(<ExportHistory {...defaultProps} />);
      const link = screen.getByTestId('download-link-exp-001');
      expect(link).toHaveAttribute('download', 'financial-data-jan-2024.csv');
    });

    it('should have accessible aria-label on download links', () => {
      render(<ExportHistory {...defaultProps} />);
      const link = screen.getByTestId('download-link-exp-001');
      expect(link).toHaveAttribute('aria-label', 'download financial-data-jan-2024.csv');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no exports exist', () => {
      render(<ExportHistory exports={[]} locale="en" />);
      expect(screen.getByTestId('export-history-empty')).toBeInTheDocument();
    });

    it('should display empty message text', () => {
      render(<ExportHistory exports={[]} locale="en" />);
      expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('should not render the table when empty', () => {
      render(<ExportHistory exports={[]} locale="en" />);
      expect(screen.queryByTestId('export-history-table')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(<ExportHistory exports={[]} locale="en" isLoading={true} />);
      expect(screen.getByTestId('export-history-loading')).toBeInTheDocument();
    });

    it('should render skeleton rows', () => {
      render(<ExportHistory exports={[]} locale="en" isLoading={true} />);
      expect(screen.getByTestId('skeleton-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-row-3')).toBeInTheDocument();
    });

    it('should not display main content when loading', () => {
      render(<ExportHistory exports={mockExports} locale="en" isLoading={true} />);
      expect(screen.queryByTestId('export-history')).not.toBeInTheDocument();
    });

    it('should display main content when not loading', () => {
      render(<ExportHistory {...defaultProps} isLoading={false} />);
      expect(screen.getByTestId('export-history')).toBeInTheDocument();
      expect(screen.queryByTestId('export-history-loading')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have table with aria-label', () => {
      render(<ExportHistory {...defaultProps} />);
      const table = screen.getByTestId('export-history-table');
      expect(table).toHaveAttribute('aria-label', 'title');
    });

    it('should have scope attributes on table headers', () => {
      render(<ExportHistory {...defaultProps} />);
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have download icon hidden from screen readers', () => {
      const { container } = render(<ExportHistory {...defaultProps} />);
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it('should have region with aria-label wrapping the table', () => {
      render(<ExportHistory {...defaultProps} />);
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'title');
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale without errors', () => {
      render(<ExportHistory exports={mockExports} locale="bn" />);
      expect(screen.getByTestId('export-history')).toBeInTheDocument();
    });

    it('should render with English locale without errors', () => {
      render(<ExportHistory exports={mockExports} locale="en" />);
      expect(screen.getByTestId('export-history')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should apply custom className', () => {
      render(<ExportHistory {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('export-history')).toHaveClass('custom-class');
    });

    it('should default isLoading to false', () => {
      render(<ExportHistory {...defaultProps} />);
      expect(screen.getByTestId('export-history')).toBeInTheDocument();
      expect(screen.queryByTestId('export-history-loading')).not.toBeInTheDocument();
    });
  });
});
