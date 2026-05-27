import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipToContent } from './SkipToContent';

/**
 * Unit tests for SkipToContent component
 *
 * Requirements: 15.1 - Provide keyboard navigation for all interactive elements
 */

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      skipToContent: 'Skip to main content',
    };
    return translations[key] || key;
  },
}));

describe('SkipToContent', () => {
  it('renders a link with the correct href', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('is visually hidden by default (has sr-only class)', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveClass('sr-only');
  });

  it('becomes visible when focused (has focus:not-sr-only class)', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveClass('focus:not-sr-only');
  });

  it('is accessible via keyboard tab navigation', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SkipToContent />
        <button>Other button</button>
      </div>
    );

    // Tab to the skip link
    await user.tab();
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveFocus();
  });

  it('has appropriate focus styling classes', () => {
    render(<SkipToContent />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveClass('focus:fixed');
    expect(link).toHaveClass('focus:z-[9999]');
    expect(link).toHaveClass('focus:ring-2');
    expect(link).toHaveClass('focus:ring-blue-500');
  });

  it('uses translated text from next-intl', () => {
    render(<SkipToContent />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });
});
