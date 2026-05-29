import { render, screen, fireEvent } from '@testing-library/react';
import {
  NotificationPreferences,
  NotificationPreferencesState,
  NotificationType,
} from './NotificationPreferences';

// next-intl is globally mocked in jest.setup.ts to return the key as the value
// So t('title') renders "title", t('types.price_drop') renders "types.price_drop", etc.

const defaultPreferences: NotificationPreferencesState = {
  price_drop: true,
  trend_alert: true,
  reorder: true,
  team_activity: false,
  system: true,
};

describe('NotificationPreferences', () => {
  describe('Rendering', () => {
    it('should render the preferences title', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      // t('title') returns 'title' due to global mock
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      // t('subtitle') returns 'subtitle' due to global mock
      expect(screen.getByText('subtitle')).toBeInTheDocument();
    });

    it('should render all notification type labels', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      // t('types.price_drop') returns 'types.price_drop' etc.
      expect(screen.getByText('types.price_drop')).toBeInTheDocument();
      expect(screen.getByText('types.trend_alert')).toBeInTheDocument();
      expect(screen.getByText('types.reorder')).toBeInTheDocument();
      expect(screen.getByText('types.team_activity')).toBeInTheDocument();
      expect(screen.getByText('types.system')).toBeInTheDocument();
    });

    it('should render descriptions for each notification type', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      expect(screen.getByText('descriptions.price_drop')).toBeInTheDocument();
      expect(screen.getByText('descriptions.trend_alert')).toBeInTheDocument();
      expect(screen.getByText('descriptions.reorder')).toBeInTheDocument();
      expect(screen.getByText('descriptions.team_activity')).toBeInTheDocument();
      expect(screen.getByText('descriptions.system')).toBeInTheDocument();
    });

    it('should render toggle switches for each type', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(5);
    });
  });

  describe('Toggle State', () => {
    it('should reflect enabled preferences with aria-checked true', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      // aria-label is t('types.price_drop') + ' notifications' = 'types.price_drop notifications'
      const priceDropSwitch = screen.getByLabelText('types.price_drop notifications');
      expect(priceDropSwitch).toHaveAttribute('aria-checked', 'true');
    });

    it('should reflect disabled preferences with aria-checked false', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const teamSwitch = screen.getByLabelText('types.team_activity notifications');
      expect(teamSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('should show enabled toggle with blue background', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const priceDropSwitch = screen.getByLabelText('types.price_drop notifications');
      expect(priceDropSwitch).toHaveClass('bg-blue-600');
    });

    it('should show disabled toggle with gray background', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const teamSwitch = screen.getByLabelText('types.team_activity notifications');
      expect(teamSwitch).toHaveClass('bg-gray-200');
    });
  });

  describe('Toggle Interaction', () => {
    it('should call onPreferenceChange when a toggle is clicked', () => {
      const onPreferenceChange = jest.fn();
      render(
        <NotificationPreferences
          preferences={defaultPreferences}
          onPreferenceChange={onPreferenceChange}
        />
      );

      const priceDropSwitch = screen.getByLabelText('types.price_drop notifications');
      fireEvent.click(priceDropSwitch);

      expect(onPreferenceChange).toHaveBeenCalledWith('price_drop', false);
    });

    it('should toggle from disabled to enabled', () => {
      const onPreferenceChange = jest.fn();
      render(
        <NotificationPreferences
          preferences={defaultPreferences}
          onPreferenceChange={onPreferenceChange}
        />
      );

      const teamSwitch = screen.getByLabelText('types.team_activity notifications');
      fireEvent.click(teamSwitch);

      expect(onPreferenceChange).toHaveBeenCalledWith('team_activity', true);
    });

    it('should call onPreferenceChange with correct type for each toggle', () => {
      const onPreferenceChange = jest.fn();
      render(
        <NotificationPreferences
          preferences={defaultPreferences}
          onPreferenceChange={onPreferenceChange}
        />
      );

      const types: NotificationType[] = [
        'price_drop',
        'trend_alert',
        'reorder',
        'team_activity',
        'system',
      ];
      const labels = [
        'types.price_drop notifications',
        'types.trend_alert notifications',
        'types.reorder notifications',
        'types.team_activity notifications',
        'types.system notifications',
      ];

      labels.forEach((label, index) => {
        fireEvent.click(screen.getByLabelText(label));
        expect(onPreferenceChange).toHaveBeenCalledWith(
          types[index],
          !defaultPreferences[types[index]]
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have a group role with proper label', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      // t('title') returns 'title' due to global mock
      expect(screen.getByRole('group', { name: 'title' })).toBeInTheDocument();
    });

    it('should have proper aria-label on each toggle', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      expect(screen.getByLabelText('types.price_drop notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('types.trend_alert notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('types.reorder notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('types.team_activity notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('types.system notifications')).toBeInTheDocument();
    });

    it('should have focus ring styles on toggles', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const switches = screen.getAllByRole('switch');
      switches.forEach((toggle) => {
        expect(toggle).toHaveClass('focus:outline-none');
        expect(toggle).toHaveClass('focus:ring-2');
        expect(toggle).toHaveClass('focus:ring-blue-500');
      });
    });

    it('should have button type on toggles', () => {
      render(<NotificationPreferences preferences={defaultPreferences} />);

      const switches = screen.getAllByRole('switch');
      switches.forEach((toggle) => {
        expect(toggle).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('All Preferences Disabled', () => {
    it('should render all toggles as disabled when all preferences are false', () => {
      const allDisabled: NotificationPreferencesState = {
        price_drop: false,
        trend_alert: false,
        reorder: false,
        team_activity: false,
        system: false,
      };

      render(<NotificationPreferences preferences={allDisabled} />);

      const switches = screen.getAllByRole('switch');
      switches.forEach((toggle) => {
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        expect(toggle).toHaveClass('bg-gray-200');
      });
    });
  });

  describe('All Preferences Enabled', () => {
    it('should render all toggles as enabled when all preferences are true', () => {
      const allEnabled: NotificationPreferencesState = {
        price_drop: true,
        trend_alert: true,
        reorder: true,
        team_activity: true,
        system: true,
      };

      render(<NotificationPreferences preferences={allEnabled} />);

      const switches = screen.getAllByRole('switch');
      switches.forEach((toggle) => {
        expect(toggle).toHaveAttribute('aria-checked', 'true');
        expect(toggle).toHaveClass('bg-blue-600');
      });
    });
  });
});
