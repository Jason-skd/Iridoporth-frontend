// Lightweight fetch wrapper.
//
// Goals:
//   - thin: no third-party HTTP lib, no magic
//   - explicit: a single `request<T>` entry, callers pass path + init
//   - typed errors: non-2xx becomes a thrown `ApiError` so callers can
//     `instanceof ApiError` to distinguish transport errors from logic errors
//
// Anything more elaborate (retries, timeouts, abort signals, structured
// backend error envelopes) can be layered on top without changing call sites.

class ApiError extends Error {
  status: number
  constructor({ status, message }: { status: number; message: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ApiErrorShape = InstanceType<typeof ApiError>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  }

  const response = await fetch(path, { ...init, headers })

  if (!response.ok) {
    const fallback = `Request failed (${response.status})`
    const message = await response.text().catch(() => fallback)
    throw new ApiError({
      status: response.status,
      message: message || fallback,
    })
  }

  // The backend always replies with JSON; cast is intentional — runtime
  // validation is the caller's responsibility (the wire types are shared
  // with the Zig structs in the backend).
  return (await response.json()) as T
}

export { request, ApiError }
export type { ApiErrorShape }
