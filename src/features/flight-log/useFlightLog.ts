// useFlightLog — local state for the flight-log "tree-hole" page.
//
// Responsibilities:
//   - On mount, fetch the full entry list once. No polling: the page is
//     anonymous, write-only-by-the-current-user; the only way the list
//     grows is through the local `submit` action, so remote polling
//     would not be useful.
//   - On submit, insert the new entry optimistically at the top of the
//     list, then replace the optimistic row with the server-issued
//     `id` / `created_at`. On failure, roll back the insertion and
//     expose the error to the caller.
//
// `tempId` is `-Date.now()` so it is guaranteed negative and unique
// within a session, distinct from the backend's monotonically positive
// AUTOINCREMENT ids.

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, type ApiErrorShape } from '../../api/client'
import {
  createFlightLog,
  listFlightLog,
  type FlightLogEntry,
  type NewFlightLogEntry,
} from '../../api/flight-log'

type FlightLogStatus = 'idle' | 'loading' | 'ready' | 'error'

type FlightLogState = {
  entries: FlightLogEntry[]
  status: FlightLogStatus
  loadError: string | null
  submitError: string | null
}

type SubmitResult =
  | { ok: true }
  | { ok: false; error: string }

const INITIAL_STATE: FlightLogState = {
  entries: [],
  status: 'idle',
  loadError: null,
  submitError: null,
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return fallback
}

function useFlightLog() {
  const [state, setState] = useState<FlightLogState>(INITIAL_STATE)
  const submitErrorTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setState((prev) => ({ ...prev, status: 'loading', loadError: null }))

      try {
        const entries = await listFlightLog()
        if (isMounted) {
          setState((prev) => ({ ...prev, entries, status: 'ready' }))
        }
      } catch (err) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            entries: [],
            loadError: describeError(err, '日志暂时无法打开'),
          }))
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (submitErrorTimer.current !== undefined) {
        window.clearTimeout(submitErrorTimer.current)
      }
    }
  }, [])

  const submit = useCallback(async (entry: NewFlightLogEntry): Promise<SubmitResult> => {
    const tempId = -Date.now()
    const optimistic: FlightLogEntry = {
      id: tempId,
      content: entry.content,
      callsign: entry.callsign,
      created_at: Math.floor(Date.now() / 1000),
    }

    setState((prev) => ({
      ...prev,
      entries: [optimistic, ...prev.entries],
      submitError: null,
    }))

    try {
      const { id, created_at } = await createFlightLog(entry)
      setState((prev) => ({
        ...prev,
        entries: prev.entries.map((e) => (e.id === tempId ? { ...e, id, created_at } : e)),
      }))
      return { ok: true }
    } catch (err) {
      const message = describeError(err, '提交失败,请稍后再试')
      setState((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== tempId),
        submitError: message,
      }))

      if (submitErrorTimer.current !== undefined) {
        window.clearTimeout(submitErrorTimer.current)
      }
      submitErrorTimer.current = window.setTimeout(() => {
        setState((prev) => ({ ...prev, submitError: null }))
      }, 3000)

      return { ok: false, error: message }
    }
  }, [])

  const dismissSubmitError = useCallback(() => {
    if (submitErrorTimer.current !== undefined) {
      window.clearTimeout(submitErrorTimer.current)
    }
    setState((prev) => ({ ...prev, submitError: null }))
  }, [])

  return { ...state, submit, dismissSubmitError }
}

export { useFlightLog }
export type { FlightLogStatus, SubmitResult, ApiErrorShape }
