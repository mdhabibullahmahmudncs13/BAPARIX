import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'avatar' | 'button' | 'image';
  count?: number;
  className?: string;
  width?: string;
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  count = 1,
  className = '',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div
            className={`${baseClasses} h-4 ${className}`}
            style={{ width: width || '100%', height: height || '1rem' }}
            role="status"
            aria-label="Loading"
          >
            <span className="sr-only">Loading...</span>
          </div>
        );

      case 'card':
        return (
          <div
            className={`${baseClasses} p-4 space-y-4 ${className}`}
            style={{ width: width || '100%', height: height || 'auto' }}
            role="status"
            aria-label="Loading card"
          >
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            </div>
            <span className="sr-only">Loading card...</span>
          </div>
        );

      case 'table':
        return (
          <div
            className={`${baseClasses} ${className}`}
            style={{ width: width || '100%', height: height || 'auto' }}
            role="status"
            aria-label="Loading table"
          >
            <div className="space-y-3 p-4">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
              {/* Rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-4 gap-4">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
            <span className="sr-only">Loading table...</span>
          </div>
        );

      case 'avatar':
        return (
          <div
            className={`${baseClasses} rounded-full ${className}`}
            style={{
              width: width || '2.5rem',
              height: height || '2.5rem',
            }}
            role="status"
            aria-label="Loading avatar"
          >
            <span className="sr-only">Loading avatar...</span>
          </div>
        );

      case 'button':
        return (
          <div
            className={`${baseClasses} ${className}`}
            style={{
              width: width || '6rem',
              height: height || '2.5rem',
            }}
            role="status"
            aria-label="Loading button"
          >
            <span className="sr-only">Loading button...</span>
          </div>
        );

      case 'image':
        return (
          <div
            className={`${baseClasses} ${className}`}
            style={{
              width: width || '100%',
              height: height || '12rem',
            }}
            role="status"
            aria-label="Loading image"
          >
            <span className="sr-only">Loading image...</span>
          </div>
        );

      default:
        return null;
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

// Predefined skeleton layouts for common use cases
export const SkeletonLayouts = {
  ProductCard: () => (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3" role="status" aria-label="Loading product">
      <LoadingSkeleton variant="image" height="12rem" />
      <LoadingSkeleton variant="text" width="80%" />
      <LoadingSkeleton variant="text" width="60%" />
      <div className="flex justify-between items-center">
        <LoadingSkeleton variant="text" width="30%" />
        <LoadingSkeleton variant="button" width="5rem" height="2rem" />
      </div>
      <span className="sr-only">Loading product...</span>
    </div>
  ),

  DashboardCard: () => (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4" role="status" aria-label="Loading dashboard card">
      <div className="flex items-center justify-between">
        <LoadingSkeleton variant="text" width="40%" />
        <LoadingSkeleton variant="avatar" width="2rem" height="2rem" />
      </div>
      <LoadingSkeleton variant="text" width="60%" height="2rem" />
      <LoadingSkeleton variant="text" width="80%" />
      <span className="sr-only">Loading dashboard card...</span>
    </div>
  ),

  ListItem: () => (
    <div className="flex items-center space-x-4 py-3" role="status" aria-label="Loading list item">
      <LoadingSkeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="70%" />
        <LoadingSkeleton variant="text" width="50%" />
      </div>
      <span className="sr-only">Loading list item...</span>
    </div>
  ),

  FormField: () => (
    <div className="space-y-2" role="status" aria-label="Loading form field">
      <LoadingSkeleton variant="text" width="30%" height="0.875rem" />
      <LoadingSkeleton variant="button" width="100%" height="2.5rem" />
      <span className="sr-only">Loading form field...</span>
    </div>
  ),
};
