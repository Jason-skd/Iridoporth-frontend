import { t } from '../lib/i18n'

/**
 * Backend errors arrive as `{ ok: false, error: { code } }` with only a code
 * string (no message). `ApiError` preserves that code so the UI can render
 * copy that matches what actually went wrong.
 */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, status: number) {
    super(`API error: ${code} (${status})`)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** Return the backend error code if `error` is an `ApiError`, else null. */
export function errorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

/**
 * Resolve user-facing copy for an error. Prefers the i18n key for the backend
 * code (`errors.<code>`); falls back to `fallbackKey` (default generic).
 */
export function errorMessage(
  error: unknown,
  fallbackKey = 'errors.generic',
): string {
  const code = errorCode(error)
  if (code) {
    const key = `errors.${code}`
    const message = t(key)
    if (message !== key) return message
  }
  return t(fallbackKey)
}

/** Extract `{ error: { code } }` from a parsed payload, if present. */
export function extractCode(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const error = (payload as { error?: unknown }).error
    if (error && typeof error === 'object') {
      const code = (error as { code?: unknown }).code
      if (typeof code === 'string') return code
    }
  }
  return null
}

/** Synthesize a code from HTTP status when the body carries no code. */
export function statusFallback(status: number): string {
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status >= 500) return 'internal_error'
  return 'invalid_request'
}
