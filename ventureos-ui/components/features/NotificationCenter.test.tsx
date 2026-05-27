import { render, screen, fireEvent } from '@testing-library/react';
import {
  NotificationCenter,
  NotificationBadge,
  Notification,
} from './NotificationCenter';

// next-intl is globally mocked in jest.setup.ts to return the key as the value
// So t('title') renders "title", t('markAllAsRead') renders "markAllAsRead", etc.

const now = new Date();
// Use a time that's definitely "today" (noon today) to avoid midnight boundary issues
const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
const oneHourAgo = todayNoon.getTime() <= now.getTime()
  ? todayNoon
  : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 30, 0);
const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);

const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user-1',
    type: 'price_drop',
    title: 'Price Drop Alert',
    message: 'Wireless earbuds price dropped by 20%',
    priority: 'high',
    read: false,
    actionUrl: '/products/123',
    actionLabel: 'View Product',
    createdAt: oneHourAgo,
  },
  {
    id: '2',
    userId: 'user-1',
    type: 'trend_alert',
    title: 'New Trend Detected',
    message: 'Summer fashion is trending in Dhaka region',
    priority: 'medium',
    read: true,
    createdAt: oneHourAgo,
  },
  {
    id: '3',
    userId: 'user-1',
    type: 'reorder',
    title: 'Reorder Reminder',
    message: 'Stock for phone cases is running low',
    priority: 'low',
    read: false,
    createdAt: yesterday,
  },
  {
    id: '4',
    userId: 'user-1',
    type: 'team_activity',
    title: 'Team Update',
    message: 'Ahmed joined the workspace',
    priority: 'low',
    read: true,
    createdAt: yesterday,
  },
  {
    id: '5',
    userId: 'user-1',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight at 2 AM',
    priority: 'medium',
    read: true,
    createdAt: yesterday,
  },
];

describe('NotificationCenter', () => {
  describe('Rendering', () => {
    it('should render the notification center with title', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      // t('title') returns 'title' due to global mock
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should display unread count badge', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      // 2 unread notifications (id 1 and 3)
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not display unread badge when all are read', () => {
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      render(<NotificationCenter notifications={allRead} />);

      // No unread count badge should be present
      expect(screen.queryByLabelText(/unread notifications/)).not.toBeInTheDocument();
    });

    it('should display notifications grouped by date', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('should display notification title and message', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      expect(screen.getByText('Price Drop Alert')).toBeInTheDocument();
      expect(screen.getByText('Wireless earbuds price dropped by 20%')).toBeInTheDocument();
    });

    it('should display action label when present', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      expect(screen.getByText('View Product')).toBeInTheDocument();
    });

    it('should display high priority badge', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      // t('priority.high') returns 'priority.high' due to global mock
      expect(screen.getByText('priority.high')).toBeInTheDocument();
    });

    it('should visually distinguish unread notifications', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      const unreadItem = screen.getByLabelText('Unread: Price Drop Alert');
      expect(unreadItem).toHaveClass('bg-blue-50/50');
    });

    it('should show unread dot indicator for unread notifications', () => {
      const { container } = render(
        <NotificationCenter notifications={mockNotifications} />
      );

      const unreadDots = container.querySelectorAll('.bg-blue-600.rounded-full');
      expect(unreadDots.length).toBe(2); // 2 unread notifications
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no notifications', () => {
      render(<NotificationCenter notifications={[]} />);

      // t('empty') returns 'empty' due to global mock
      expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('should not display Mark all as read button when empty', () => {
      render(
        <NotificationCenter notifications={[]} onMarkAllAsRead={jest.fn()} />
      );

      expect(screen.queryByText('markAllAsRead')).not.toBeInTheDocument();
    });
  });

  describe('Mark All as Read', () => {
    it('should display Mark all as read button when there are unread notifications', () => {
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onMarkAllAsRead={jest.fn()}
        />
      );

      // t('markAllAsRead') returns 'markAllAsRead' due to global mock
      expect(screen.getByText('markAllAsRead')).toBeInTheDocument();
    });

    it('should call onMarkAllAsRead when button is clicked', () => {
      const onMarkAllAsRead = jest.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onMarkAllAsRead={onMarkAllAsRead}
        />
      );

      fireEvent.click(screen.getByText('markAllAsRead'));
      expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
    });

    it('should not display Mark all as read when all notifications are read', () => {
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      render(
        <NotificationCenter notifications={allRead} onMarkAllAsRead={jest.fn()} />
      );

      expect(screen.queryByText('markAllAsRead')).not.toBeInTheDocument();
    });
  });

  describe('Notification Click', () => {
    it('should call onNotificationClick when a notification is clicked', () => {
      const onNotificationClick = jest.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onNotificationClick={onNotificationClick}
        />
      );

      fireEvent.click(screen.getByLabelText('Unread: Price Drop Alert'));
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it('should call onMarkAsRead when an unread notification is clicked', () => {
      const onMarkAsRead = jest.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onMarkAsRead={onMarkAsRead}
        />
      );

      fireEvent.click(screen.getByLabelText('Unread: Price Drop Alert'));
      expect(onMarkAsRead).toHaveBeenCalledWith('1');
    });

    it('should not call onMarkAsRead when a read notification is clicked', () => {
      const onMarkAsRead = jest.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onMarkAsRead={onMarkAsRead}
        />
      );

      fireEvent.click(screen.getByLabelText('New Trend Detected'));
      expect(onMarkAsRead).not.toHaveBeenCalled();
    });

    it('should be keyboard accessible with Enter key', () => {
      const onNotificationClick = jest.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onNotificationClick={onNotificationClick}
        />
      );

      const item = screen.getByLabelText('Unread: Price Drop Alert');
      fireEvent.keyDown(item, { key: 'Enter' });
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });

    it('should be keyboard accessible with Space key', () => {
      const onNotificationClick = jest.fn();
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onNotificationClick={onNotificationClick}
        />
      );

      const item = screen.getByLabelText('Unread: Price Drop Alert');
      fireEvent.keyDown(item, { key: ' ' });
      expect(onNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);
    });
  });

  describe('Notification Types', () => {
    it('should render all notification type icons', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      // All 5 notifications should be rendered
      expect(screen.getByText('Price Drop Alert')).toBeInTheDocument();
      expect(screen.getByText('New Trend Detected')).toBeInTheDocument();
      expect(screen.getByText('Reorder Reminder')).toBeInTheDocument();
      expect(screen.getByText('Team Update')).toBeInTheDocument();
      expect(screen.getByText('System Maintenance')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have a list role for the notification container', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      // t('title') returns 'title' due to global mock
      expect(screen.getByRole('list', { name: 'title' })).toBeInTheDocument();
    });

    it('should have listitem roles for each notification', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      const items = screen.getAllByRole('listitem');
      expect(items.length).toBe(5);
    });

    it('should have proper aria-labels on notification items', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      expect(screen.getByLabelText('Unread: Price Drop Alert')).toBeInTheDocument();
      expect(screen.getByLabelText('New Trend Detected')).toBeInTheDocument();
    });

    it('should have tabIndex on notification items for keyboard navigation', () => {
      render(<NotificationCenter notifications={mockNotifications} />);

      const items = screen.getAllByRole('listitem');
      items.forEach((item) => {
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });
  });
});

describe('NotificationBadge', () => {
  it('should render bell icon', () => {
    render(<NotificationBadge count={0} />);

    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('should display count when greater than 0', () => {
    render(<NotificationBadge count={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications, 5 unread')).toBeInTheDocument();
  });

  it('should not display count badge when count is 0', () => {
    render(<NotificationBadge count={0} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should display 99+ when count exceeds 99', () => {
    render(<NotificationBadge count={150} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<NotificationBadge count={3} onClick={onClick} />);

    fireEvent.click(screen.getByLabelText('Notifications, 3 unread'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have proper focus styles for accessibility', () => {
    render(<NotificationBadge count={2} />);

    const button = screen.getByLabelText('Notifications, 2 unread');
    expect(button).toHaveClass('focus:outline-none');
    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-blue-500');
  });
});
