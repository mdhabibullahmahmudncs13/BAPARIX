import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Sidebar', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    locale: 'en',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
  });

  it('renders all navigation items', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('products')).toBeInTheDocument();
    expect(screen.getByText('marketIntelligence')).toBeInTheDocument();
    expect(screen.getByText('blueprint')).toBeInTheDocument();
    expect(screen.getByText('shipping')).toBeInTheDocument();
    expect(screen.getByText('financial')).toBeInTheDocument();
    expect(screen.getByText('seo')).toBeInTheDocument();
    expect(screen.getByText('team')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
    
    render(<Sidebar {...defaultProps} />);
    
    const dashboardLink = screen.getByText('dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('highlights active route for nested paths', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/settings/profile');
    
    render(<Sidebar {...defaultProps} />);
    
    const settingsLink = screen.getByText('settings').closest('a');
    expect(settingsLink).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('shows mobile overlay when open', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    
    const overlay = container.querySelector('.bg-black.bg-opacity-50');
    expect(overlay).toBeInTheDocument();
  });

  it('hides mobile overlay when closed', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);
    
    const overlay = container.querySelector('.bg-black.bg-opacity-50');
    expect(overlay).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    
    const overlay = container.querySelector('.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies correct translation when sidebar is open', () => {
    render(<Sidebar {...defaultProps} isOpen={true} />);
    
    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('applies correct translation when sidebar is closed', () => {
    render(<Sidebar {...defaultProps} isOpen={false} />);
    
    // Menu text should still be in DOM but hidden on mobile
    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('generates correct href for each navigation item', () => {
    render(<Sidebar {...defaultProps} locale="bn" />);
    
    const dashboardLink = screen.getByText('dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/bn/dashboard');
    
    const productsLink = screen.getByText('products').closest('a');
    expect(productsLink).toHaveAttribute('href', '/bn/products');
  });

  it('has proper ARIA labels', () => {
    render(<Sidebar {...defaultProps} />);
    
    expect(screen.getByLabelText('Sidebar navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('close')).toBeInTheDocument();
  });

  it('marks active link with aria-current', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
    
    render(<Sidebar {...defaultProps} />);
    
    const dashboardLink = screen.getByText('dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark inactive links with aria-current', () => {
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
    
    render(<Sidebar {...defaultProps} />);
    
    const productsLink = screen.getByText('products').closest('a');
    expect(productsLink).not.toHaveAttribute('aria-current');
  });

  it('applies correct CSS classes when open', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={true} />);
    
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('applies correct CSS classes when closed', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);
    
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('renders icons for all navigation items', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    
    // Check that SVG icons are rendered (Heroicons render as SVG)
    const icons = container.querySelectorAll('svg');
    // 9 nav items + 1 close button icon = 10 icons
    expect(icons.length).toBeGreaterThanOrEqual(9);
  });
});
