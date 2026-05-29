import { render, screen } from '@testing-library/react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Breadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders home icon', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
    
    render(<Breadcrumb locale="en" />);
    
    const homeLink = screen.getByLabelText('Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/en/dashboard');
  });

  it('renders provided breadcrumb items', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
      { label: 'Profile', href: '/en/settings/profile' },
    ];

    render(<Breadcrumb items={items} locale="en" />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('generates breadcrumbs from pathname', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/settings/profile');
    
    render(<Breadcrumb locale="en" />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('converts kebab-case to Title Case', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/market-intelligence');
    
    render(<Breadcrumb locale="en" />);
    
    expect(screen.getByText('Market Intelligence')).toBeInTheDocument();
  });

  it('marks last item as current page', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
      { label: 'Profile', href: '/en/settings/profile' },
    ];

    render(<Breadcrumb items={items} locale="en" />);
    
    const profileItem = screen.getByText('Profile');
    expect(profileItem).toHaveAttribute('aria-current', 'page');
    expect(profileItem.tagName).toBe('SPAN');
  });

  it('renders intermediate items as links', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
      { label: 'Profile', href: '/en/settings/profile' },
    ];

    render(<Breadcrumb items={items} locale="en" />);
    
    const settingsLink = screen.getByText('Settings');
    expect(settingsLink.tagName).toBe('A');
    expect(settingsLink).toHaveAttribute('href', '/en/settings');
  });

  it('renders chevron separators', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
      { label: 'Profile', href: '/en/settings/profile' },
    ];

    const { container } = render(<Breadcrumb items={items} locale="en" />);
    
    // Check for all SVGs with aria-hidden (2 chevrons + 1 home icon from Heroicons)
    const hiddenSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBe(3);
  });

  it('does not render when no breadcrumbs', () => {
    (usePathname as jest.Mock).mockReturnValue('/en');
    
    const { container } = render(<Breadcrumb locale="en" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('handles nested paths correctly', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/settings/profile/edit');
    
    render(<Breadcrumb locale="en" />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('generates correct hrefs for nested paths', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/settings/profile/edit');
    
    render(<Breadcrumb locale="en" />);
    
    const settingsLink = screen.getByText('Settings');
    expect(settingsLink).toHaveAttribute('href', '/en/settings');
    
    const profileLink = screen.getByText('Profile');
    expect(profileLink).toHaveAttribute('href', '/en/settings/profile');
  });

  it('applies custom className', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
    ];

    const { container } = render(
      <Breadcrumb items={items} locale="en" className="custom-class" />
    );
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-class');
  });

  it('has proper ARIA label', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
    ];

    render(<Breadcrumb items={items} locale="en" />);
    
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('handles Bengali locale', () => {
    (usePathname as jest.Mock).mockReturnValue('/bn/settings/profile');
    
    render(<Breadcrumb locale="bn" />);
    
    const homeLink = screen.getByLabelText('Home');
    expect(homeLink).toHaveAttribute('href', '/bn/dashboard');
  });

  it('handles single breadcrumb item', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
    
    render(<Breadcrumb locale="en" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    const { container } = render(<Breadcrumb items={[]} locale="en" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders home icon with correct styling', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
    ];

    const { container } = render(<Breadcrumb items={items} locale="en" />);
    
    const homeIcon = container.querySelector('svg.w-4.h-4');
    expect(homeIcon).toBeInTheDocument();
  });

  it('applies hover styles to links', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
      { label: 'Profile', href: '/en/settings/profile' },
    ];

    render(<Breadcrumb items={items} locale="en" />);
    
    const settingsLink = screen.getByText('Settings');
    expect(settingsLink).toHaveClass('hover:text-gray-700');
  });

  it('does not apply hover styles to current page', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/en/settings' },
      { label: 'Profile', href: '/en/settings/profile' },
    ];

    render(<Breadcrumb items={items} locale="en" />);
    
    const profileItem = screen.getByText('Profile');
    expect(profileItem).not.toHaveClass('hover:text-gray-700');
    expect(profileItem).toHaveClass('text-gray-900', 'font-medium');
  });
});
