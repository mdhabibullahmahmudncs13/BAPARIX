import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearch } from './GlobalSearch';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('GlobalSearch', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders the search trigger button', () => {
      render(<GlobalSearch />);

      const button = screen.getByRole('button', { name: 'openSearch' });
      expect(button).toBeInTheDocument();
    });

    it('displays placeholder text in the trigger button', () => {
      render(<GlobalSearch />);

      expect(screen.getByText('placeholder')).toBeInTheDocument();
    });

    it('displays keyboard shortcut hint', () => {
      render(<GlobalSearch />);

      // The shortcut hint should be visible (⌘K or Ctrl+K depending on platform)
      const kbd = screen.getByRole('button', { name: 'openSearch' }).querySelector('kbd');
      expect(kbd).toBeInTheDocument();
    });

    it('renders search icon in the trigger button', () => {
      const { container } = render(<GlobalSearch />);

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('does not render the modal by default', () => {
      render(<GlobalSearch />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Modal Opening', () => {
    it('opens the search modal when trigger button is clicked', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('opens the search modal on Cmd+K', () => {
      render(<GlobalSearch />);

      fireEvent.keyDown(window, { key: 'k', metaKey: true });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('opens the search modal on Ctrl+K', () => {
      render(<GlobalSearch />);

      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('focuses the search input when modal opens', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      act(() => {
        jest.runAllTimers();
      });

      const input = screen.getByLabelText('searchInput');
      expect(input).toHaveFocus();
    });
  });

  describe('Modal Closing', () => {
    it('closes the modal when close button is clicked', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('closeSearch'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the modal when Escape key is pressed', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the modal when backdrop is clicked', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Click on the backdrop (the overlay div)
      fireEvent.click(screen.getByRole('dialog'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('toggles modal with Cmd+K when already open', () => {
      render(<GlobalSearch />);

      // Open
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('resets query when modal is closed', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      fireEvent.change(input, { target: { value: 'test query' } });
      expect(input).toHaveValue('test query');

      fireEvent.click(screen.getByLabelText('closeSearch'));

      // Reopen and check query is reset
      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));
      expect(screen.getByLabelText('searchInput')).toHaveValue('');
    });
  });

  describe('Search Input', () => {
    it('updates query value as user types', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      fireEvent.change(input, { target: { value: 'hello' } });

      expect(input).toHaveValue('hello');
    });

    it('shows hint text when query is empty', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      expect(screen.getByText('hint')).toBeInTheDocument();
    });

    it('shows no results message after debounce when query has value', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      fireEvent.change(input, { target: { value: 'test' } });

      // After debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.getByText('noResults')).toBeInTheDocument();
    });
  });

  describe('Debounced Search Callback', () => {
    it('calls onSearch after debounce delay', () => {
      const onSearch = jest.fn();
      render(<GlobalSearch onSearch={onSearch} debounceMs={300} />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      fireEvent.change(input, { target: { value: 'test query' } });

      // Should not be called immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Advance timers past debounce delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onSearch).toHaveBeenCalledWith('test query');
    });

    it('does not call onSearch for empty query', () => {
      const onSearch = jest.fn();
      render(<GlobalSearch onSearch={onSearch} debounceMs={300} />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      fireEvent.change(input, { target: { value: '' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('debounces rapid input changes', () => {
      const onSearch = jest.fn();
      render(<GlobalSearch onSearch={onSearch} debounceMs={300} />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');

      // Type rapidly
      fireEvent.change(input, { target: { value: 't' } });
      act(() => { jest.advanceTimersByTime(100); });

      fireEvent.change(input, { target: { value: 'te' } });
      act(() => { jest.advanceTimersByTime(100); });

      fireEvent.change(input, { target: { value: 'tes' } });
      act(() => { jest.advanceTimersByTime(100); });

      fireEvent.change(input, { target: { value: 'test' } });

      // Should not have been called yet
      expect(onSearch).not.toHaveBeenCalled();

      // Advance past debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should only be called once with the final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('uses custom debounce delay', () => {
      const onSearch = jest.fn();
      render(<GlobalSearch onSearch={onSearch} debounceMs={500} />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      fireEvent.change(input, { target: { value: 'test' } });

      // Not called at 300ms
      act(() => { jest.advanceTimersByTime(300); });
      expect(onSearch).not.toHaveBeenCalled();

      // Called at 500ms
      act(() => { jest.advanceTimersByTime(200); });
      expect(onSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('Accessibility', () => {
    it('has role="search" on the search input area', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('has aria-modal="true" on the dialog', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label on the dialog', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'searchModal');
    });

    it('has aria-label on the search input', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const input = screen.getByLabelText('searchInput');
      expect(input).toBeInTheDocument();
    });

    it('has aria-label on the close button', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      expect(screen.getByLabelText('closeSearch')).toBeInTheDocument();
    });

    it('has aria-label on the trigger button', () => {
      render(<GlobalSearch />);

      expect(screen.getByRole('button', { name: 'openSearch' })).toBeInTheDocument();
    });

    it('hides decorative icons from screen readers', () => {
      render(<GlobalSearch />);

      fireEvent.click(screen.getByRole('button', { name: 'openSearch' }));

      const { container } = render(<GlobalSearch />);
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
