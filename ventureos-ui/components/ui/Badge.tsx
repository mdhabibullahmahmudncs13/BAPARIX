import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const baseClasses = 'inline-flex items-center gap-1 font-medium rounded-full';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-primary-100 text-primary-800',
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};

// Status badge variants for common use cases
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'cancelled';
  className?: string;
}> = ({ status, className }) => {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Active' },
    inactive: { variant: 'default' as const, label: 'Inactive' },
    pending: { variant: 'warning' as const, label: 'Pending' },
    completed: { variant: 'success' as const, label: 'Completed' },
    failed: { variant: 'error' as const, label: 'Failed' },
    cancelled: { variant: 'default' as const, label: 'Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

// Quality tier badge for product listings
export const QualityBadge: React.FC<{
  tier: 'cheap' | 'medium' | 'high';
  className?: string;
}> = ({ tier, className }) => {
  const tierConfig = {
    cheap: { variant: 'default' as const, label: 'Budget' },
    medium: { variant: 'info' as const, label: 'Standard' },
    high: { variant: 'primary' as const, label: 'Premium' },
  };

  const config = tierConfig[tier];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

// Platform badge for marketplace identification
export const PlatformBadge: React.FC<{
  platform: 'alibaba' | 'pinduoduo' | 'xianyu' | 'skybuybd' | 'dhgate' | 'aliexpress';
  className?: string;
}> = ({ platform, className }) => {
  const platformConfig = {
    alibaba: { variant: 'warning' as const, label: 'Alibaba' },
    pinduoduo: { variant: 'error' as const, label: 'Pinduoduo' },
    xianyu: { variant: 'info' as const, label: 'Xianyu' },
    skybuybd: { variant: 'success' as const, label: 'SkyBuyBD' },
    dhgate: { variant: 'primary' as const, label: 'DHgate' },
    aliexpress: { variant: 'warning' as const, label: 'AliExpress' },
  };

  const config = platformConfig[platform];

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {config.label}
    </Badge>
  );
};
