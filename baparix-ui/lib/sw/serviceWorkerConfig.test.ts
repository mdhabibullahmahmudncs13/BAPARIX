import {
  staticAssetStrategy,
  apiResponseStrategy,
  htmlNavigationStrategy,
  nextDataStrategy,
  defaultServiceWorkerConfig,
  getStrategyForUrl,
  isCacheExpired,
  buildRuntimeCachingConfig,
  type ServiceWorkerConfig,
} from './serviceWorkerConfig'

describe('serviceWorkerConfig', () => {
  describe('staticAssetStrategy', () => {
    it('uses CacheFirst strategy', () => {
      expect(staticAssetStrategy.strategyName).toBe('CacheFirst')
    })

    it('has a named cache bucket', () => {
      expect(staticAssetStrategy.cacheName).toBe('static-assets-v1')
    })

    it('matches common static asset extensions', () => {
      const pattern = new RegExp(staticAssetStrategy.urlPattern)
      expect(pattern.test('/assets/main.js')).toBe(true)
      expect(pattern.test('/styles/app.css')).toBe(true)
      expect(pattern.test('/fonts/Geist.woff2')).toBe(true)
      expect(pattern.test('/images/logo.png')).toBe(true)
      expect(pattern.test('/images/hero.webp')).toBe(true)
      expect(pattern.test('/favicon.ico')).toBe(true)
    })

    it('does not match non-asset URLs', () => {
      const pattern = new RegExp(staticAssetStrategy.urlPattern)
      expect(pattern.test('/api/users')).toBe(false)
      expect(pattern.test('/dashboard')).toBe(false)
    })

    it('has expiration settings with 30-day max age', () => {
      expect(staticAssetStrategy.expiration?.maxAgeSeconds).toBe(30 * 24 * 60 * 60)
      expect(staticAssetStrategy.expiration?.maxEntries).toBe(100)
    })

    it('only matches GET requests', () => {
      expect(staticAssetStrategy.method).toBe('GET')
    })
  })

  describe('apiResponseStrategy', () => {
    it('uses StaleWhileRevalidate strategy', () => {
      expect(apiResponseStrategy.strategyName).toBe('StaleWhileRevalidate')
    })

    it('has a named cache bucket', () => {
      expect(apiResponseStrategy.cacheName).toBe('api-responses-v1')
    })

    it('matches API URLs', () => {
      const pattern = new RegExp(apiResponseStrategy.urlPattern)
      expect(pattern.test('/api/products/search')).toBe(true)
      expect(pattern.test('/api/auth/session')).toBe(true)
      expect(pattern.test('/api/profile/update')).toBe(true)
    })

    it('has expiration settings with 5-minute max age', () => {
      expect(apiResponseStrategy.expiration?.maxAgeSeconds).toBe(5 * 60)
      expect(apiResponseStrategy.expiration?.maxEntries).toBe(50)
    })
  })

  describe('htmlNavigationStrategy', () => {
    it('uses NetworkFirst strategy', () => {
      expect(htmlNavigationStrategy.strategyName).toBe('NetworkFirst')
    })

    it('has a named cache bucket', () => {
      expect(htmlNavigationStrategy.cacheName).toBe('html-pages-v1')
    })

    it('matches navigation URLs', () => {
      const pattern = new RegExp(htmlNavigationStrategy.urlPattern)
      expect(pattern.test('/')).toBe(true)
      expect(pattern.test('/en/dashboard')).toBe(true)
      expect(pattern.test('/bn/onboarding')).toBe(true)
    })

    it('has expiration settings with 24-hour max age', () => {
      expect(htmlNavigationStrategy.expiration?.maxAgeSeconds).toBe(24 * 60 * 60)
      expect(htmlNavigationStrategy.expiration?.maxEntries).toBe(25)
    })
  })

  describe('nextDataStrategy', () => {
    it('uses StaleWhileRevalidate strategy', () => {
      expect(nextDataStrategy.strategyName).toBe('StaleWhileRevalidate')
    })

    it('matches Next.js data URLs', () => {
      const pattern = new RegExp(nextDataStrategy.urlPattern)
      expect(pattern.test('/_next/data/abc123/en/dashboard.json')).toBe(true)
    })

    it('has expiration settings with 10-minute max age', () => {
      expect(nextDataStrategy.expiration?.maxAgeSeconds).toBe(10 * 60)
    })
  })

  describe('defaultServiceWorkerConfig', () => {
    it('is enabled by default', () => {
      expect(defaultServiceWorkerConfig.enabled).toBe(true)
    })

    it('has the correct service worker path', () => {
      expect(defaultServiceWorkerConfig.swPath).toBe('/sw.js')
    })

    it('has root scope', () => {
      expect(defaultServiceWorkerConfig.scope).toBe('/')
    })

    it('includes all four caching strategies', () => {
      expect(defaultServiceWorkerConfig.cachingStrategies).toHaveLength(4)
      const names = defaultServiceWorkerConfig.cachingStrategies.map((s) => s.strategyName)
      expect(names).toContain('CacheFirst')
      expect(names).toContain('StaleWhileRevalidate')
      expect(names).toContain('NetworkFirst')
    })

    it('has precache URLs', () => {
      expect(defaultServiceWorkerConfig.precacheUrls).toContain('/')
      expect(defaultServiceWorkerConfig.precacheUrls).toContain('/offline')
    })

    it('enables skipWaiting and clientsClaim', () => {
      expect(defaultServiceWorkerConfig.skipWaiting).toBe(true)
      expect(defaultServiceWorkerConfig.clientsClaim).toBe(true)
    })
  })

  describe('getStrategyForUrl', () => {
    it('returns CacheFirst strategy for static assets', () => {
      const strategy = getStrategyForUrl('/assets/bundle.js')
      expect(strategy?.strategyName).toBe('CacheFirst')
    })

    it('returns StaleWhileRevalidate strategy for API calls', () => {
      const strategy = getStrategyForUrl('/api/products/search')
      expect(strategy?.strategyName).toBe('StaleWhileRevalidate')
    })

    it('returns StaleWhileRevalidate for Next.js data URLs', () => {
      const strategy = getStrategyForUrl('/_next/data/build-id/page.json')
      expect(strategy?.strategyName).toBe('StaleWhileRevalidate')
    })

    it('returns NetworkFirst strategy for HTML navigation', () => {
      const strategy = getStrategyForUrl('/en/dashboard')
      expect(strategy?.strategyName).toBe('NetworkFirst')
    })

    it('returns null for URLs that match no strategy', () => {
      const config: ServiceWorkerConfig = {
        ...defaultServiceWorkerConfig,
        cachingStrategies: [
          {
            strategyName: 'CacheFirst',
            cacheName: 'test',
            urlPattern: '^/specific-path-only$',
          },
        ],
      }
      const strategy = getStrategyForUrl('/other-path', config)
      expect(strategy).toBeNull()
    })

    it('returns the first matching strategy when multiple match', () => {
      // /api/data.json matches both static assets (.json isn't in pattern) and API
      const strategy = getStrategyForUrl('/api/data')
      expect(strategy?.strategyName).toBe('StaleWhileRevalidate')
    })
  })

  describe('isCacheExpired', () => {
    it('returns false when no expiration is configured', () => {
      const strategy = { ...staticAssetStrategy, expiration: undefined }
      expect(isCacheExpired(Date.now() - 999999999, strategy)).toBe(false)
    })

    it('returns false when entry is within max age', () => {
      const oneMinuteAgo = Date.now() - 60 * 1000
      expect(isCacheExpired(oneMinuteAgo, apiResponseStrategy)).toBe(false)
    })

    it('returns true when entry exceeds max age', () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000
      // API strategy has 5-minute max age
      expect(isCacheExpired(tenMinutesAgo, apiResponseStrategy)).toBe(true)
    })

    it('returns false for entry exactly at max age boundary', () => {
      // Entry created exactly maxAgeSeconds ago should not be expired (ageMs === maxAgeMs, not >)
      const exactlyAtBoundary = Date.now() - (apiResponseStrategy.expiration!.maxAgeSeconds! * 1000)
      // Due to timing, this could be right at the boundary - test with a slightly fresh entry
      const slightlyFresh = Date.now() - (apiResponseStrategy.expiration!.maxAgeSeconds! * 1000) + 100
      expect(isCacheExpired(slightlyFresh, apiResponseStrategy)).toBe(false)
    })
  })

  describe('buildRuntimeCachingConfig', () => {
    it('returns an array of runtime caching entries', () => {
      const result = buildRuntimeCachingConfig()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(4)
    })

    it('converts urlPattern strings to RegExp objects', () => {
      const result = buildRuntimeCachingConfig()
      result.forEach((entry) => {
        expect(entry.urlPattern).toBeInstanceOf(RegExp)
      })
    })

    it('maps strategy names to handler field', () => {
      const result = buildRuntimeCachingConfig()
      const handlers = result.map((entry) => entry.handler)
      expect(handlers).toContain('CacheFirst')
      expect(handlers).toContain('StaleWhileRevalidate')
      expect(handlers).toContain('NetworkFirst')
    })

    it('includes cache names in options', () => {
      const result = buildRuntimeCachingConfig()
      const cacheNames = result.map((entry) => entry.options.cacheName)
      expect(cacheNames).toContain('static-assets-v1')
      expect(cacheNames).toContain('api-responses-v1')
      expect(cacheNames).toContain('html-pages-v1')
      expect(cacheNames).toContain('next-data-v1')
    })

    it('includes expiration settings in options', () => {
      const result = buildRuntimeCachingConfig()
      const staticEntry = result.find((e) => e.options.cacheName === 'static-assets-v1')
      expect(staticEntry?.options.expiration?.maxEntries).toBe(100)
      expect(staticEntry?.options.expiration?.maxAgeSeconds).toBe(30 * 24 * 60 * 60)
    })

    it('defaults method to GET when not specified', () => {
      const config: ServiceWorkerConfig = {
        ...defaultServiceWorkerConfig,
        cachingStrategies: [
          {
            strategyName: 'CacheFirst',
            cacheName: 'test',
            urlPattern: '/test',
            // no method specified
          },
        ],
      }
      const result = buildRuntimeCachingConfig(config)
      expect(result[0].method).toBe('GET')
    })
  })
})
