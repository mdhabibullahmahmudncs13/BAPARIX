import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileSettingsPage from './page';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/lib/hooks/useAuth');

// Mock useTranslations
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'profile.title': 'Profile Settings',
      'profile.personalInfo': 'Personal Information',
      'profile.businessInfo': 'Business Information',
      'profile.preferences': 'Preferences',
      'profile.subscription': 'Subscription & Usage',
      'profile.name': 'Full Name',
      'profile.email': 'Email Address',
      'profile.phone': 'Phone Number',
      'profile.businessName': 'Business Name',
      'profile.businessType': 'Business Type',
      'profile.location': 'Location',
      'profile.teamSize': 'Team Size',
      'profile.warehouseCapacity': 'Warehouse Capacity (optional)',
      'profile.language': 'Language Preference',
      'profile.currency': 'Currency Preference',
      'profile.currentPlan': 'Current Plan',
      'profile.usageQuota': 'Usage Quota',
      'profile.blueprintsUsed': 'Blueprints Generated',
      'profile.apiCallsUsed': 'API Calls Used',
      'profile.of': 'of',
      'profile.updateProfile': 'Update Profile',
      'profile.profileUpdated': 'Profile updated successfully',
      'profile.updateFailed': 'Failed to update profile',
      'profile.businessTypes.reseller': 'Reseller',
      'profile.businessTypes.importer': 'Importer',
      'profile.businessTypes.sme': 'SME Owner',
      'profile.businessTypes.manufacturer': 'Manufacturer',
      'profile.subscriptionTiers.free': 'Free',
      'profile.subscriptionTiers.pro': 'Pro',
      'profile.subscriptionTiers.enterprise': 'Enterprise',
      'profile.languages.bn': 'বাংলা (Bengali)',
      'profile.languages.en': 'English',
      'profile.currencies.BDT': '৳ BDT (Bangladeshi Taka)',
      'profile.currencies.USD': '$ USD (US Dollar)',
      'profile.currencies.CNY': '¥ CNY (Chinese Yuan)',
      'common.loading': 'Loading...',
    };
    return translations[key] || key;
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+8801712345678',
  businessInfo: {
    name: 'Test Business',
    type: 'reseller' as const,
    location: 'Dhaka',
    teamSize: 5,
    warehouseCapacity: 1000,
  },
  preferences: {
    locale: 'en' as const,
    currency: 'BDT' as const,
  },
  subscription: {
    tier: 'pro' as const,
    status: 'active' as const,
    currentPeriodEnd: new Date('2024-12-31'),
    usageQuota: {
      blueprintsGenerated: 3,
      blueprintsLimit: 10,
      apiCallsUsed: 150,
      apiCallsLimit: 1000,
    },
  },
};

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('ProfileSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      status: 'authenticated',
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Requirement 11.3: Display user profile settings', () => {
    it('should display personal information section', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+8801712345678')).toBeInTheDocument();
    });

    it('should display business information section', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Business Information')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Reseller')).toBeInTheDocument(); // Select shows option text
      expect(screen.getByDisplayValue('Dhaka')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    it('should display language preference', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Preferences')).toBeInTheDocument();
      const languageSelect = screen.getByDisplayValue('English');
      expect(languageSelect).toBeInTheDocument();
    });
  });

  describe('Requirement 11.4: Allow users to update profile information', () => {
    it('should allow editing name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      expect(nameInput).toHaveValue('Updated Name');
    });

    it('should allow editing business information', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSettingsPage />);

      const businessNameInput = screen.getByDisplayValue('Test Business');
      await user.clear(businessNameInput);
      await user.type(businessNameInput, 'Updated Business');

      expect(businessNameInput).toHaveValue('Updated Business');
    });

    it('should submit form with updated data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });

      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profile/update',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Updated Name'),
          })
        );
      });
    });

    it('should display success message after successful update', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });

      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('should display error message on update failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
      });
    });

    it('should disable email field (read-only)', () => {
      renderWithProviders(<ProfileSettingsPage />);

      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Requirement 11.5: Display subscription tier information', () => {
    it('should display current subscription tier', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Subscription & Usage')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('should display Free tier for free users', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockUser,
          subscription: {
            ...mockUser.subscription,
            tier: 'free',
          },
        },
        status: 'authenticated',
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  describe('Requirement 11.6: Display usage limits and remaining quota', () => {
    it('should display blueprints usage quota', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Blueprints Generated')).toBeInTheDocument();
      expect(screen.getByText(/3.*of.*10/)).toBeInTheDocument();
    });

    it('should display API calls usage quota', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('API Calls Used')).toBeInTheDocument();
      expect(screen.getByText(/150.*of.*1000/)).toBeInTheDocument();
    });

    it('should display usage progress bars', () => {
      renderWithProviders(<ProfileSettingsPage />);

      // Check for progress bar container divs
      const progressBars = screen.getAllByRole('generic', { hidden: true }).filter(
        (el) => el.className.includes('bg-blue-600')
      );
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Form validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      // Form should not submit with empty required field
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ProfileSettingsPage />);

      const phoneInput = screen.getByDisplayValue('+8801712345678');
      await user.clear(phoneInput);
      await user.type(phoneInput, 'invalid-phone');

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      // Form should not submit with invalid phone
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Loading states', () => {
    it('should show loading state when user is not loaded', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        status: 'loading',
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should disable submit button while updating', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(<ProfileSettingsPage />);

      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Business Name')).toBeInTheDocument();
      expect(screen.getByText('Business Type')).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      renderWithProviders(<ProfileSettingsPage />);

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for alerts', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUser }),
      });

      renderWithProviders(<ProfileSettingsPage />);

      const nameInput = screen.getByDisplayValue('Test User');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: 'Update Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });
});
