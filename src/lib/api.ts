import { t } from './i18n'

export type RaspiStatus = {
  available: boolean
  name: string | null
  cpu_temperature: number | null
  cpu_usage: number | null
  memory_usage: number | null
}

export type FlightLogEntry = {
  id: number
  content: string
  callsign: string | null
  created_at: number
  response: string | null
  responded_at: number | null
  created_by_this_user: boolean
  likes: number
  liked_by_this_user: boolean
}

export type AdminFlightLogEntry = FlightLogEntry & {
  deleted_at: number | null
  hidden_at: number | null
}

type ApiEnvelope<T> = {
  ok: boolean
  data: T
}

type EmptyData = Record<string, never>

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

export function errorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null
}

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

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

function extractCode(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const error = (payload as { error?: unknown }).error
    if (error && typeof error === 'object') {
      const code = (error as { code?: unknown }).code
      if (typeof code === 'string') return code
    }
  }
  return null
}

function statusFallback(status: number): string {
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status >= 500) return 'internal_error'
  return 'invalid_request'
}

async function readJson<T>(path: string, options: RequestInit = {}): Promise<T> {
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

function jsonBody(body: unknown): RequestInit {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function getRaspiStatus(signal?: AbortSignal) {
  return readJson<RaspiStatus>('/api/v1/raspi/status', { signal })
}

export async function getFlightLogEntries(signal?: AbortSignal) {
  const data = await readJson<{ entries: FlightLogEntry[] }>(
    '/api/v1/flight-log',
    { signal },
  )

  return data.entries
}

export function createFlightLogEntry(entry: { content: string }, signal?: AbortSignal) {
  return readJson<{ id: number; created_at: number }>('/api/v1/flight-log', {
    method: 'POST',
    ...jsonBody(entry),
    signal,
  })
}

export async function getAdminFlightLogEntries(signal?: AbortSignal) {
  const data = await readJson<{ entries: AdminFlightLogEntry[] }>(
    '/api/v1/flight-log/admin',
    { signal },
  )

  return data.entries
}

export function likeFlightLogEntry(id: number, signal?: AbortSignal) {
  return readJson<EmptyData>(`/api/v1/flight-log/${id}/like`, {
    method: 'POST',
    signal,
  })
}

export function unlikeFlightLogEntry(id: number, signal?: AbortSignal) {
  return readJson<EmptyData>(`/api/v1/flight-log/${id}/like`, {
    method: 'DELETE',
    signal,
  })
}

export function deleteFlightLogEntry(id: number, signal?: AbortSignal) {
  return readJson<EmptyData>(`/api/v1/flight-log/${id}`, {
    method: 'PATCH',
    ...jsonBody({ is_deleted: true }),
    signal,
  })
}

export function setFlightLogHidden(id: number, hidden: boolean, signal?: AbortSignal) {
  return readJson<EmptyData>(`/api/v1/flight-log/${id}`, {
    method: 'PATCH',
    ...jsonBody({ is_hidden: hidden }),
    signal,
  })
}

export function respondFlightLogEntry(id: number, response: string, signal?: AbortSignal) {
  return readJson<EmptyData>(`/api/v1/flight-log/${id}`, {
    method: 'PATCH',
    ...jsonBody({ response }),
    signal,
  })
}

export function clearFlightLogResponse(id: number, signal?: AbortSignal) {
  return readJson<EmptyData>(`/api/v1/flight-log/${id}`, {
    method: 'PATCH',
    ...jsonBody({ clear_response: true }),
    signal,
  })
}

export function login(email: string, password: string, signal?: AbortSignal) {
  return readJson<{ success: boolean }>('/api/v1/login', {
    method: 'POST',
    ...jsonBody({ email, password }),
    signal,
  })
}

/**
 * Rotate the signed-in account's password. Backend (`PUT /api/v1/account/password`)
 * requires the current password and validates the new one (ASCII, no whitespace,
 * 8–128 codepoints). `unauthenticated` is currently overloaded there — it also
 * covers a wrong `current_password` since no distinct code exists yet — so
 * callers treat it as an expired session and redirect to /login.
 */
export function changePassword(
  currentPassword: string,
  newPassword: string,
  signal?: AbortSignal,
) {
  return readJson<EmptyData>('/api/v1/account/password', {
    method: 'PUT',
    ...jsonBody({ current_password: currentPassword, new_password: newPassword }),
    signal,
  })
}
