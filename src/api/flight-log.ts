// Wire types for the flight-log backend.
//
// Backend source: ../Iridoporth-backend/src/endpoints/flight_log.zig
//   GET  /api/v1/flight-log         -> { ok: true, data: { entries: Entry[] } }
//   POST /api/v1/flight-log         -> { ok: true, data: { id, created_at } }
//
// Notes on the contract:
//   - `created_at` is Unix SECONDS, not milliseconds (the backend sets it
//     via `std.Io.Timestamp.now(...).toSeconds()`). The UI is responsible
//     for multiplying by 1000 before constructing a `Date`.
//   - The POST response intentionally does NOT echo `content` / `callsign` —
//     the client keeps the original input and merges in the server-generated
//     `id` + `created_at` for optimistic display.

import { request } from './client'

type FlightLogEntry = {
  id: number
  content: string
  callsign: string | null
  created_at: number
}

type FlightLogPostResponse = {
  ok: true
  data: { id: number; created_at: number }
}

type NewFlightLogEntry = {
  content: string
  callsign: string | null
}

type Envelope = { ok: true; data: { entries: FlightLogEntry[] } }

function listFlightLog(): Promise<FlightLogEntry[]> {
  return request<Envelope>('/api/v1/flight-log').then((envelope) => envelope.data.entries)
}

function createFlightLog(entry: NewFlightLogEntry): Promise<{ id: number; created_at: number }> {
  return request<FlightLogPostResponse>('/api/v1/flight-log', {
    method: 'POST',
    body: JSON.stringify(entry),
  }).then((envelope) => envelope.data)
}

export { listFlightLog, createFlightLog }
export type { FlightLogEntry, NewFlightLogEntry }
