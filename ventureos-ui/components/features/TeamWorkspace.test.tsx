import { render, screen, within } from '@testing-library/react';
import {
  TeamWorkspace,
  TeamMemberDisplay,
  SharedDashboard,
} from './TeamWorkspace';

// next-intl is globally mocked in jest.setup.ts to return the key as the value
// So t('title') renders "title", t('sections.teamMembers') renders "sections.teamMembers"

const mockMembers: TeamMemberDisplay[] = [
  {
    userId: 'user-1',
    name: 'Alice Rahman',
    role: 'owner',
    status: 'online',
    lastActive: new Date(),
    currentSection: 'Financial Tracker',
  },
  {
    userId: 'user-2',
    name: 'Bob Hasan',
    role: 'co-founder',
    status: 'away',
    lastActive: new Date(Date.now() - 30 * 60000), // 30 min ago
    currentSection: 'Market Intelligence',
  },
  {
    userId: 'user-3',
    name: 'Carol Ahmed',
    role: 'manager',
    status: 'offline',
    lastActive: new Date(Date.now() - 2 * 3600000), // 2 hours ago
  },
  {
    userId: 'user-4',
    name: 'Dave Khan',
    role: 'analyst',
    status: 'online',
    lastActive: new Date(),
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  {
    userId: 'user-5',
    name: 'Eve Begum',
    role: 'guest',
    status: 'offline',
    lastActive: new Date(Date.now() - 48 * 3600000), // 2 days ago
  },
];

const mockDashboards: SharedDashboard[] = [
  { id: 'dash-1', name: 'Revenue Overview', description: 'Monthly revenue metrics' },
  { id: 'dash-2', name: 'Product Performance', description: 'Top selling products' },
  { id: 'dash-3', name: 'Market Trends' },
];

describe('TeamWorkspace', () => {
  describe('Loading State', () => {
    it('renders loading skeleton when isLoading is true', () => {
      render(<TeamWorkspace locale="en" isLoading={true} />);

      expect(screen.getByTestId('team-workspace-loading')).toBeInTheDocument();
    });

    it('does not render main content when loading', () => {
      render(<TeamWorkspace locale="en" isLoading={true} />);

      expect(screen.queryByTestId('team-workspace')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no workspace name, members, or dashboards', () => {
      render(<TeamWorkspace locale="en" />);

      expect(screen.getByText('emptyState.title')).toBeInTheDocument();
      expect(screen.getByText('emptyState.description')).toBeInTheDocument();
    });

    it('does not render empty state when workspace name is provided', () => {
      render(<TeamWorkspace locale="en" workspaceName="My Team" />);

      expect(screen.queryByText('emptyState.title')).not.toBeInTheDocument();
      expect(screen.getByTestId('team-workspace')).toBeInTheDocument();
    });
  });

  describe('Workspace Header', () => {
    it('displays workspace name as heading', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="VentureOS Team"
          members={mockMembers}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('VentureOS Team');
    });

    it('displays workspace description when provided', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="VentureOS Team"
          workspaceDescription="Our collaborative workspace"
          members={mockMembers}
        />
      );

      expect(screen.getByText('Our collaborative workspace')).toBeInTheDocument();
    });

    it('falls back to translation key when no workspace name', () => {
      render(<TeamWorkspace locale="en" members={mockMembers} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('title');
    });
  });

  describe('Team Member List', () => {
    it('renders all team members', () => {
      render(<TeamWorkspace locale="en" workspaceName="Team" members={mockMembers} />);

      expect(screen.getByText('Alice Rahman')).toBeInTheDocument();
      expect(screen.getByText('Bob Hasan')).toBeInTheDocument();
      expect(screen.getByText('Carol Ahmed')).toBeInTheDocument();
      expect(screen.getByText('Dave Khan')).toBeInTheDocument();
      expect(screen.getByText('Eve Begum')).toBeInTheDocument();
    });

    it('displays role badges for each member', () => {
      render(<TeamWorkspace locale="en" workspaceName="Team" members={mockMembers} />);

      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Co-founder')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Analyst')).toBeInTheDocument();
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    it('displays online count badge', () => {
      render(<TeamWorkspace locale="en" workspaceName="Team" members={mockMembers} />);

      // 2 members are online (Alice and Dave)
      expect(screen.getByTestId('online-count')).toHaveTextContent('2');
    });

    it('renders member list with accessible label', () => {
      render(<TeamWorkspace locale="en" workspaceName="Team" members={mockMembers} />);

      expect(screen.getByRole('list', { name: 'sections.teamMembers' })).toBeInTheDocument();
    });

    it('shows empty members state when no members provided', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={[]}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByTestId('members-empty')).toBeInTheDocument();
      expect(screen.getByText('placeholders.noMembers')).toBeInTheDocument();
    });
  });

  describe('Activity Indicators', () => {
    it('displays current section for members who are viewing something', () => {
      render(<TeamWorkspace locale="en" workspaceName="Team" members={mockMembers} />);

      expect(screen.getByTestId('viewing-section-user-1')).toHaveTextContent('Financial Tracker');
      expect(screen.getByTestId('viewing-section-user-2')).toHaveTextContent('Market Intelligence');
    });

    it('does not display section indicator for members without currentSection', () => {
      render(<TeamWorkspace locale="en" workspaceName="Team" members={mockMembers} />);

      expect(screen.queryByTestId('viewing-section-user-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('viewing-section-user-4')).not.toBeInTheDocument();
    });
  });

  describe('Shared Dashboards', () => {
    it('renders shared dashboards section', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByText('sections.sharedDashboards')).toBeInTheDocument();
    });

    it('displays all shared dashboards', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
      expect(screen.getByText('Product Performance')).toBeInTheDocument();
      expect(screen.getByText('Market Trends')).toBeInTheDocument();
    });

    it('displays dashboard descriptions when provided', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByText('Monthly revenue metrics')).toBeInTheDocument();
      expect(screen.getByText('Top selling products')).toBeInTheDocument();
    });

    it('renders dashboards in a grid', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByTestId('shared-dashboards-grid')).toBeInTheDocument();
    });

    it('shows empty dashboards placeholder when no dashboards', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={[]}
        />
      );

      expect(screen.getByTestId('dashboards-empty-slot')).toBeInTheDocument();
      expect(screen.getByText('placeholders.noDashboards')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('uses responsive grid layout with sidebar', () => {
      const { container } = render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('main content area spans 3 columns on large screens', () => {
      const { container } = render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      const mainArea = container.querySelector('.lg\\:col-span-3');
      expect(mainArea).toBeInTheDocument();
    });

    it('sidebar spans 1 column on large screens', () => {
      const { container } = render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      const sidebar = container.querySelector('.lg\\:col-span-1');
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses proper heading hierarchy', () => {
      const { container } = render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      const h2 = container.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent('Team');

      const h3s = container.querySelectorAll('h3');
      expect(h3s.length).toBeGreaterThanOrEqual(2);
    });

    it('decorative icons have aria-hidden', () => {
      const { container } = render(
        <TeamWorkspace
          locale="en"
          workspaceName="Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it('empty state has role="status" and aria-live', () => {
      render(<TeamWorkspace locale="en" />);

      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Locale Support', () => {
    it('renders with bn locale without errors', () => {
      render(
        <TeamWorkspace
          locale="bn"
          workspaceName="আমার টিম"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('আমার টিম');
    });

    it('renders with en locale without errors', () => {
      render(
        <TeamWorkspace
          locale="en"
          workspaceName="My Team"
          members={mockMembers}
          sharedDashboards={mockDashboards}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('My Team');
    });
  });
});
