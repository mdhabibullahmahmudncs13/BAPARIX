import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LiteModeToggle } from './LiteModeToggle';
import { useLiteModeStore } from '@/lib/stores/liteModeStore';
import { act } from '@testing-library/react';

const mockMessages = {
  settings: {
    liteMode: {
      label: 'Lite Mode',
      description: 'Reduce data usage by 70% through image compression and reduced API calls.',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={mockMessages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('LiteModeToggle', () => {
  beforeEach(() => {
    act(() => {
      useLiteModeStore.setState({ isLiteMode: false });
    });
  });

  it('should render the toggle with label and description', () => {
    renderWithIntl(<LiteModeToggle />);

    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('should render a switch role element', () => {
    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('should show unchecked state when lite mode is off', () => {
    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('should show checked state when lite mode is on', () => {
    act(() => {
      useLiteModeStore.setState({ isLiteMode: true });
    });

    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('should toggle lite mode when clicked', () => {
    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(useLiteModeStore.getState().isLiteMode).toBe(true);
  });

  it('should toggle lite mode off when clicked again', () => {
    act(() => {
      useLiteModeStore.setState({ isLiteMode: true });
    });

    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(useLiteModeStore.getState().isLiteMode).toBe(false);
  });

  it('should have proper aria-label', () => {
    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', 'label');
  });

  it('should apply custom className', () => {
    const { container } = renderWithIntl(<LiteModeToggle className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have visual indicator classes when enabled', () => {
    act(() => {
      useLiteModeStore.setState({ isLiteMode: true });
    });

    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('bg-blue-600');
  });

  it('should have visual indicator classes when disabled', () => {
    renderWithIntl(<LiteModeToggle />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('bg-gray-200');
  });
});
