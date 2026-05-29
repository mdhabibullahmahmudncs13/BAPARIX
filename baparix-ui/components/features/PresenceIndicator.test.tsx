import { render, screen } from '@testing-library/react';
import { PresenceIndicator } from './PresenceIndicator';
import { PresenceUser } from '@/lib/hooks/useRealtimePresence';

const mockUsers: PresenceUser[] = [
  {
    userId: 'user-1',
    name: 'Alice Johnson',
    avatarUrl: 'https://example.com/alice.jpg',
    currentSection: 'dashboard',
    lastSeen: new Date(),
  },
  {
    userId: 'user-2',
    name: 'Bob Smith',
    currentSection: 'dashboard',
    lastSeen: new Date(),
  },
  {
    userId: 'user-3',
    name: 'Charlie Brown',
    avatarUrl: 'https://example.com/charlie.jpg',
    currentSection: 'dashboard',
    lastSeen: new Date(),
  },
  {
    userId: 'user-4',
    name: 'Diana Prince',
    currentSection: 'dashboard',
    lastSeen: new Date(),
  },
  {
    userId: 'user-5',
    name: 'Eve Wilson',
    currentSection: 'dashboard',
    lastSeen: new Date(),
  },
];

describe('PresenceIndicator', () => {
  it('should render nothing when no users are provided', () => {
    const { container } = render(<PresenceIndicator users={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render avatars for users', () => {
    render(<PresenceIndicator users={mockUsers.slice(0, 2)} />);

    expect(screen.getByTestId('presence-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('presence-avatar-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('presence-avatar-user-2')).toBeInTheDocument();
  });

  it('should display image avatar when avatarUrl is provided', () => {
    render(<PresenceIndicator users={[mockUsers[0]]} />);

    const avatar = screen.getByTestId('presence-avatar-user-1');
    expect(avatar.tagName).toBe('IMG');
    expect(avatar).toHaveAttribute('src', 'https://example.com/alice.jpg');
    expect(avatar).toHaveAttribute('alt', 'Alice Johnson');
  });

  it('should display initials when no avatarUrl is provided', () => {
    render(<PresenceIndicator users={[mockUsers[1]]} />);

    const avatar = screen.getByTestId('presence-avatar-user-2');
    expect(avatar.tagName).toBe('DIV');
    expect(avatar).toHaveTextContent('BS'); // Bob Smith initials
  });

  it('should show overflow count when more than maxDisplay users', () => {
    render(<PresenceIndicator users={mockUsers} maxDisplay={3} />);

    expect(screen.getByTestId('presence-overflow-count')).toHaveTextContent('+2');
  });

  it('should not show overflow count when users are within maxDisplay', () => {
    render(<PresenceIndicator users={mockUsers.slice(0, 3)} maxDisplay={3} />);

    expect(screen.queryByTestId('presence-overflow-count')).not.toBeInTheDocument();
  });

  it('should only display maxDisplay number of avatars', () => {
    render(<PresenceIndicator users={mockUsers} maxDisplay={2} />);

    expect(screen.getByTestId('presence-avatar-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('presence-avatar-user-2')).toBeInTheDocument();
    expect(screen.queryByTestId('presence-avatar-user-3')).not.toBeInTheDocument();
    expect(screen.getByTestId('presence-overflow-count')).toHaveTextContent('+3');
  });

  it('should have proper aria-label with section name', () => {
    render(
      <PresenceIndicator
        users={mockUsers.slice(0, 2)}
        sectionName="Dashboard"
      />
    );

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      '2 users viewing Dashboard'
    );
  });

  it('should have proper aria-label without section name', () => {
    render(<PresenceIndicator users={mockUsers.slice(0, 2)} />);

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      '2 users online'
    );
  });

  it('should use singular form for single user', () => {
    render(
      <PresenceIndicator
        users={[mockUsers[0]]}
        sectionName="Financial"
      />
    );

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      '1 user viewing Financial'
    );
  });

  it('should render with sm size by default', () => {
    render(<PresenceIndicator users={[mockUsers[0]]} size="sm" />);

    const avatar = screen.getByTestId('presence-avatar-user-1');
    expect(avatar.className).toContain('w-6');
    expect(avatar.className).toContain('h-6');
  });

  it('should render with md size when specified', () => {
    render(<PresenceIndicator users={[mockUsers[0]]} size="md" />);

    const avatar = screen.getByTestId('presence-avatar-user-1');
    expect(avatar.className).toContain('w-8');
    expect(avatar.className).toContain('h-8');
  });

  it('should handle single-name users for initials', () => {
    const singleNameUser: PresenceUser = {
      userId: 'user-single',
      name: 'Madonna',
      currentSection: 'dashboard',
      lastSeen: new Date(),
    };

    render(<PresenceIndicator users={[singleNameUser]} />);

    const avatar = screen.getByTestId('presence-avatar-user-single');
    expect(avatar).toHaveTextContent('M');
  });
});
