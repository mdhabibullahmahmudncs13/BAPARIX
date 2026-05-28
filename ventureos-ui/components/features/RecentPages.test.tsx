import { render, screen, fireEvent } from '@testing-library/react';
import {
  RecentPages,
  RecentPage,
  formatRelativeTime,
  getRecentPages,
  addRecentPage,
} from './RecentPages';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  );
});

const STORAGE_KEY = 'ventureos_recent_pages';

function createMockPages(count: number, baseTime = Date.now()): RecentPage[] {
  return Array.from({ length: count }, (_, i) => ({
    path: `/en/page-${i}`,
    title: `Page ${i}`,
    icon: 'dashboard',
    visitedAt: baseTime - i * 60000, // Each page 1 minute apart
  }));
}

describe('RecentPages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Empty State', () => {
    it('renders empty state when no recent pages exist', () => {
      render(<RecentPages />);

      expect(screen.getByTestId('recent-pages-empty')).toBeInTheDocument();
      expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('does not render a list when empty', () => {
      render(<RecentPages />);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Rendering Pages', () => {
    it('renders a list of recent pages from localStorage', () => {
      const pages = createMockPages(3);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('displays page titles', () => {
      const pages = createMockPages(2);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getByText('Page 0')).toBeInTheDocument();
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });

    it('renders clickable links with correct href', () => {
      const pages = createMockPages(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/en/page-0');
    });

    it('limits displayed pages to maxItems prop', () => {
      const pages = createMockPages(8);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages maxItems={3} />);

      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('defaults to showing 5 items maximum', () => {
      const pages = createMockPages(8);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });

    it('displays relative timestamps for each page', () => {
      const now = Date.now();
      const pages: RecentPage[] = [
        { path: '/en/recent', title: 'Recent', icon: 'dashboard', visitedAt: now - 120000 },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getByText('2 min ago')).toBeInTheDocument();
    });

    it('renders the section title', () => {
      const pages = createMockPages(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onPageClick when a page link is clicked', () => {
      const pages = createMockPages(2);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
      const onPageClick = jest.fn();

      render(<RecentPages onPageClick={onPageClick} />);

      fireEvent.click(screen.getAllByRole('link')[0]);

      expect(onPageClick).toHaveBeenCalledTimes(1);
      expect(onPageClick).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/en/page-0', title: 'Page 0' })
      );
    });

    it('does not throw when onPageClick is not provided', () => {
      const pages = createMockPages(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(() => {
        fireEvent.click(screen.getByRole('link'));
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label on the nav element', () => {
      const pages = createMockPages(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'ariaLabel');
    });

    it('uses role="list" on the list container', () => {
      const pages = createMockPages(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      render(<RecentPages />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('hides decorative icons from screen readers', () => {
      const pages = createMockPages(1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

      const { container } = render(<RecentPages />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});

describe('formatRelativeTime', () => {
  const now = 1700000000000;

  it('returns "justNow" for timestamps less than 60 seconds ago', () => {
    expect(formatRelativeTime(now - 30000, now)).toBe('justNow');
  });

  it('returns minutes for timestamps less than 60 minutes ago', () => {
    expect(formatRelativeTime(now - 120000, now)).toBe('2 min ago');
    expect(formatRelativeTime(now - 300000, now)).toBe('5 min ago');
  });

  it('returns hours for timestamps less than 24 hours ago', () => {
    expect(formatRelativeTime(now - 3600000, now)).toBe('1 hr ago');
    expect(formatRelativeTime(now - 7200000, now)).toBe('2 hr ago');
  });

  it('returns days for timestamps 24+ hours ago', () => {
    expect(formatRelativeTime(now - 86400000, now)).toBe('1 day ago');
    expect(formatRelativeTime(now - 172800000, now)).toBe('2 day ago');
  });
});

describe('getRecentPages', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no data in localStorage', () => {
    expect(getRecentPages()).toEqual([]);
  });

  it('returns pages sorted by visitedAt descending', () => {
    const pages: RecentPage[] = [
      { path: '/a', title: 'A', visitedAt: 100 },
      { path: '/c', title: 'C', visitedAt: 300 },
      { path: '/b', title: 'B', visitedAt: 200 },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

    const result = getRecentPages();
    expect(result[0].path).toBe('/c');
    expect(result[1].path).toBe('/b');
    expect(result[2].path).toBe('/a');
  });

  it('limits results to MAX_RECENT_PAGES (8)', () => {
    const pages = Array.from({ length: 12 }, (_, i) => ({
      path: `/page-${i}`,
      title: `Page ${i}`,
      visitedAt: Date.now() - i * 1000,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));

    expect(getRecentPages()).toHaveLength(8);
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    expect(getRecentPages()).toEqual([]);
  });
});

describe('addRecentPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a new page to localStorage', () => {
    addRecentPage({ path: '/en/dashboard', title: 'Dashboard', icon: 'dashboard' });

    const pages = getRecentPages();
    expect(pages).toHaveLength(1);
    expect(pages[0].path).toBe('/en/dashboard');
    expect(pages[0].title).toBe('Dashboard');
  });

  it('moves existing page to the top when revisited', () => {
    addRecentPage({ path: '/en/page-a', title: 'Page A' });
    addRecentPage({ path: '/en/page-b', title: 'Page B' });
    addRecentPage({ path: '/en/page-a', title: 'Page A' });

    const pages = getRecentPages();
    expect(pages[0].path).toBe('/en/page-a');
    expect(pages).toHaveLength(2);
  });

  it('limits stored pages to MAX_RECENT_PAGES', () => {
    for (let i = 0; i < 12; i++) {
      addRecentPage({ path: `/page-${i}`, title: `Page ${i}` });
    }

    expect(getRecentPages()).toHaveLength(8);
  });
});
