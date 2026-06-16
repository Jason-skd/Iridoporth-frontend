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

async function readJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...Object.fromEntries(headers),
    },
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
  return readJson<RaspiStatus>('/api/v1/raspi/status', { signal })
}

export async function getFlightLogEntries(signal?: AbortSignal) {
  const data = await readJson<{ entries: FlightLogEntry[] }>(
    '/api/v1/flight-log',
    { signal },
  )

  return data.entries
}

export function createFlightLogEntry(
  entry: Pick<FlightLogEntry, 'content' | 'callsign'>,
  signal?: AbortSignal,
) {
  return readJson<Pick<FlightLogEntry, 'id' | 'created_at'>>('/api/v1/flight-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entry),
    signal,
  })
}
