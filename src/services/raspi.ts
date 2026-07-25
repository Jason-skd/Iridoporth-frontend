import type { RaspiStatus } from '../api/raspi'
import { readJson } from '../http/client'

export function getRaspiStatus(signal?: AbortSignal) {
  return readJson<RaspiStatus>('/api/v1/raspi/status', { signal })
}
