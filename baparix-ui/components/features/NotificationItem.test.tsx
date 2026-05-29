import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from './NotificationItem';
import type { Notification } from './NotificationCenter';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
const twoHoursAgo = new Date(now.getTime() - 2 * 3600000);

const priceDrop: Notification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'price_drop',
  title: 'Price Drop: Wireless Earbuds',
  message: 'The price has dropped significantly',
  data: {
    productName: 'Wireless Earbuds Pro',
    oldPrice: 2500,
    newPrice: 2000,
    percentageDrop: 20,
  },
  priority: 'high',
  read: false,
  actionUrl: '/products/earbuds-123',
  actionLabel: 'View Product',
  createdAt: fiveMinutesAgo,
};

const trendAlert: Notification = {
  id: 'notif-2',
  userId: 'user-1',
  type: 'trend_alert',
  title: 'New Trend: Summer Fashion',
  message: 'Summer fashion is trending in Dhaka',
  data: {
    trendName: 'Summer Fashion 2024',
    category: 'Clothing',
    trajectory: 'rising',
  },
  priority: 'medium',
  read: true,
  actionUrl: '/market-intelligence/trends/summer',
  createdAt: twoHoursAgo,
};

const reorderAlert: Notification = {
  id: 'notif-3',
  userId: 'user-1',
  type: 'reorder',
  title: 'Reorder: Phone Cases',
  message: 'Stock is running low for phone cases',
  data: {
    productName: 'iPhone 15 Cases',
    currentStock: 5,
    reorderThreshold: 20,
  },
  priority: 'high',
  read: false,
  actionUrl: '/inventory/phone-cases',
  createdAt: fiveMinutesAgo,
};

describe('NotificationItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe('Price Drop Notification', () => {
    it('should render price drop notification with green highlight', () => {
      const { container } = render(<NotificationItem notification={priceDrop} />);

      const article = container.querySelector('[role="article"]');
      expect(article).toHaveClass('border-l-green-500');
      expect(article).toHaveClass('bg-green-50');
    });

    it('should display product name, old price, new price, and percentage drop', () => {
      render(<NotificationItem notification={priceDrop} />);

      expect(screen.getByText('Wireless Earbuds Pro')).toBeInTheDocument();
      expect(screen.getByText('৳2500')).toBeInTheDocument();
      expect(screen.getByText('৳2000')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
    });

    it('should show old price with line-through styling', () => {
      render(<NotificationItem notification={priceDrop} />);

      const oldPrice = screen.getByText('৳2500');
      expect(oldPrice).toHaveClass('line-through');
    });

    it('should display the notification title and message', () => {
      render(<NotificationItem notification={priceDrop} />);

      expect(screen.getByText('Price Drop: Wireless Earbuds')).toBeInTheDocument();
      expect(screen.getByText('The price has dropped significantly')).toBeInTheDocument();
    });
  });

  describe('Trend Alert Notification', () => {
    it('should render trend alert notification with blue highlight', () => {
      const { container } = render(<NotificationItem notification={trendAlert} />);

      const article = container.querySelector('[role="article"]');
      expect(article).toHaveClass('border-l-blue-500');
      expect(article).toHaveClass('bg-blue-50');
    });

    it('should display trend name, category, and trajectory', () => {
      render(<NotificationItem notification={trendAlert} />);

      expect(screen.getByText('Summer Fashion 2024')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
      expect(screen.getByText(/rising/)).toBeInTheDocument();
    });

    it('should show rising trajectory indicator', () => {
      render(<NotificationItem notification={trendAlert} />);

      expect(screen.getByText(/↑/)).toBeInTheDocument();
    });

    it('should show declining trajectory icon when trajectory is declining', () => {
      const declining: Notification = {
        ...trendAlert,
        data: { ...trendAlert.data, trajectory: 'declining' },
      };
      render(<NotificationItem notification={declining} />);

      expect(screen.getByText(/↓/)).toBeInTheDocument();
    });
  });

  describe('Reorder Notification', () => {
    it('should render reorder notification with orange highlight', () => {
      const { container } = render(<NotificationItem notification={reorderAlert} />);

      const article = container.querySelector('[role="article"]');
      expect(article).toHaveClass('border-l-orange-500');
      expect(article).toHaveClass('bg-orange-50');
    });

    it('should display product name, current stock, and reorder threshold', () => {
      render(<NotificationItem notification={reorderAlert} />);

      expect(screen.getByText('iPhone 15 Cases')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should display stock and threshold labels', () => {
      render(<NotificationItem notification={reorderAlert} />);

      expect(screen.getByText('Stock:')).toBeInTheDocument();
      expect(screen.getByText('Threshold:')).toBeInTheDocument();
    });
  });

  describe('Click-to-Navigate', () => {
    it('should navigate to actionUrl when clicked', () => {
      render(<NotificationItem notification={priceDrop} />);

      const article = screen.getByRole('article');
      fireEvent.click(article);

      expect(mockPush).toHaveBeenCalledWith('/products/earbuds-123');
    });

    it('should call onClick callback when clicked', () => {
      const onClick = jest.fn();
      render(<NotificationItem notification={priceDrop} onClick={onClick} />);

      const article = screen.getByRole('article');
      fireEvent.click(article);

      expect(onClick).toHaveBeenCalledWith(priceDrop);
    });

    it('should navigate on Enter key press', () => {
      render(<NotificationItem notification={trendAlert} />);

      const article = screen.getByRole('article');
      fireEvent.keyDown(article, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalledWith('/market-intelligence/trends/summer');
    });

    it('should navigate on Space key press', () => {
      render(<NotificationItem notification={reorderAlert} />);

      const article = screen.getByRole('article');
      fireEvent.keyDown(article, { key: ' ' });

      expect(mockPush).toHaveBeenCalledWith('/inventory/phone-cases');
    });

    it('should not navigate when no actionUrl is provided', () => {
      const noUrl: Notification = { ...priceDrop, actionUrl: undefined };
      render(<NotificationItem notification={noUrl} />);

      const article = screen.getByRole('article');
      fireEvent.click(article);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Timestamp', () => {
    it('should display relative timestamp', () => {
      render(<NotificationItem notification={priceDrop} />);

      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });

    it('should display hours for older notifications', () => {
      render(<NotificationItem notification={trendAlert} />);

      expect(screen.getByText('2h ago')).toBeInTheDocument();
    });

    it('should render a time element with ISO datetime', () => {
      const { container } = render(<NotificationItem notification={priceDrop} />);

      const timeEl = container.querySelector('time');
      expect(timeEl).toBeInTheDocument();
      expect(timeEl).toHaveAttribute('datetime');
    });
  });

  describe('Dismiss Button', () => {
    it('should render dismiss button when onDismiss is provided', () => {
      render(<NotificationItem notification={priceDrop} onDismiss={jest.fn()} />);

      // t('dismiss') returns 'dismiss' due to global mock
      expect(screen.getByLabelText('dismiss')).toBeInTheDocument();
    });

    it('should not render dismiss button when onDismiss is not provided', () => {
      render(<NotificationItem notification={priceDrop} />);

      expect(screen.queryByLabelText('dismiss')).not.toBeInTheDocument();
    });

    it('should call onDismiss with notification id when dismiss is clicked', () => {
      const onDismiss = jest.fn();
      render(<NotificationItem notification={priceDrop} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByLabelText('dismiss'));

      expect(onDismiss).toHaveBeenCalledWith('notif-1');
    });

    it('should not trigger navigation when dismiss is clicked', () => {
      const onDismiss = jest.fn();
      render(<NotificationItem notification={priceDrop} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByLabelText('dismiss'));

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle dismiss via keyboard', () => {
      const onDismiss = jest.fn();
      render(<NotificationItem notification={priceDrop} onDismiss={onDismiss} />);

      const dismissBtn = screen.getByLabelText('dismiss');
      fireEvent.keyDown(dismissBtn, { key: 'Enter' });

      expect(onDismiss).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('Animation', () => {
    it('should apply animation class when isNew is true', () => {
      const { container } = render(
        <NotificationItem notification={priceDrop} isNew={true} />
      );

      const article = container.querySelector('[role="article"]');
      expect(article).toHaveClass('animate-slideIn');
    });

    it('should not apply animation class when isNew is false', () => {
      const { container } = render(
        <NotificationItem notification={priceDrop} isNew={false} />
      );

      const article = container.querySelector('[role="article"]');
      expect(article).not.toHaveClass('animate-slideIn');
    });
  });

  describe('Accessibility', () => {
    it('should have role="article" on the notification container', () => {
      render(<NotificationItem notification={priceDrop} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should have aria-label with notification title', () => {
      render(<NotificationItem notification={priceDrop} />);

      expect(
        screen.getByLabelText('Price Drop: Wireless Earbuds')
      ).toBeInTheDocument();
    });

    it('should be focusable with tabIndex', () => {
      render(<NotificationItem notification={priceDrop} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('tabindex', '0');
    });

    it('should have focus ring styles for keyboard navigation', () => {
      const { container } = render(<NotificationItem notification={priceDrop} />);

      const article = container.querySelector('[role="article"]');
      expect(article).toHaveClass('focus:ring-2');
      expect(article).toHaveClass('focus:ring-blue-500');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<NotificationItem notification={priceDrop} />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Read/Unread State', () => {
    it('should show semibold title for unread notifications', () => {
      render(<NotificationItem notification={priceDrop} />);

      const title = screen.getByText('Price Drop: Wireless Earbuds');
      expect(title).toHaveClass('font-semibold');
    });

    it('should show medium weight title for read notifications', () => {
      render(<NotificationItem notification={trendAlert} />);

      const title = screen.getByText('New Trend: Summer Fashion');
      expect(title).toHaveClass('font-medium');
    });
  });
});
