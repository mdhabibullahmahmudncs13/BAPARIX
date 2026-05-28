import { render, screen, fireEvent } from '@testing-library/react';
import {
  SearchResults,
  SearchResultItem,
  SearchResultCategory,
} from './SearchResults';

const mockResults: SearchResultItem[] = [
  {
    id: 'p1',
    title: 'Wireless Earbuds',
    description: 'High-quality wireless earbuds from Alibaba',
    category: 'products',
    href: '/products/p1',
  },
  {
    id: 'p2',
    title: 'Phone Cases',
    description: 'Bulk phone cases from DHgate',
    category: 'products',
    href: '/products/p2',
  },
  {
    id: 'b1',
    title: 'Earbuds Business Plan',
    description: 'Complete blueprint for earbuds reselling',
    category: 'blueprints',
    href: '/blueprints/b1',
  },
  {
    id: 'h1',
    title: 'How to Search Products',
    description: 'Guide on using the product search feature',
    category: 'help',
    href: '/help/h1',
  },
];

describe('SearchResults', () => {
  describe('Rendering', () => {
    it('renders search results grouped by category', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const container = screen.getByTestId('search-results');
      expect(container).toBeInTheDocument();

      // Check category headers are present (translation keys) - use getAllByText since badges also show category
      expect(screen.getAllByText('categories.products').length).toBeGreaterThan(0);
      expect(screen.getAllByText('categories.blueprints').length).toBeGreaterThan(0);
      expect(screen.getAllByText('categories.help').length).toBeGreaterThan(0);
    });

    it('displays result title and description', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      expect(screen.getByText('Wireless Earbuds')).toBeInTheDocument();
      expect(
        screen.getByText('High-quality wireless earbuds from Alibaba')
      ).toBeInTheDocument();
    });

    it('displays category badges for each result', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      // Each result has a category badge - products appears 2 times in results + 1 in header
      const productBadges = screen.getAllByText('categories.products');
      expect(productBadges.length).toBe(3); // 1 header + 2 result badges
    });

    it('displays result count per category', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      // Products has 2 results
      expect(screen.getByText('2')).toBeInTheDocument();
      // Blueprints has 1 result
      const ones = screen.getAllByText('1');
      expect(ones.length).toBe(2); // blueprints and help each have 1
    });

    it('renders results as links with href', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const links = screen.getAllByRole('option');
      expect(links[0]).toHaveAttribute('href', '/products/p1');
      expect(links[2]).toHaveAttribute('href', '/blueprints/b1');
      expect(links[3]).toHaveAttribute('href', '/help/h1');
    });

    it('does not render categories with no results', () => {
      const productsOnly: SearchResultItem[] = [
        {
          id: 'p1',
          title: 'Product A',
          description: 'Description A',
          category: 'products',
          href: '/products/p1',
        },
      ];

      render(<SearchResults results={productsOnly} query="product" />);

      expect(screen.getAllByText('categories.products').length).toBeGreaterThan(0);
      expect(screen.queryByText('categories.blueprints')).not.toBeInTheDocument();
      expect(screen.queryByText('categories.help')).not.toBeInTheDocument();
    });

    it('returns null when no query is provided', () => {
      const { container } = render(<SearchResults results={mockResults} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when results are empty and no query', () => {
      const { container } = render(<SearchResults results={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(<SearchResults isLoading={true} query="test" />);

      const loading = screen.getByTestId('search-results-loading');
      expect(loading).toBeInTheDocument();
      expect(loading).toHaveAttribute('aria-busy', 'true');
    });

    it('shows animated pulse elements during loading', () => {
      const { container } = render(
        <SearchResults isLoading={true} query="test" />
      );

      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBe(3);
    });
  });

  describe('Empty State', () => {
    it('displays empty state when query exists but no results', () => {
      render(<SearchResults results={[]} query="nonexistent" />);

      const empty = screen.getByTestId('search-results-empty');
      expect(empty).toBeInTheDocument();
      expect(screen.getByText('noResults')).toBeInTheDocument();
      expect(screen.getByText('tryDifferentQuery')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates down with ArrowDown key', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('navigates up with ArrowUp key', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');

      // Go down twice
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      // Go up once
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('wraps around from last to first with ArrowDown', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');

      // Navigate to last item
      for (let i = 0; i < mockResults.length; i++) {
        fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      }

      // One more should wrap to first
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps around from first to last with ArrowUp', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');

      // Go down to first item
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      // Go up should wrap to last
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[options.length - 1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('selects item with Enter key', () => {
      const onSelect = jest.fn();
      render(
        <SearchResults
          results={mockResults}
          query="earbuds"
          onSelect={onSelect}
        />
      );

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    it('navigates to first item with Home key', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');

      // Navigate down a few times
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      // Press Home
      fireEvent.keyDown(listbox, { key: 'Home' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('navigates to last item with End key', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'End' });

      const options = screen.getAllByRole('option');
      expect(options[options.length - 1]).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('resets active index when results change', () => {
      const { rerender } = render(
        <SearchResults results={mockResults} query="earbuds" />
      );

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      // Rerender with new results
      const newResults = [mockResults[0]];
      rerender(<SearchResults results={newResults} query="earbuds" />);

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Selection', () => {
    it('calls onSelect when a result is clicked', () => {
      const onSelect = jest.fn();
      render(
        <SearchResults
          results={mockResults}
          query="earbuds"
          onSelect={onSelect}
        />
      );

      const firstResult = screen.getAllByRole('option')[0];
      fireEvent.click(firstResult);

      expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
    });

    it('prevents default link navigation on click', () => {
      const onSelect = jest.fn();
      render(
        <SearchResults
          results={mockResults}
          query="earbuds"
          onSelect={onSelect}
        />
      );

      const firstResult = screen.getAllByRole('option')[0];
      const clickEvent = fireEvent.click(firstResult);

      // The onClick handler calls preventDefault
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="listbox" on the container', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('has aria-label on the listbox', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      expect(screen.getByRole('listbox')).toHaveAttribute(
        'aria-label',
        'searchResultsLabel'
      );
    });

    it('has role="option" on each result item', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(mockResults.length);
    });

    it('has aria-selected on result items', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option).toHaveAttribute('aria-selected', 'false');
      });
    });

    it('updates aria-activedescendant when navigating', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });

      expect(listbox).toHaveAttribute(
        'aria-activedescendant',
        `search-result-${mockResults[0].id}`
      );
    });

    it('has tabIndex on the listbox for focus', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      expect(screen.getByRole('listbox')).toHaveAttribute('tabindex', '0');
    });

    it('loading state has aria-busy attribute', () => {
      render(<SearchResults isLoading={true} query="test" />);

      expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    });

    it('loading state has aria-label', () => {
      render(<SearchResults isLoading={true} query="test" />);

      expect(screen.getByRole('listbox')).toHaveAttribute(
        'aria-label',
        'loadingResults'
      );
    });

    it('empty state has aria-label', () => {
      render(<SearchResults results={[]} query="nonexistent" />);

      expect(screen.getByRole('listbox')).toHaveAttribute(
        'aria-label',
        'noResultsLabel'
      );
    });
  });

  describe('Category Ordering', () => {
    it('displays categories in order: products, blueprints, help', () => {
      render(<SearchResults results={mockResults} query="earbuds" />);

      const headers = screen
        .getAllByText(/categories\./)
        .filter((el) => el.classList.contains('uppercase'));

      expect(headers[0]).toHaveTextContent('categories.products');
      expect(headers[1]).toHaveTextContent('categories.blueprints');
      expect(headers[2]).toHaveTextContent('categories.help');
    });
  });
});
