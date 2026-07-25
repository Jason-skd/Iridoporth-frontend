import { ApiError, extractCode, statusFallback } from './api_error'

/** Successful responses are wrapped as `{ ok: true, data: T }`. */
export type ApiEnvelope<T> = {
  ok: boolean
  data: T
}

/** Responses with no payload body. */
export type EmptyData = Record<string, never>

/** API base URL; empty string means same origin (Vite dev proxy handles /api). */
export const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * Fetch a JSON endpoint, unwrapping the `{ ok, data }` envelope. Sends
 * credentials so the HttpOnly session cookie is included. Non-OK responses
 * and malformed envelopes throw an `ApiError` carrying the backend code.
 */
export async function readJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...Object.fromEntries(headers),
    },
  })

  const text = await response.text()

  let payload: unknown
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('invalid_response', response.status)
  }

  if (!response.ok) {
    throw new ApiError(extractCode(payload) ?? statusFallback(response.status), response.status)
  }

  const envelope = payload as ApiEnvelope<T> | null
  if (!envelope || envelope.ok !== true) {
    throw new ApiError('invalid_response', response.status)
  }

  return envelope.data
}

/** Build a `RequestInit` with a JSON body for POST/PUT/PATCH calls. */
export function jsonBody(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
