'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

export interface OfflineIndicatorProps {
  /** Current synchronization status */
  syncStatus?: SyncStatus;
  /** Callback when the user dismisses the indicator */
  onDismiss?: () => void;
}

/**
 * Offline mode indicator component.
 * Displays a banner when the user loses connectivity and shows sync status
 * during synchronization.
 *
 * Requirements:
 * - 13.1: Display an offline mode indicator when connectivity is lost
 * - 13.6: Display a sync status indicator during synchronization
 */
export function OfflineIndicator({ syncStatus = 'idle', onDismiss }: OfflineIndicatorProps) {
  const t = useTranslations('offline');
  const { isOnline } = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const showIndicator = !isOnline || syncStatus === 'syncing' || syncStatus === 'failed';

  useEffect(() => {
    if (syncStatus === 'synced' && isOnline) {
      // Show "synced" briefly then hide
      setShouldRender(true);
      const showTimer = setTimeout(() => setVisible(true), 10);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 2000);
      const removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 2300);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        clearTimeout(removeTimer);
      };
    } else if (showIndicator) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showIndicator, syncStatus, isOnline]);

  if (!shouldRender) {
    return null;
  }

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onDismiss?.();
    }, 300);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="offline-indicator"
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className={getBannerStyles(isOnline, syncStatus)}>
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {getStatusIcon(isOnline, syncStatus)}
            <span className="text-sm font-medium">
              {getStatusMessage(t, isOnline, syncStatus)}
            </span>
          </div>
          {!isOnline && onDismiss && (
            <button
              onClick={handleDismiss}
              aria-label={t('dismiss')}
              className="p-1 rounded-md hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getBannerStyles(isOnline: boolean, syncStatus: SyncStatus): string {
  if (!isOnline) {
    return 'bg-amber-600 text-white';
  }
  switch (syncStatus) {
    case 'syncing':
      return 'bg-blue-600 text-white';
    case 'synced':
      return 'bg-green-600 text-white';
    case 'failed':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}

function getStatusMessage(
  t: (key: string) => string,
  isOnline: boolean,
  syncStatus: SyncStatus
): string {
  if (!isOnline) {
    return t('youAreOffline');
  }
  switch (syncStatus) {
    case 'syncing':
      return t('syncing');
    case 'synced':
      return t('synced');
    case 'failed':
      return t('syncFailed');
    default:
      return '';
  }
}

function getStatusIcon(isOnline: boolean, syncStatus: SyncStatus) {
  if (!isOnline) {
    return <OfflineIcon />;
  }
  switch (syncStatus) {
    case 'syncing':
      return <SyncingIcon />;
    case 'synced':
      return <SyncedIcon />;
    case 'failed':
      return <FailedIcon />;
    default:
      return null;
  }
}

function OfflineIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M3 3l18 18"
      />
    </svg>
  );
}

function SyncingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-5 h-5 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function SyncedIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
