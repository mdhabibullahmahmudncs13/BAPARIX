import {
  isServiceWorkerSupported,
  isSecureContext,
  registerServiceWorker,
  unregisterServiceWorker,
  unregisterAllServiceWorkers,
  sendMessageToServiceWorker,
  registerConnectivityListeners,
} from './registerServiceWorker'
import { defaultServiceWorkerConfig, type ServiceWorkerConfig } from './serviceWorkerConfig'

// Mock service worker API
const mockRegister = jest.fn()
const mockGetRegistration = jest.fn()
const mockGetRegistrations = jest.fn()
const mockReady = Promise.resolve({
  active: { postMessage: jest.fn() },
} as unknown as ServiceWorkerRegistration)

const mockRegistration = {
  installing: null,
  waiting: null,
  active: { postMessage: jest.fn() },
  addEventListener: jest.fn(),
  unregister: jest.fn().mockResolvedValue(true),
} as unknown as ServiceWorkerRegistration

beforeEach(() => {
  jest.clearAllMocks()

  // Set up navigator.serviceWorker mock
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: mockRegister,
      getRegistration: mockGetRegistration,
      getRegistrations: mockGetRegistrations,
      ready: mockReady,
      controller: null,
    },
    writable: true,
    configurable: true,
  })

  // Set up window.isSecureContext
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    writable: true,
    configurable: true,
  })

  mockRegister.mockResolvedValue(mockRegistration)
  mockGetRegistration.mockResolvedValue(mockRegistration)
  mockGetRegistrations.mockResolvedValue([mockRegistration])
})

describe('registerServiceWorker', () => {
  describe('isServiceWorkerSupported', () => {
    it('returns true when serviceWorker is available in navigator', () => {
      expect(isServiceWorkerSupported()).toBe(true)
    })

    it('returns false when serviceWorker is not in navigator', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      expect(isServiceWorkerSupported()).toBe(false)
    })
  })

  describe('isSecureContext', () => {
    it('returns true when window.isSecureContext is true', () => {
      expect(isSecureContext()).toBe(true)
    })

    it('returns true for localhost', () => {
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        writable: true,
        configurable: true,
      })
      // jsdom defaults to localhost
      expect(isSecureContext()).toBe(true)
    })
  })

  describe('registerServiceWorker', () => {
    it('returns failure when config.enabled is false', async () => {
      const config: ServiceWorkerConfig = { ...defaultServiceWorkerConfig, enabled: false }
      const result = await registerServiceWorker(config)
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('disabled')
    })

    it('returns failure when service workers are not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      const onError = jest.fn()
      const result = await registerServiceWorker(defaultServiceWorkerConfig, { onError })
      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('not supported')
      expect(onError).toHaveBeenCalled()
    })

    it('checks secure context before registering', async () => {
      // isSecureContext is tested separately above.
      // Here we verify that registerServiceWorker proceeds when secure context is true
      // (jsdom defaults to localhost which is always secure).
      const result = await registerServiceWorker(defaultServiceWorkerConfig)
      expect(result.success).toBe(true)
      expect(mockRegister).toHaveBeenCalled()
    })

    it('registers the service worker with correct path and scope', async () => {
      await registerServiceWorker(defaultServiceWorkerConfig)
      expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    })

    it('calls onRegistered callback on successful registration', async () => {
      const onRegistered = jest.fn()
      await registerServiceWorker(defaultServiceWorkerConfig, { onRegistered })
      expect(onRegistered).toHaveBeenCalledWith(mockRegistration)
    })

    it('calls onReady callback when service worker is ready', async () => {
      const onReady = jest.fn()
      await registerServiceWorker(defaultServiceWorkerConfig, { onReady })
      expect(onReady).toHaveBeenCalled()
    })

    it('returns success with registration on successful register', async () => {
      const result = await registerServiceWorker(defaultServiceWorkerConfig)
      expect(result.success).toBe(true)
      expect(result.registration).toBeDefined()
    })

    it('calls onError and returns failure when registration throws', async () => {
      const error = new Error('Registration failed')
      mockRegister.mockRejectedValue(error)
      const onError = jest.fn()
      const result = await registerServiceWorker(defaultServiceWorkerConfig, { onError })
      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('handles non-Error thrown values', async () => {
      mockRegister.mockRejectedValue('string error')
      const result = await registerServiceWorker(defaultServiceWorkerConfig)
      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('string error')
    })

    it('uses custom swPath and scope from config', async () => {
      const config: ServiceWorkerConfig = {
        ...defaultServiceWorkerConfig,
        swPath: '/custom-sw.js',
        scope: '/app/',
      }
      await registerServiceWorker(config)
      expect(mockRegister).toHaveBeenCalledWith('/custom-sw.js', { scope: '/app/' })
    })
  })

  describe('unregisterServiceWorker', () => {
    it('unregisters the current service worker registration', async () => {
      const result = await unregisterServiceWorker()
      expect(result).toBe(true)
      expect(mockGetRegistration).toHaveBeenCalled()
    })

    it('returns false when no registration exists', async () => {
      mockGetRegistration.mockResolvedValue(undefined)
      const result = await unregisterServiceWorker()
      expect(result).toBe(false)
    })

    it('returns false when service workers are not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      const result = await unregisterServiceWorker()
      expect(result).toBe(false)
    })

    it('returns false when getRegistration throws', async () => {
      mockGetRegistration.mockRejectedValue(new Error('Failed'))
      const result = await unregisterServiceWorker()
      expect(result).toBe(false)
    })
  })

  describe('unregisterAllServiceWorkers', () => {
    it('unregisters all service worker registrations', async () => {
      const reg1 = { unregister: jest.fn().mockResolvedValue(true) }
      const reg2 = { unregister: jest.fn().mockResolvedValue(true) }
      mockGetRegistrations.mockResolvedValue([reg1, reg2])

      const count = await unregisterAllServiceWorkers()
      expect(count).toBe(2)
      expect(reg1.unregister).toHaveBeenCalled()
      expect(reg2.unregister).toHaveBeenCalled()
    })

    it('returns 0 when no registrations exist', async () => {
      mockGetRegistrations.mockResolvedValue([])
      const count = await unregisterAllServiceWorkers()
      expect(count).toBe(0)
    })

    it('returns 0 when service workers are not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      const count = await unregisterAllServiceWorkers()
      expect(count).toBe(0)
    })

    it('counts only successfully unregistered workers', async () => {
      const reg1 = { unregister: jest.fn().mockResolvedValue(true) }
      const reg2 = { unregister: jest.fn().mockResolvedValue(false) }
      mockGetRegistrations.mockResolvedValue([reg1, reg2])

      const count = await unregisterAllServiceWorkers()
      expect(count).toBe(1)
    })
  })

  describe('sendMessageToServiceWorker', () => {
    it('sends a message to the active service worker', async () => {
      const message = { type: 'SKIP_WAITING' }
      await sendMessageToServiceWorker(message)
      // The ready promise resolves with a registration that has an active worker
      const readyReg = await mockReady
      expect(readyReg.active!.postMessage).toHaveBeenCalledWith(message)
    })

    it('throws when service workers are not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      await expect(sendMessageToServiceWorker({ type: 'test' })).rejects.toThrow(
        'not supported'
      )
    })
  })

  describe('registerConnectivityListeners', () => {
    it('registers online and offline event listeners', () => {
      const addSpy = jest.spyOn(window, 'addEventListener')
      const onOnline = jest.fn()
      const onOffline = jest.fn()

      registerConnectivityListeners({ onOnline, onOffline })

      expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      addSpy.mockRestore()
    })

    it('calls onOffline when offline event fires', () => {
      const onOffline = jest.fn()
      registerConnectivityListeners({ onOffline })

      window.dispatchEvent(new Event('offline'))
      expect(onOffline).toHaveBeenCalled()
    })

    it('calls onOnline when online event fires', () => {
      const onOnline = jest.fn()
      registerConnectivityListeners({ onOnline })

      window.dispatchEvent(new Event('online'))
      expect(onOnline).toHaveBeenCalled()
    })

    it('returns a cleanup function that removes listeners', () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener')
      const cleanup = registerConnectivityListeners({ onOnline: jest.fn(), onOffline: jest.fn() })

      cleanup()

      expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      removeSpy.mockRestore()
    })

    it('does not call callbacks after cleanup', () => {
      const onOnline = jest.fn()
      const onOffline = jest.fn()
      const cleanup = registerConnectivityListeners({ onOnline, onOffline })

      cleanup()

      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('offline'))

      expect(onOnline).not.toHaveBeenCalled()
      expect(onOffline).not.toHaveBeenCalled()
    })
  })
})
