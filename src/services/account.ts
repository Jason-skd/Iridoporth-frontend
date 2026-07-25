import type { EmptyData } from '../http/client'
import { jsonBody, readJson } from '../http/client'

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
