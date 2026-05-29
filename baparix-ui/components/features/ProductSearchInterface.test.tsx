import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductSearchInterface, SearchFilters } from './ProductSearchInterface';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ProductSearchInterface', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByPlaceholderText('Search for products...')).toBeInTheDocument();
    });

    it('should render in Bengali when locale is bn', () => {
      render(<ProductSearchInterface locale="bn" />, { wrapper: createWrapper() });
      expect(screen.getByPlaceholderText('পণ্য অনুসন্ধান করুন...')).toBeInTheDocument();
    });

    it('should render all platform checkboxes', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Alibaba')).toBeInTheDocument();
      expect(screen.getByLabelText('Pinduoduo')).toBeInTheDocument();
      expect(screen.getByLabelText('Xianyu')).toBeInTheDocument();
      expect(screen.getByLabelText('SkyBuyBD')).toBeInTheDocument();
      expect(screen.getByLabelText('DHgate')).toBeInTheDocument();
      expect(screen.getByLabelText('AliExpress')).toBeInTheDocument();
    });

    it('should render quality tier checkboxes', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Cheap')).toBeInTheDocument();
      expect(screen.getByLabelText('Medium')).toBeInTheDocument();
      expect(screen.getByLabelText('High')).toBeInTheDocument();
    });

    it('should render price range inputs', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Min Price')).toBeInTheDocument();
      const maxPriceInputs = screen.getAllByLabelText('Max Price');
      expect(maxPriceInputs.length).toBeGreaterThan(0);
    });

    it('should render shipping time select', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Shipping Time')).toBeInTheDocument();
    });

    it('should render sort options', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const sortSelect = screen.getAllByRole('combobox')[0];
      expect(sortSelect).toBeInTheDocument();
    });

    it('should render view mode toggle buttons', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Grid')).toBeInTheDocument();
      expect(screen.getByLabelText('List')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search query on input change', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const searchInput = screen.getByPlaceholderText('Search for products...');
      fireEvent.change(searchInput, { target: { value: 'electronics' } });
      expect(searchInput).toHaveValue('electronics');
    });

    it('should call onSearch when search button is clicked', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      const searchInput = screen.getByPlaceholderText('Search for products...');
      const searchButton = screen.getByRole('button', { name: 'Search' });

      fireEvent.change(searchInput, { target: { value: 'laptop' } });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'laptop',
          platforms: [],
          priceRange: { min: 0, max: 100000 },
          qualityTier: [],
          shippingTime: '',
          sortBy: 'relevance',
          viewMode: 'grid',
        })
      );
    });

    it('should call onSearch when Enter key is pressed', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      const searchInput = screen.getByPlaceholderText('Search for products...');

      fireEvent.change(searchInput, { target: { value: 'phone' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'phone',
        })
      );
    });
  });

  describe('Platform Filters', () => {
    it('should toggle platform selection', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      const alibabaCheckbox = screen.getByLabelText('Alibaba');

      fireEvent.click(alibabaCheckbox);
      expect(alibabaCheckbox).toBeChecked();

      fireEvent.click(alibabaCheckbox);
      expect(alibabaCheckbox).not.toBeChecked();
    });

    it('should select all platforms when Select All is clicked', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const selectAllButton = screen.getByText('Select All');

      fireEvent.click(selectAllButton);

      expect(screen.getByLabelText('Alibaba')).toBeChecked();
      expect(screen.getByLabelText('Pinduoduo')).toBeChecked();
      expect(screen.getByLabelText('Xianyu')).toBeChecked();
      expect(screen.getByLabelText('SkyBuyBD')).toBeChecked();
      expect(screen.getByLabelText('DHgate')).toBeChecked();
      expect(screen.getByLabelText('AliExpress')).toBeChecked();
    });

    it('should deselect all platforms when Deselect All is clicked', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const selectAllButton = screen.getByText('Select All');

      // Select all first
      fireEvent.click(selectAllButton);
      
      // Now deselect all
      const deselectAllButton = screen.getByText('Deselect All');
      fireEvent.click(deselectAllButton);

      expect(screen.getByLabelText('Alibaba')).not.toBeChecked();
      expect(screen.getByLabelText('Pinduoduo')).not.toBeChecked();
    });

    it('should include selected platforms in search filters', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByLabelText('Alibaba'));
      fireEvent.click(screen.getByLabelText('DHgate'));
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: ['alibaba', 'dhgate'],
        })
      );
    });
  });

  describe('Price Range Filter', () => {
    it('should update min price', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const minPriceInput = screen.getByLabelText('Min Price');

      fireEvent.change(minPriceInput, { target: { value: '1000' } });
      expect(minPriceInput).toHaveValue(1000);
    });

    it('should update max price', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const maxPriceInputs = screen.getAllByLabelText('Max Price');
      const maxPriceInput = maxPriceInputs.find(input => input.getAttribute('type') === 'number') as HTMLInputElement;

      fireEvent.change(maxPriceInput, { target: { value: '50000' } });
      expect(maxPriceInput).toHaveValue(50000);
    });

    it('should update max price with slider', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const slider = screen.getAllByRole('slider')[0];

      fireEvent.change(slider, { target: { value: '75000' } });
      expect(slider).toHaveValue('75000');
    });

    it('should include price range in search filters', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      
      fireEvent.change(screen.getByLabelText('Min Price'), { target: { value: '5000' } });
      const maxPriceInputs = screen.getAllByLabelText('Max Price');
      const maxPriceInput = maxPriceInputs.find(input => input.getAttribute('type') === 'number') as HTMLInputElement;
      fireEvent.change(maxPriceInput, { target: { value: '25000' } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: 5000, max: 25000 },
        })
      );
    });
  });

  describe('Quality Tier Filter', () => {
    it('should toggle quality tier selection', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const cheapCheckbox = screen.getByLabelText('Cheap');

      fireEvent.click(cheapCheckbox);
      expect(cheapCheckbox).toBeChecked();

      fireEvent.click(cheapCheckbox);
      expect(cheapCheckbox).not.toBeChecked();
    });

    it('should include selected quality tiers in search filters', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByLabelText('Medium'));
      fireEvent.click(screen.getByLabelText('High'));
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          qualityTier: ['medium', 'high'],
        })
      );
    });
  });

  describe('Shipping Time Filter', () => {
    it('should update shipping time selection', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const shippingSelect = screen.getByLabelText('Shipping Time');

      fireEvent.change(shippingSelect, { target: { value: '1-7' } });
      expect(shippingSelect).toHaveValue('1-7');
    });

    it('should include shipping time in search filters', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      
      fireEvent.change(screen.getByLabelText('Shipping Time'), { target: { value: '8-15' } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingTime: '8-15',
        })
      );
    });
  });

  describe('Sort Options', () => {
    it('should update sort selection', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const sortSelect = screen.getAllByRole('combobox')[0];

      fireEvent.change(sortSelect, { target: { value: 'price-asc' } });
      expect(sortSelect).toHaveValue('price-asc');
    });

    it('should include sort option in search filters', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      const sortSelect = screen.getAllByRole('combobox')[0];
      
      fireEvent.change(sortSelect, { target: { value: 'rating' } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'rating',
        })
      );
    });
  });

  describe('View Mode Toggle', () => {
    it('should start with grid view by default', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const gridButton = screen.getByLabelText('Grid');
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should toggle to list view', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const listButton = screen.getByLabelText('List');

      fireEvent.click(listButton);
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should toggle back to grid view', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const listButton = screen.getByLabelText('List');
      const gridButton = screen.getByLabelText('Grid');

      fireEvent.click(listButton);
      fireEvent.click(gridButton);
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should include view mode in search filters', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      
      fireEvent.click(screen.getByLabelText('List'));
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'list',
        })
      );
    });
  });

  describe('Clear Filters', () => {
    it('should reset all filters when Clear Filters is clicked', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      
      // Set various filters
      fireEvent.change(screen.getByPlaceholderText('Search for products...'), { target: { value: 'test' } });
      fireEvent.click(screen.getByLabelText('Alibaba'));
      fireEvent.change(screen.getByLabelText('Min Price'), { target: { value: '1000' } });
      fireEvent.click(screen.getByLabelText('Cheap'));
      
      // Clear filters
      fireEvent.click(screen.getByText('Clear Filters'));

      // Verify all filters are reset
      expect(screen.getByPlaceholderText('Search for products...')).toHaveValue('');
      expect(screen.getByLabelText('Alibaba')).not.toBeChecked();
      expect(screen.getByLabelText('Min Price')).toHaveValue(0);
      expect(screen.getByLabelText('Cheap')).not.toBeChecked();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have show/hide filters button on mobile', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const toggleButton = screen.getByRole('button', { name: 'Show Filters' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle filters visibility', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      const toggleButton = screen.getByRole('button', { name: 'Show Filters' });
      
      fireEvent.click(toggleButton);
      expect(screen.getByRole('button', { name: 'Hide Filters' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for view toggle buttons', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Grid')).toHaveAttribute('aria-pressed');
      expect(screen.getByLabelText('List')).toHaveAttribute('aria-pressed');
    });

    it('should have proper labels for all form inputs', () => {
      render(<ProductSearchInterface locale="en" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Min Price')).toBeInTheDocument();
      const maxPriceInputs = screen.getAllByLabelText('Max Price');
      expect(maxPriceInputs.length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Shipping Time')).toBeInTheDocument();
    });

    it('should support keyboard navigation for search', () => {
      render(<ProductSearchInterface locale="en" onSearch={mockOnSearch} />, { wrapper: createWrapper() });
      const searchInput = screen.getByPlaceholderText('Search for products...');

      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalled();
    });
  });

  describe('Bengali Locale', () => {
    it('should render Bengali labels for platforms', () => {
      render(<ProductSearchInterface locale="bn" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('আলিবাবা')).toBeInTheDocument();
      expect(screen.getByLabelText('পিন্ডুওডুও')).toBeInTheDocument();
    });

    it('should render Bengali labels for quality tiers', () => {
      render(<ProductSearchInterface locale="bn" />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('সস্তা')).toBeInTheDocument();
      expect(screen.getByLabelText('মাঝারি')).toBeInTheDocument();
      expect(screen.getByLabelText('উচ্চ')).toBeInTheDocument();
    });

    it('should render Bengali button labels', () => {
      render(<ProductSearchInterface locale="bn" />, { wrapper: createWrapper() });
      expect(screen.getByRole('button', { name: 'অনুসন্ধান' })).toBeInTheDocument();
      expect(screen.getByText('ফিল্টার সাফ করুন')).toBeInTheDocument();
    });
  });
});
