/**
 * Client-side error logging utility.
 *
 * Logs errors to a monitoring service (Sentry placeholder) without
 * exposing technical details to users.
 *
 * Validates: Requirements 17.6
 */

export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info'

export interface ErrorContext {
  /** Component or module where the error occurred */
  component?: string
  /** Action the user was performing */
  action?: string
  /** Additional metadata (must not contain sensitive data) */
  metadata?: Record<string, string | number | boolean>
}

interface LogEntry {
  message: string
  severity: ErrorSeverity
  timestamp: string
  url: string
  userAgent: string
  context?: ErrorContext
}

/** Keys that should be stripped from error data to avoid leaking sensitive info */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'creditCard',
  'ssn',
  'api_key',
  'apiKey',
  'private_key',
  'privateKey',
]

/**
 * Sanitizes an object by removing keys that may contain sensitive data.
 */
export function sanitizeErrorData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeErrorData(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Extracts a safe, user-friendly message from an error without exposing internals.
 */
function getSafeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

/**
 * Builds a structured log entry with context metadata.
 */
function buildLogEntry(
  message: string,
  severity: ErrorSeverity,
  context?: ErrorContext
): LogEntry {
  return {
    message,
    severity,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    context,
  }
}

/**
 * Sends the log entry to the monitoring service.
 * Currently uses console.error as a placeholder for Sentry integration.
 *
 * TODO: Replace with Sentry.captureMessage / Sentry.captureException
 * when Sentry SDK is integrated.
 */
function sendToMonitoringService(entry: LogEntry): void {
  // Placeholder: log to console in development
  // In production, this would forward to Sentry or similar service
  if (typeof console !== 'undefined') {
    const logFn =
      entry.severity === 'warning' ? console.warn : console.error
    logFn('[ErrorLogger]', entry)
  }
}

/**
 * Logs an error to the monitoring service.
 * Does NOT expose technical details to the user.
 *
 * @param error - The error to log (Error object, string, or unknown)
 * @param context - Optional context about where/how the error occurred
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const message = getSafeMessage(error)
  const entry = buildLogEntry(message, 'error', context)

  // Attach stack trace for monitoring (not shown to user)
  if (error instanceof Error && error.stack) {
    ;(entry as LogEntry & { stack?: string }).stack = error.stack
  }

  sendToMonitoringService(entry)
}

/**
 * Logs a warning (non-critical issue) to the monitoring service.
 *
 * @param message - Warning message
 * @param context - Optional context about where/how the warning occurred
 */
export function logWarning(message: string, context?: ErrorContext): void {
  const entry = buildLogEntry(message, 'warning', context)
  sendToMonitoringService(entry)
}

/**
 * Captures an exception in a Sentry-compatible way.
 * This function is designed to be a drop-in replacement for Sentry.captureException.
 *
 * @param error - The error to capture
 * @param captureContext - Optional context with extra data and tags
 * @returns A generated event ID string (for correlation)
 */
export function captureException(
  error: unknown,
  captureContext?: {
    extra?: Record<string, unknown>
    tags?: Record<string, string>
  }
): string {
  const eventId = generateEventId()

  const context: ErrorContext = {
    metadata: {},
  }

  if (captureContext?.tags) {
    context.metadata = { ...captureContext.tags }
  }

  if (captureContext?.extra) {
    const sanitizedExtra = sanitizeErrorData(captureContext.extra)
    for (const [key, value] of Object.entries(sanitizedExtra)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        context.metadata![key] = value
      }
    }
  }

  logError(error, context)

  return eventId
}

/**
 * Generates a unique event ID for error correlation.
 */
function generateEventId(): string {
  const chars = 'abcdef0123456789'
  let id = ''
  for (let i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}
