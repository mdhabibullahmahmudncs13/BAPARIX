/**
 * Service Worker Registration Utility
 *
 * Provides functions to register, unregister, and manage the service worker lifecycle.
 * Handles browser compatibility checks and provides callbacks for lifecycle events.
 */

import { defaultServiceWorkerConfig, type ServiceWorkerConfig } from './serviceWorkerConfig'

export interface ServiceWorkerCallbacks {
  /** Called when the service worker is successfully registered */
  onRegistered?: (registration: ServiceWorkerRegistration) => void
  /** Called when the service worker is ready (active and controlling the page) */
  onReady?: (registration: ServiceWorkerRegistration) => void
  /** Called when a new service worker update is available */
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void
  /** Called when the service worker is installed for the first time */
  onInstalled?: (registration: ServiceWorkerRegistration) => void
  /** Called when registration fails */
  onError?: (error: Error) => void
  /** Called when the service worker goes offline */
  onOffline?: () => void
  /** Called when the service worker comes back online */
  onOnline?: () => void
}

export interface RegistrationResult {
  success: boolean
  registration?: ServiceWorkerRegistration
  error?: Error
}

/**
 * Checks if the current environment supports service workers.
 */
export function isServiceWorkerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof navigator.serviceWorker !== 'undefined'
  )
}

/**
 * Checks if the app is running in a secure context (required for service workers).
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

/**
 * Registers the service worker with the given configuration and callbacks.
 * Returns a promise that resolves with the registration result.
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = defaultServiceWorkerConfig,
  callbacks: ServiceWorkerCallbacks = {}
): Promise<RegistrationResult> {
  if (!config.enabled) {
    return { success: false, error: new Error('Service worker is disabled in configuration') }
  }

  if (!isServiceWorkerSupported()) {
    const error = new Error('Service workers are not supported in this browser')
    callbacks.onError?.(error)
    return { success: false, error }
  }

  if (!isSecureContext()) {
    const error = new Error('Service workers require a secure context (HTTPS or localhost)')
    callbacks.onError?.(error)
    return { success: false, error }
  }

  try {
    const registration = await navigator.serviceWorker.register(config.swPath, {
      scope: config.scope,
    })

    callbacks.onRegistered?.(registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing
      if (!installingWorker) return

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            callbacks.onUpdateAvailable?.(registration)
          } else {
            // First install
            callbacks.onInstalled?.(registration)
          }
        }
      })
    })

    // Wait for the service worker to be ready
    const readyRegistration = await navigator.serviceWorker.ready
    callbacks.onReady?.(readyRegistration)

    return { success: true, registration }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    callbacks.onError?.(error)
    return { success: false, error }
  }
}

/**
 * Unregisters all service workers for the current scope.
 * Returns true if at least one service worker was unregistered.
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      return await registration.unregister()
    }
    return false
  } catch {
    return false
  }
}

/**
 * Unregisters all service workers across all scopes.
 * Useful for cleanup during development or when switching configurations.
 */
export async function unregisterAllServiceWorkers(): Promise<number> {
  if (!isServiceWorkerSupported()) {
    return 0
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    let count = 0
    for (const registration of registrations) {
      const result = await registration.unregister()
      if (result) count++
    }
    return count
  } catch {
    return 0
  }
}

/**
 * Sends a message to the active service worker.
 * Useful for triggering cache updates or skip-waiting.
 */
export async function sendMessageToServiceWorker(message: unknown): Promise<void> {
  if (!isServiceWorkerSupported()) {
    throw new Error('Service workers are not supported')
  }

  const registration = await navigator.serviceWorker.ready
  if (registration.active) {
    registration.active.postMessage(message)
  } else {
    throw new Error('No active service worker found')
  }
}

/**
 * Registers online/offline event listeners and invokes callbacks.
 * Returns a cleanup function to remove the listeners.
 */
export function registerConnectivityListeners(
  callbacks: Pick<ServiceWorkerCallbacks, 'onOffline' | 'onOnline'>
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => callbacks.onOnline?.()
  const handleOffline = () => callbacks.onOffline?.()

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
