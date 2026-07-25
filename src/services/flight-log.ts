import type { AdminFlightLogEntry, FlightLogEntry } from '../api/flight-log'
import type { EmptyData } from '../http/client'
import { jsonBody, readJson } from '../http/client'

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
