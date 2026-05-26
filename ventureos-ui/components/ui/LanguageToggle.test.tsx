import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageToggle } from './LanguageToggle';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('LanguageToggle', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
  });

  it('renders both language buttons', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    render(<LanguageToggle />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('বাংলা')).toBeInTheDocument();
  });

  it('highlights the current locale button', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    render(<LanguageToggle />);
    
    const englishButton = screen.getByText('English');
    const bengaliButton = screen.getByText('বাংলা');
    
    expect(englishButton).toHaveClass('bg-blue-600', 'text-white');
    expect(bengaliButton).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('switches locale when clicking Bengali button', async () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
    
    render(<LanguageToggle />);
    
    const bengaliButton = screen.getByText('বাংলা');
    fireEvent.click(bengaliButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/bn/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('switches locale when clicking English button', async () => {
    (useLocale as jest.Mock).mockReturnValue('bn');
    (usePathname as jest.Mock).mockReturnValue('/bn/settings/profile');
    
    render(<LanguageToggle />);
    
    const englishButton = screen.getByText('English');
    fireEvent.click(englishButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/settings/profile');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('sets cookie when switching locale', async () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    
    render(<LanguageToggle />);
    
    const bengaliButton = screen.getByText('বাংলা');
    fireEvent.click(bengaliButton);
    
    await waitFor(() => {
      expect(document.cookie).toContain('NEXT_LOCALE=bn');
    });
  });

  it('disables current locale button', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    render(<LanguageToggle />);
    
    const englishButton = screen.getByText('English');
    expect(englishButton).toBeDisabled();
  });

  it('has proper ARIA labels', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    render(<LanguageToggle />);
    
    expect(screen.getByLabelText('Switch to English')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to Bengali')).toBeInTheDocument();
  });

  it('has proper ARIA pressed state', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    render(<LanguageToggle />);
    
    const englishButton = screen.getByText('English');
    const bengaliButton = screen.getByText('বাংলা');
    
    expect(englishButton).toHaveAttribute('aria-pressed', 'true');
    expect(bengaliButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies custom className', () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    const { container } = render(<LanguageToggle className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles nested paths correctly', async () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    (usePathname as jest.Mock).mockReturnValue('/en/settings/profile/edit');
    
    render(<LanguageToggle />);
    
    const bengaliButton = screen.getByText('বাংলা');
    fireEvent.click(bengaliButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/bn/settings/profile/edit');
    });
  });

  it('updates within 200ms', async () => {
    (useLocale as jest.Mock).mockReturnValue('en');
    
    const startTime = Date.now();
    render(<LanguageToggle />);
    
    const bengaliButton = screen.getByText('বাংলা');
    fireEvent.click(bengaliButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should update quickly (within 200ms requirement)
    expect(duration).toBeLessThan(200);
  });
});
