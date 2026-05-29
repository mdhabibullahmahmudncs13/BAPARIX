import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from './Header';
import { useRouter } from 'next/navigation';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock LanguageToggle
jest.mock('../ui/LanguageToggle', () => ({
  LanguageToggle: ({ className }: { className?: string }) => (
    <div className={className} data-testid="language-toggle">Language Toggle</div>
  ),
}));

describe('Header', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders search input', () => {
    render(<Header locale="en" />);
    
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders notification bell', () => {
    render(<Header locale="en" />);
    
    const notificationButton = screen.getByLabelText('notifications');
    expect(notificationButton).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    render(<Header locale="en" userName="John Doe" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });

  it('renders language toggle', () => {
    render(<Header locale="en" />);
    
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
  });

  it('shows notification count badge when count > 0', () => {
    render(<Header locale="en" notificationCount={5} />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows 9+ for notification count > 9', () => {
    render(<Header locale="en" notificationCount={15} />);
    
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('does not show notification badge when count is 0', () => {
    const { container } = render(<Header locale="en" notificationCount={0} />);
    
    const badge = container.querySelector('.bg-red-500');
    expect(badge).not.toBeInTheDocument();
  });

  it('handles search submission', () => {
    render(<Header locale="en" />);
    
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.submit(searchInput.closest('form')!);
    
    expect(mockPush).toHaveBeenCalledWith('/en/search?q=test%20query');
  });

  it('does not submit empty search', () => {
    render(<Header locale="en" />);
    
    const searchInput = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.submit(searchInput.closest('form')!);
    
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens user menu on click', () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('settings')).toBeInTheDocument();
    expect(screen.getByText('logout')).toBeInTheDocument();
  });

  it('closes user menu when clicking outside', async () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    
    expect(screen.getByText('profile')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('profile')).not.toBeInTheDocument();
    });
  });

  it('navigates to profile when profile menu item is clicked', () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    
    const profileButton = screen.getByText('profile');
    fireEvent.click(profileButton);
    
    expect(mockPush).toHaveBeenCalledWith('/en/settings/profile');
  });

  it('navigates to settings when settings menu item is clicked', () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    
    const settingsButton = screen.getByText('settings');
    fireEvent.click(settingsButton);
    
    expect(mockPush).toHaveBeenCalledWith('/en/settings');
  });

  it('navigates to login when logout is clicked', () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    
    const logoutButton = screen.getByText('logout');
    fireEvent.click(logoutButton);
    
    expect(mockPush).toHaveBeenCalledWith('/en/login');
  });

  it('navigates to notifications when bell is clicked', () => {
    render(<Header locale="en" />);
    
    const notificationButton = screen.getByLabelText('notifications');
    fireEvent.click(notificationButton);
    
    expect(mockPush).toHaveBeenCalledWith('/en/notifications');
  });

  it('focuses search input on Cmd+K', () => {
    render(<Header locale="en" />);
    
    const searchInput = screen.getByPlaceholderText('searchPlaceholder') as HTMLInputElement;
    
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    
    expect(document.activeElement).toBe(searchInput);
  });

  it('focuses search input on Ctrl+K', () => {
    render(<Header locale="en" />);
    
    const searchInput = screen.getByPlaceholderText('searchPlaceholder') as HTMLInputElement;
    
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    
    expect(document.activeElement).toBe(searchInput);
  });

  it('has proper ARIA attributes for user menu', () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
    expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(userMenuButton);
    
    expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('rotates chevron icon when menu is open', () => {
    const { container } = render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    const chevron = container.querySelector('.transition-transform');
    
    expect(chevron).not.toHaveClass('rotate-180');
    
    fireEvent.click(userMenuButton);
    
    expect(chevron).toHaveClass('rotate-180');
  });

  it('uses default userName when not provided', () => {
    render(<Header locale="en" />);
    
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('closes menu after selecting a menu item', () => {
    render(<Header locale="en" />);
    
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);
    
    expect(screen.getByText('profile')).toBeInTheDocument();
    
    const profileButton = screen.getByText('profile');
    fireEvent.click(profileButton);
    
    expect(screen.queryByText('profile')).not.toBeInTheDocument();
  });
});
