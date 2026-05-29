'use client';

import { PresenceUser } from '@/lib/hooks/useRealtimePresence';

export interface PresenceIndicatorProps {
  /** List of users currently viewing the same section */
  users: PresenceUser[];
  /** Maximum number of avatars to display before showing a count */
  maxDisplay?: number;
  /** Size variant for the indicator */
  size?: 'sm' | 'md';
  /** Current section name for the aria label */
  sectionName?: string;
}

/**
 * Displays a small indicator of who is viewing the current section.
 *
 * Shows avatars of users viewing the same section, with a count
 * badge if more than `maxDisplay` users are viewing.
 *
 * @example
 * ```tsx
 * <PresenceIndicator
 *   users={onlineUsers.filter(u => u.currentSection === 'dashboard')}
 *   maxDisplay={3}
 *   sectionName="Dashboard"
 * />
 * ```
 */
export function PresenceIndicator({
  users,
  maxDisplay = 3,
  size = 'sm',
  sectionName,
}: PresenceIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  const displayedUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  const avatarSize = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  const overlapOffset = size === 'sm' ? '-ml-1.5' : '-ml-2';
  const countBadgeSize = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  const ariaLabel = sectionName
    ? `${users.length} user${users.length !== 1 ? 's' : ''} viewing ${sectionName}`
    : `${users.length} user${users.length !== 1 ? 's' : ''} online`;

  return (
    <div
      className="flex items-center"
      role="status"
      aria-label={ariaLabel}
      data-testid="presence-indicator"
    >
      <div className="flex items-center">
        {displayedUsers.map((user, index) => (
          <div
            key={user.userId}
            className={`${index > 0 ? overlapOffset : ''} relative`}
            title={user.name}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={`${avatarSize} rounded-full border-2 border-white object-cover`}
                data-testid={`presence-avatar-${user.userId}`}
              />
            ) : (
              <div
                className={`${avatarSize} rounded-full border-2 border-white bg-indigo-500 text-white flex items-center justify-center font-medium`}
                data-testid={`presence-avatar-${user.userId}`}
                aria-hidden="true"
              >
                {getInitials(user.name)}
              </div>
            )}
            {/* Online indicator dot */}
            <span
              className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-white rounded-full"
              aria-hidden="true"
            />
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className={`${overlapOffset} ${countBadgeSize} rounded-full border-2 border-white bg-gray-200 text-gray-600 flex items-center justify-center font-medium`}
            data-testid="presence-overflow-count"
            aria-hidden="true"
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get initials from a name (first letter of first and last name)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
