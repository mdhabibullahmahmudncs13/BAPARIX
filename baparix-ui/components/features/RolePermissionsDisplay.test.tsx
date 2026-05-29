import { render, screen, within } from '@testing-library/react';
import { RolePermissionsDisplay } from './RolePermissionsDisplay';
import { ALL_ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/utils/permissions';

// next-intl is globally mocked in jest.setup.ts

describe('RolePermissionsDisplay', () => {
  describe('Rendering', () => {
    it('renders the permissions table', () => {
      render(<RolePermissionsDisplay locale="en" />);

      expect(screen.getByTestId('role-permissions-display')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('has an accessible table label in English', () => {
      render(<RolePermissionsDisplay locale="en" />);

      expect(screen.getByRole('table', { name: 'Role permissions matrix' })).toBeInTheDocument();
    });

    it('has an accessible table label in Bengali', () => {
      render(<RolePermissionsDisplay locale="bn" />);

      expect(screen.getByRole('table', { name: 'ভূমিকা অনুমতি ম্যাট্রিক্স' })).toBeInTheDocument();
    });
  });

  describe('Role Headers', () => {
    it('displays all role names as column headers in English', () => {
      render(<RolePermissionsDisplay locale="en" />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Co-founder')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Analyst')).toBeInTheDocument();
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    it('displays all role names as column headers in Bengali', () => {
      render(<RolePermissionsDisplay locale="bn" />);

      expect(screen.getByText('মালিক')).toBeInTheDocument();
      expect(screen.getByText('সহ-প্রতিষ্ঠাতা')).toBeInTheDocument();
      expect(screen.getByText('ম্যানেজার')).toBeInTheDocument();
      expect(screen.getByText('বিশ্লেষক')).toBeInTheDocument();
      expect(screen.getByText('অতিথি')).toBeInTheDocument();
    });

    it('renders role names inside Badge components', () => {
      const { container } = render(<RolePermissionsDisplay locale="en" />);

      // Badges use span elements with specific classes
      const headerRow = container.querySelector('thead tr');
      expect(headerRow).toBeInTheDocument();

      const badges = headerRow!.querySelectorAll('span');
      // Each role header should have a badge span
      expect(badges.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Permission Rows', () => {
    it('displays all permission labels in English', () => {
      render(<RolePermissionsDisplay locale="en" />);

      expect(screen.getByText('View Financials')).toBeInTheDocument();
      expect(screen.getByText('Edit Financials')).toBeInTheDocument();
      expect(screen.getByText('View Blueprints')).toBeInTheDocument();
      expect(screen.getByText('Edit Blueprints')).toBeInTheDocument();
      expect(screen.getByText('Manage Team')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });

    it('displays all permission labels in Bengali', () => {
      render(<RolePermissionsDisplay locale="bn" />);

      expect(screen.getByText('আর্থিক তথ্য দেখুন')).toBeInTheDocument();
      expect(screen.getByText('আর্থিক তথ্য সম্পাদনা')).toBeInTheDocument();
      expect(screen.getByText('ব্লুপ্রিন্ট দেখুন')).toBeInTheDocument();
      expect(screen.getByText('ব্লুপ্রিন্ট সম্পাদনা')).toBeInTheDocument();
      expect(screen.getByText('টিম পরিচালনা')).toBeInTheDocument();
      expect(screen.getByText('ডেটা রপ্তানি')).toBeInTheDocument();
    });

    it('renders 6 permission rows in the table body', () => {
      const { container } = render(<RolePermissionsDisplay locale="en" />);

      const tbody = container.querySelector('tbody');
      const rows = tbody!.querySelectorAll('tr');
      expect(rows).toHaveLength(6);
    });
  });

  describe('Permission Icons', () => {
    it('renders check icons for allowed permissions', () => {
      render(<RolePermissionsDisplay locale="en" />);

      // Owner has all 6 permissions allowed
      const allowedIcons = screen.getAllByLabelText(/Owner allowed/);
      expect(allowedIcons).toHaveLength(6);
    });

    it('renders X icons for denied permissions', () => {
      render(<RolePermissionsDisplay locale="en" />);

      // Guest is denied 5 permissions (only viewBlueprints is allowed)
      const deniedIcons = screen.getAllByLabelText(/Guest denied/);
      expect(deniedIcons).toHaveLength(5);
    });

    it('correctly shows guest can only view blueprints', () => {
      render(<RolePermissionsDisplay locale="en" />);

      const guestAllowed = screen.getAllByLabelText(/Guest allowed/);
      expect(guestAllowed).toHaveLength(1);
    });

    it('correctly shows analyst permissions', () => {
      render(<RolePermissionsDisplay locale="en" />);

      // Analyst: viewFinancials, viewBlueprints, exportData = 3 allowed
      const analystAllowed = screen.getAllByLabelText(/Analyst allowed/);
      expect(analystAllowed).toHaveLength(3);

      // Analyst: editFinancials, editBlueprints, manageTeam = 3 denied
      const analystDenied = screen.getAllByLabelText(/Analyst denied/);
      expect(analystDenied).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('uses proper table structure with thead and tbody', () => {
      const { container } = render(<RolePermissionsDisplay locale="en" />);

      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });

    it('uses scope="col" for column headers', () => {
      const { container } = render(<RolePermissionsDisplay locale="en" />);

      const colHeaders = container.querySelectorAll('th[scope="col"]');
      // 1 permission column header + 5 role column headers = 6
      expect(colHeaders).toHaveLength(6);
    });

    it('provides aria-labels on permission icons', () => {
      render(<RolePermissionsDisplay locale="en" />);

      // Total cells = 5 roles × 6 permissions = 30 icons
      const allAllowed = screen.getAllByLabelText(/allowed/);
      const allDenied = screen.getAllByLabelText(/denied/);
      expect(allAllowed.length + allDenied.length).toBe(30);
    });
  });

  describe('Locale Support', () => {
    it('renders Permission column header in English', () => {
      render(<RolePermissionsDisplay locale="en" />);

      expect(screen.getByText('Permission')).toBeInTheDocument();
    });

    it('renders Permission column header in Bengali', () => {
      render(<RolePermissionsDisplay locale="bn" />);

      expect(screen.getByText('অনুমতি')).toBeInTheDocument();
    });
  });
});
