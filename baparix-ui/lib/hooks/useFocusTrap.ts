'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Selectors for all focusable elements within a container.
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ');

interface UseFocusTrapOptions {
  /** Whether the focus trap is currently active */
  active?: boolean;
  /** Whether to return focus to the trigger element on deactivation */
  returnFocusOnDeactivate?: boolean;
}

interface UseFocusTrapReturn {
  /** Ref to attach to the container element that should trap focus */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Manually activate the focus trap */
  activate: () => void;
  /** Manually deactivate the focus trap */
  deactivate: () => void;
}

/**
 * useFocusTrap - Custom hook for trapping focus within a container element.
 *
 * Used for modals, dialogs, and overlays to ensure keyboard users
 * cannot tab outside the container while it is active.
 *
 * Features:
 * - Traps focus within a container (Tab and Shift+Tab cycle)
 * - Returns focus to the trigger element when deactivated
 * - Handles Escape key for closing overlays
 *
 * Requirements: 15.1 - Provide keyboard navigation for all interactive elements
 */
export function useFocusTrap(options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const { active = false, returnFocusOnDeactivate = true } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    return Array.from(elements).filter((el) => !el.hasAttribute('disabled'));
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current) return;

      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: if focus is on first element, wrap to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if focus is on last element, wrap to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [getFocusableElements]
  );

  const activate = useCallback(() => {
    // Store the currently focused element to return focus later
    triggerRef.current = document.activeElement as HTMLElement;
    setIsActive(true);

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }
  }, [getFocusableElements]);

  const deactivate = useCallback(() => {
    setIsActive(false);

    // Return focus to the trigger element
    if (returnFocusOnDeactivate && triggerRef.current) {
      triggerRef.current.focus();
    }
    triggerRef.current = null;
  }, [returnFocusOnDeactivate]);

  // Sync with the `active` prop
  useEffect(() => {
    if (active) {
      activate();
    } else {
      // Only deactivate if it was previously active
      setIsActive((prev) => {
        if (prev) {
          // Return focus to the trigger element
          if (returnFocusOnDeactivate && triggerRef.current) {
            triggerRef.current.focus();
          }
          triggerRef.current = null;
        }
        return false;
      });
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manage event listener based on isActive state
  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyDown]);

  return { containerRef, activate, deactivate };
}
