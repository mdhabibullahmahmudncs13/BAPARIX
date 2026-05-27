import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { KeywordResearchDisplay, Keyword } from './KeywordResearchDisplay';

const mockKeywords: Keyword[] = [
  {
    term: 'reseller business bangladesh',
    searchVolume: 12000,
    competition: 'high',
    language: 'en',
    trendDuration: '6 months',
  },
  {
    term: 'পাইকারি পণ্য',
    searchVolume: 8500,
    competition: 'medium',
    language: 'bn',
    trendDuration: '3 months',
  },
  {
    term: 'import from china to bangladesh',
    searchVolume: 15000,
    competition: 'low',
    language: 'en',
    trendDuration: '12 months',
  },
  {
    term: 'অনলাইন ব্যবসা',
    searchVolume: 9200,
    competition: 'high',
    language: 'bn',
    trendDuration: '9 months',
  },
  {
    term: 'dropshipping bd',
    searchVolume: 5400,
    competition: 'low',
    language: 'en',
  },
];

describe('KeywordResearchDisplay', () => {
  describe('Rendering', () => {
    it('should render the title', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render a table with correct columns', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText(/columns\.keyword/)).toBeInTheDocument();
      expect(screen.getByText(/columns\.searchVolume/)).toBeInTheDocument();
      expect(screen.getByText(/columns\.competition/)).toBeInTheDocument();
      expect(screen.getByText('columns.language')).toBeInTheDocument();
      expect(screen.getByText('columns.trendDuration')).toBeInTheDocument();
    });

    it('should render all keyword results', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText('reseller business bangladesh')).toBeInTheDocument();
      expect(screen.getByText('পাইকারি পণ্য')).toBeInTheDocument();
      expect(screen.getByText('import from china to bangladesh')).toBeInTheDocument();
      expect(screen.getByText('অনলাইন ব্যবসা')).toBeInTheDocument();
      expect(screen.getByText('dropshipping bd')).toBeInTheDocument();
    });

    it('should display competition levels with badges', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const lowBadges = screen.getAllByText('competition.low');
      const mediumBadges = screen.getAllByText('competition.medium');
      const highBadges = screen.getAllByText('competition.high');
      expect(lowBadges.length).toBe(2);
      expect(mediumBadges.length).toBe(1);
      expect(highBadges.length).toBe(2);
    });

    it('should display language badges', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const enBadges = screen.getAllByText('languages.en');
      const bnBadges = screen.getAllByText('languages.bn');
      expect(enBadges.length).toBe(3);
      expect(bnBadges.length).toBe(2);
    });

    it('should display trend duration for each keyword', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText('6 months')).toBeInTheDocument();
      expect(screen.getByText('3 months')).toBeInTheDocument();
      expect(screen.getByText('12 months')).toBeInTheDocument();
      expect(screen.getByText('9 months')).toBeInTheDocument();
    });

    it('should display unknown trend duration when not provided', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText('trendDuration.unknown')).toBeInTheDocument();
    });

    it('should display result count summary', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText('summary')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display no results message when keywords array is empty', () => {
      render(<KeywordResearchDisplay keywords={[]} locale="en" />);
      expect(screen.getByText('noResults')).toBeInTheDocument();
    });

    it('should not render the table when keywords are empty', () => {
      render(<KeywordResearchDisplay keywords={[]} locale="en" />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(<KeywordResearchDisplay keywords={[]} locale="en" isLoading={true} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have accessible loading label', () => {
      render(<KeywordResearchDisplay keywords={[]} locale="en" isLoading={true} />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'loading');
    });

    it('should not render the table when loading', () => {
      render(<KeywordResearchDisplay keywords={[]} locale="en" isLoading={true} />);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort by search volume descending by default', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const rows = screen.getAllByRole('row');
      // Highest volume first: "import from china to bangladesh" at 15000
      expect(within(rows[1]).getByText('import from china to bangladesh')).toBeInTheDocument();
    });

    it('should toggle sort direction when clicking the same column', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);

      // Click searchVolume column (already sorted desc by default)
      const volumeHeader = screen.getByRole('button', { name: /columns\.searchVolume/ });
      fireEvent.click(volumeHeader);

      // Now sorted asc - lowest volume first (dropshipping bd at 5400)
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('dropshipping bd')).toBeInTheDocument();
    });

    it('should sort by keyword term when clicking keyword column', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);

      const keywordHeader = screen.getByRole('button', { name: /columns\.keyword/ });
      fireEvent.click(keywordHeader);

      const rows = screen.getAllByRole('row');
      // Alphabetically first: "dropshipping bd"
      expect(within(rows[1]).getByText('dropshipping bd')).toBeInTheDocument();
    });

    it('should sort by competition when clicking competition column', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);

      const competitionHeader = screen.getByRole('button', { name: /columns\.competition/ });
      fireEvent.click(competitionHeader);

      // Default desc for competition: high first
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('competition.high')).toBeInTheDocument();
    });

    it('should display sort direction indicator on active column', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);

      // Default sort is searchVolume desc
      const volumeHeader = screen.getByRole('button', { name: /columns\.searchVolume/ });
      expect(volumeHeader.textContent).toContain('↓');
    });

    it('should show ascending indicator after toggling', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);

      const volumeHeader = screen.getByRole('button', { name: /columns\.searchVolume/ });
      fireEvent.click(volumeHeader);

      expect(volumeHeader.textContent).toContain('↑');
    });
  });

  describe('Geography Filter', () => {
    it('should default to Bangladesh filter', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const select = screen.getByLabelText('filters.geographyAriaLabel');
      expect(select).toHaveValue('bangladesh');
    });

    it('should display geography filter dropdown', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByLabelText('filters.geographyAriaLabel')).toBeInTheDocument();
    });

    it('should show all keywords when filter is set to all', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const select = screen.getByLabelText('filters.geographyAriaLabel');
      fireEvent.change(select, { target: { value: 'all' } });

      // All 5 keywords should be visible
      expect(screen.getByText('reseller business bangladesh')).toBeInTheDocument();
      expect(screen.getByText('পাইকারি পণ্য')).toBeInTheDocument();
      expect(screen.getByText('import from china to bangladesh')).toBeInTheDocument();
      expect(screen.getByText('অনলাইন ব্যবসা')).toBeInTheDocument();
      expect(screen.getByText('dropshipping bd')).toBeInTheDocument();
    });

    it('should filter keywords for Bangladesh geography', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      // Default is bangladesh - should show bn and en keywords (all in this case)
      expect(screen.getByText('reseller business bangladesh')).toBeInTheDocument();
      expect(screen.getByText('পাইকারি পণ্য')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have a table with grid role and aria-label', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'tableAriaLabel');
    });

    it('should have aria-sort on active sort column', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const volumeHeader = screen.getByRole('button', { name: /columns\.searchVolume/ });
      expect(volumeHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('should have aria-sort none on inactive columns', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const keywordHeader = screen.getByRole('button', { name: /columns\.keyword/ });
      expect(keywordHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('should update aria-sort when sort direction changes', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const volumeHeader = screen.getByRole('button', { name: /columns\.searchVolume/ });

      fireEvent.click(volumeHeader);
      expect(volumeHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    it('should have column headers as scope col', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have an accessible label on the geography filter', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      const select = screen.getByLabelText('filters.geographyAriaLabel');
      expect(select).toBeInTheDocument();
    });
  });

  describe('Locale Support', () => {
    it('should render with Bengali locale', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="bn" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render with English locale', () => {
      render(<KeywordResearchDisplay keywords={mockKeywords} locale="en" />);
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });
});
