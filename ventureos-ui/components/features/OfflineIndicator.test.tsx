import { render, screen, fireEvent, act } from '@testing-library/react';
import { OfflineIndicator, SyncStatus } from './OfflineIndicator';

/**
 * Unit tests for OfflineIndicator component
 *
 * Requirements:
 * - 13.1: Display an offline mode indicator when connectivity is lost
 * - 13.6: Display a sync status indicator during synchronization
 */

// Mock useOnlineStatus hook
let mockIsOnline = true;
jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    isOnline: mockIsOnline,
    lastOnlineAt: mockIsOnline ? null : new Date(),
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      youAreOffline: 'You are offline',
      syncing: 'Syncing changes...',
      synced: 'All changes synced',
      syncFailed: 'Sync failed',
      dismiss: 'Dismiss',
    };
    return translations[key] || key;
  },
}));

describe('OfflineIndicator', () => {
  beforeEach(() => {
    mockIsOnline = true;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Offline state', () => {
    it('should display offline banner when user is offline', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      expect(screen.getByText('You are offline')).toBeInTheDocument();
    });

    it('should have role="alert" for accessibility', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      const indicator = screen.getByTestId('offline-indicator');
      expect(indicator).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live="assertive" for screen readers', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      const indicator = screen.getByTestId('offline-indicator');
      expect(indicator).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-atomic="true"', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      const indicator = screen.getByTestId('offline-indicator');
      expect(indicator).toHaveAttribute('aria-atomic', 'true');
    });

    it('should show dismiss button when onDismiss is provided', () => {
      mockIsOnline = false;
      const onDismiss = jest.fn();

      render(<OfflineIndicator onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      mockIsOnline = false;
      const onDismiss = jest.fn();

      render(<OfflineIndicator onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      fireEvent.click(screen.getByLabelText('Dismiss'));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Online state', () => {
    it('should not render when user is online and sync is idle', () => {
      mockIsOnline = true;

      render(<OfflineIndicator syncStatus="idle" />);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Sync status', () => {
    it('should display syncing message when syncStatus is syncing', () => {
      mockIsOnline = true;

      render(<OfflineIndicator syncStatus="syncing" />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(screen.getByText('Syncing changes...')).toBeInTheDocument();
    });

    it('should display sync failed message when syncStatus is failed', () => {
      mockIsOnline = true;

      render(<OfflineIndicator syncStatus="failed" />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(screen.getByText('Sync failed')).toBeInTheDocument();
    });

    it('should display synced message briefly when syncStatus is synced', () => {
      mockIsOnline = true;

      render(<OfflineIndicator syncStatus="synced" />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(screen.getByText('All changes synced')).toBeInTheDocument();
    });

    it('should auto-hide synced message after 2 seconds', () => {
      mockIsOnline = true;

      render(<OfflineIndicator syncStatus="synced" />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      expect(screen.getByText('All changes synced')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2300);
      });

      expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should apply translate-y-0 class when visible', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      const indicator = screen.getByTestId('offline-indicator');
      expect(indicator.className).toContain('translate-y-0');
    });

    it('should apply -translate-y-full class when hidden', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      // Initially before the timer fires, it should be hidden
      const indicator = screen.getByTestId('offline-indicator');
      expect(indicator.className).toContain('-translate-y-full');
    });
  });

  describe('Icons', () => {
    it('should render icons with aria-hidden="true"', () => {
      mockIsOnline = false;

      render(<OfflineIndicator />);

      act(() => {
        jest.advanceTimersByTime(20);
      });

      const svgs = screen.getByTestId('offline-indicator').querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
