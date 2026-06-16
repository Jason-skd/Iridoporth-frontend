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
}

type ApiEnvelope<T> = {
  ok: boolean
  data: T
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''

async function readJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  const payload = (await response.json()) as ApiEnvelope<T>

  if (!payload.ok) {
    throw new Error('API returned an unsuccessful response')
  }

  return payload.data
}

export function getRaspiStatus(signal?: AbortSignal) {
  return readJson<RaspiStatus>('/api/v1/raspi/status', signal)
}

export async function getFlightLogEntries(signal?: AbortSignal) {
  const data = await readJson<{ entries: FlightLogEntry[] }>(
    '/api/v1/flight-log',
    signal,
  )

  return data.entries
}

