import React from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  fallbackColor,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  // Generate initials from name
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColorFromName = (name: string): string => {
    if (fallbackColor) return fallbackColor;

    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const showImage = src && !imageError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getColorFromName(name) : 'bg-gray-400';

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        overflow-hidden
        flex-shrink-0
        ${!showImage ? `${bgColor} text-white` : 'bg-gray-200'}
        ${className}
      `}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : (alt || name || 'Avatar')}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium select-none" aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
};

// Avatar group component for displaying multiple avatars
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    name?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'md',
  className = '',
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div className={`flex -space-x-2 ${className}`} role="group" aria-label="Avatar group">
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-white rounded-full"
          style={{ zIndex: displayAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            alt={avatar.alt}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full
            bg-gray-200
            text-gray-600
            flex items-center justify-center
            font-medium
            ring-2 ring-white
          `}
          style={{ zIndex: 0 }}
          aria-label={`${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

// Avatar with status indicator
export interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

export const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  status = 'offline',
  showStatus = true,
  ...avatarProps
}) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',
  };

  return (
    <div className="relative inline-block">
      <Avatar {...avatarProps} />
      {showStatus && (
        <span
          className={`
            absolute bottom-0 right-0
            block rounded-full
            ring-2 ring-white
            ${statusColors[status]}
            ${avatarProps.size === 'xs' ? 'w-2 h-2' : ''}
            ${avatarProps.size === 'sm' ? 'w-2.5 h-2.5' : ''}
            ${avatarProps.size === 'md' || !avatarProps.size ? 'w-3 h-3' : ''}
            ${avatarProps.size === 'lg' ? 'w-3.5 h-3.5' : ''}
            ${avatarProps.size === 'xl' ? 'w-4 h-4' : ''}
          `}
          aria-label={statusLabels[status]}
        />
      )}
    </div>
  );
};
