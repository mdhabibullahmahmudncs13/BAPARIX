import {
  logError,
  logWarning,
  captureException,
  sanitizeErrorData,
} from './errorLogger'

describe('errorLogger', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('logError', () => {
    it('should log an Error object to the monitoring service', () => {
      const error = new Error('Something went wrong')
      logError(error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const [label, entry] = consoleErrorSpy.mock.calls[0]
      expect(label).toBe('[ErrorLogger]')
      expect(entry.message).toBe('Something went wrong')
      expect(entry.severity).toBe('error')
      expect(entry.stack).toBeDefined()
    })

    it('should log a string error', () => {
      logError('Network timeout')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.message).toBe('Network timeout')
      expect(entry.severity).toBe('error')
    })

    it('should handle unknown error types gracefully', () => {
      logError(42)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.message).toBe('An unexpected error occurred')
    })

    it('should include context metadata when provided', () => {
      logError(new Error('fail'), {
        component: 'Dashboard',
        action: 'fetchData',
        metadata: { retryCount: 3 },
      })

      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.context.component).toBe('Dashboard')
      expect(entry.context.action).toBe('fetchData')
      expect(entry.context.metadata.retryCount).toBe(3)
    })

    it('should include timestamp in ISO format', () => {
      logError(new Error('test'))

      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      )
    })

    it('should include page URL', () => {
      logError(new Error('test'))

      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.url).toBeDefined()
    })

    it('should include user agent', () => {
      logError(new Error('test'))

      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.userAgent).toBeDefined()
    })
  })

  describe('logWarning', () => {
    it('should log a warning message', () => {
      logWarning('Deprecated API usage')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const [label, entry] = consoleWarnSpy.mock.calls[0]
      expect(label).toBe('[ErrorLogger]')
      expect(entry.message).toBe('Deprecated API usage')
      expect(entry.severity).toBe('warning')
    })

    it('should include context when provided', () => {
      logWarning('Slow response', { component: 'API', action: 'search' })

      const [, entry] = consoleWarnSpy.mock.calls[0]
      expect(entry.context.component).toBe('API')
      expect(entry.context.action).toBe('search')
    })
  })

  describe('captureException', () => {
    it('should return an event ID string', () => {
      const eventId = captureException(new Error('test'))

      expect(typeof eventId).toBe('string')
      expect(eventId).toHaveLength(32)
      expect(eventId).toMatch(/^[a-f0-9]+$/)
    })

    it('should log the error internally', () => {
      captureException(new Error('captured'))

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.message).toBe('captured')
    })

    it('should include tags in context metadata', () => {
      captureException(new Error('tagged'), {
        tags: { module: 'auth', severity: 'high' },
      })

      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.context.metadata.module).toBe('auth')
      expect(entry.context.metadata.severity).toBe('high')
    })

    it('should sanitize extra data before logging', () => {
      captureException(new Error('sensitive'), {
        extra: { userId: 'user123', apiKey: 'secret-key-123' },
      })

      const [, entry] = consoleErrorSpy.mock.calls[0]
      expect(entry.context.metadata.userId).toBe('user123')
      expect(entry.context.metadata.apiKey).toBe('[REDACTED]')
    })
  })

  describe('sanitizeErrorData', () => {
    it('should redact password fields', () => {
      const result = sanitizeErrorData({ password: 'secret123' })
      expect(result.password).toBe('[REDACTED]')
    })

    it('should redact token fields', () => {
      const result = sanitizeErrorData({ authToken: 'abc123' })
      expect(result.authToken).toBe('[REDACTED]')
    })

    it('should redact api key fields', () => {
      const result = sanitizeErrorData({ apiKey: 'key-123' })
      expect(result.apiKey).toBe('[REDACTED]')
    })

    it('should redact nested sensitive fields', () => {
      const result = sanitizeErrorData({
        user: { name: 'John', sessionToken: 'xyz' },
      })
      const user = result.user as Record<string, unknown>
      expect(user.name).toBe('John')
      expect(user.sessionToken).toBe('[REDACTED]')
    })

    it('should preserve non-sensitive fields', () => {
      const result = sanitizeErrorData({
        name: 'John',
        age: 30,
        active: true,
      })
      expect(result.name).toBe('John')
      expect(result.age).toBe(30)
      expect(result.active).toBe(true)
    })

    it('should handle arrays without modification', () => {
      const result = sanitizeErrorData({ items: [1, 2, 3] })
      expect(result.items).toEqual([1, 2, 3])
    })

    it('should be case-insensitive for sensitive key detection', () => {
      const result = sanitizeErrorData({
        PASSWORD: 'secret',
        Authorization: 'Bearer xyz',
      })
      expect(result.PASSWORD).toBe('[REDACTED]')
      expect(result.Authorization).toBe('[REDACTED]')
    })
  })
})
