/**
 * Service Worker Configuration
 *
 * Defines caching strategies for the VentureOS PWA using Workbox patterns.
 * - CacheFirst: Static assets (fonts, images, CSS, JS bundles)
 * - StaleWhileRevalidate: API responses
 * - NetworkFirst: HTML pages (navigation requests)
 */

export type CachingStrategyName =
  | 'CacheFirst'
  | 'StaleWhileRevalidate'
  | 'NetworkFirst'
  | 'NetworkOnly'
  | 'CacheOnly'

export interface CacheExpiration {
  /** Maximum number of entries in the cache */
  maxEntries?: number
  /** Maximum age of entries in seconds */
  maxAgeSeconds?: number
}

export interface CachingStrategy {
  /** Name of the Workbox caching strategy */
  strategyName: CachingStrategyName
  /** Name of the cache storage bucket */
  cacheName: string
  /** URL pattern to match (converted to RegExp at runtime) */
  urlPattern: string
  /** Optional expiration settings */
  expiration?: CacheExpiration
  /** HTTP methods to match */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

export interface ServiceWorkerConfig {
  /** Whether the service worker is enabled */
  enabled: boolean
  /** Path to the service worker file */
  swPath: string
  /** Scope of the service worker */
  scope: string
  /** List of caching strategies to apply */
  cachingStrategies: CachingStrategy[]
  /** URLs to precache on install */
  precacheUrls: string[]
  /** Whether to skip waiting on install */
  skipWaiting: boolean
  /** Whether to claim clients immediately */
  clientsClaim: boolean
}

/**
 * Static assets caching strategy (CacheFirst).
 * Serves from cache first, falls back to network.
 * Best for versioned assets that rarely change.
 */
export const staticAssetStrategy: CachingStrategy = {
  strategyName: 'CacheFirst',
  cacheName: 'static-assets-v1',
  urlPattern: '\\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$',
  expiration: {
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  method: 'GET',
}

/**
 * API response caching strategy (StaleWhileRevalidate).
 * Serves from cache immediately while fetching fresh data in the background.
 * Best for API responses where slightly stale data is acceptable.
 */
export const apiResponseStrategy: CachingStrategy = {
  strategyName: 'StaleWhileRevalidate',
  cacheName: 'api-responses-v1',
  urlPattern: '/api/',
  expiration: {
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  method: 'GET',
}

/**
 * HTML/navigation caching strategy (NetworkFirst).
 * Tries network first, falls back to cache for offline support.
 * Best for HTML pages that should always show the latest content when online.
 */
export const htmlNavigationStrategy: CachingStrategy = {
  strategyName: 'NetworkFirst',
  cacheName: 'html-pages-v1',
  urlPattern: '/',
  expiration: {
    maxEntries: 25,
    maxAgeSeconds: 24 * 60 * 60, // 24 hours
  },
  method: 'GET',
}

/**
 * Next.js data caching strategy (StaleWhileRevalidate).
 * Caches Next.js RSC payloads and data fetches.
 */
export const nextDataStrategy: CachingStrategy = {
  strategyName: 'StaleWhileRevalidate',
  cacheName: 'next-data-v1',
  urlPattern: '/_next/data/',
  expiration: {
    maxEntries: 30,
    maxAgeSeconds: 10 * 60, // 10 minutes
  },
  method: 'GET',
}

/**
 * Default service worker configuration for VentureOS.
 * Strategies are ordered from most specific to least specific
 * so that getStrategyForUrl matches correctly.
 */
export const defaultServiceWorkerConfig: ServiceWorkerConfig = {
  enabled: true,
  swPath: '/sw.js',
  scope: '/',
  cachingStrategies: [
    staticAssetStrategy,
    apiResponseStrategy,
    nextDataStrategy,
    htmlNavigationStrategy, // Most general pattern last
  ],
  precacheUrls: ['/', '/offline'],
  skipWaiting: true,
  clientsClaim: true,
}

/**
 * Returns the caching strategy for a given URL.
 * Matches URL against configured patterns and returns the first match.
 */
export function getStrategyForUrl(
  url: string,
  config: ServiceWorkerConfig = defaultServiceWorkerConfig
): CachingStrategy | null {
  for (const strategy of config.cachingStrategies) {
    const regex = new RegExp(strategy.urlPattern)
    if (regex.test(url)) {
      return strategy
    }
  }
  return null
}

/**
 * Checks if a cache entry has expired based on its strategy's expiration settings.
 */
export function isCacheExpired(
  entryTimestamp: number,
  strategy: CachingStrategy
): boolean {
  if (!strategy.expiration?.maxAgeSeconds) {
    return false
  }
  const now = Date.now()
  const ageMs = now - entryTimestamp
  const maxAgeMs = strategy.expiration.maxAgeSeconds * 1000
  return ageMs > maxAgeMs
}

/**
 * Creates a Workbox-compatible runtime caching configuration array.
 * This can be passed to workbox-build or workbox-webpack-plugin.
 */
export function buildRuntimeCachingConfig(
  config: ServiceWorkerConfig = defaultServiceWorkerConfig
) {
  return config.cachingStrategies.map((strategy) => ({
    urlPattern: new RegExp(strategy.urlPattern),
    handler: strategy.strategyName,
    options: {
      cacheName: strategy.cacheName,
      expiration: strategy.expiration
        ? {
            maxEntries: strategy.expiration.maxEntries,
            maxAgeSeconds: strategy.expiration.maxAgeSeconds,
          }
        : undefined,
    },
    method: strategy.method || 'GET',
  }))
}
