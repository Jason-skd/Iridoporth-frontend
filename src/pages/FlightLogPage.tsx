import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import stampStrip from '../assets/home/stamp-strip.svg'
import {
  createFlightLogEntry,
  getFlightLogEntries,
  type FlightLogEntry,
} from '../lib/api'

type EntriesState =
  | { status: 'loading' }
  | { status: 'ready'; entries: FlightLogEntry[] }
  | { status: 'error'; message: string }

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'sent' }
  | { status: 'error'; message: string }

const NOTE_LIMIT = 420

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed'
}

function formatEntryTime(seconds: number) {
  if (seconds <= 0) return 'pending'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(seconds * 1000))
}

function useFlightLogEntries() {
  const [state, setState] = useState<EntriesState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getFlightLogEntries(controller.signal)
      .then((entries) => {
        setState({ status: 'ready', entries })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: getErrorMessage(error) })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return {
    state,
    prependEntry(entry: FlightLogEntry) {
      setState((current) => {
        if (current.status !== 'ready') {
          return { status: 'ready', entries: [entry] }
        }

        return { status: 'ready', entries: [entry, ...current.entries] }
      })
    },
  }
}

function EntrySkeletons() {
  return (
    <div className="flight-log-skeletons" aria-live="polite">
      <span />
      <span />
      <span />
    </div>
  )
}

function EntryCard({ entry }: { entry: FlightLogEntry }) {
  const callsign = entry.callsign?.trim() || 'anonymous'

  return (
    <article className="flight-log-entry">
      <div className="flight-log-entry__meta">
        <span>{callsign}</span>
        <time dateTime={String(entry.created_at)}>
          {formatEntryTime(entry.created_at)}
        </time>
      </div>
      <p>{entry.content}</p>
    </article>
  )
}

function FlightLogEntries({ state }: { state: EntriesState }) {
  if (state.status === 'loading') return <EntrySkeletons />

  if (state.status === 'error') {
    return (
      <p className="flight-log-board-note">
        The cabin is quiet. {state.message}
      </p>
    )
  }

  if (state.entries.length === 0) {
    return <p className="flight-log-board-note">No notes yet.</p>
  }

  return (
    <div className="flight-log-entry-grid">
      {state.entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

export function FlightLogPage() {
  const { state, prependEntry } = useFlightLogEntries()
  const [content, setContent] = useState('')
  const [callsign, setCallsign] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  const trimmedContent = content.trim()
  const trimmedCallsign = callsign.trim()
  const canSubmit = trimmedContent.length > 0 && submitState.status !== 'submitting'

  const submitText = useMemo(() => {
    if (submitState.status === 'submitting') return 'Leaving'
    if (submitState.status === 'sent') return 'Left'
    return 'Leave note'
  }, [submitState.status])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitState({ status: 'submitting' })

    createFlightLogEntry({
      content: trimmedContent,
      callsign: trimmedCallsign.length > 0 ? trimmedCallsign : null,
    })
      .then((result) => {
        prependEntry({
          id: result.id,
          content: trimmedContent,
          callsign: trimmedCallsign.length > 0 ? trimmedCallsign : null,
          created_at: result.created_at,
        })
        setContent('')
        setCallsign('')
        setSubmitState({ status: 'sent' })
      })
      .catch((error: unknown) => {
        setSubmitState({ status: 'error', message: getErrorMessage(error) })
      })
  }

  return (
    <main className="flight-log-page" aria-labelledby="flight-log-title">
      <section className="flight-log-hero">
        <div className="flight-log-copy">
          <p className="section-kicker">flight-log</p>
          <h1 id="flight-log-title">flight-log</h1>
          <p>Leave a note beside the window.</p>
          <Link className="button button--ghost" to="/">
            Home
          </Link>
        </div>

        <form className="flight-log-composer" onSubmit={handleSubmit}>
          <div className="flight-log-field">
            <label htmlFor="flight-log-content">note</label>
            <textarea
              id="flight-log-content"
              name="content"
              value={content}
              maxLength={NOTE_LIMIT}
              required
              rows={8}
              placeholder="Leave your words."
              onChange={(event) => {
                setContent(event.target.value)
                if (submitState.status !== 'submitting') {
                  setSubmitState({ status: 'idle' })
                }
              }}
            />
          </div>

          <div className="flight-log-field flight-log-field--compact">
            <label htmlFor="flight-log-callsign">callsign</label>
            <input
              id="flight-log-callsign"
              name="callsign"
              value={callsign}
              maxLength={24}
              placeholder="optional"
              onChange={(event) => {
                setCallsign(event.target.value)
                if (submitState.status !== 'submitting') {
                  setSubmitState({ status: 'idle' })
                }
              }}
            />
          </div>

          <div className="flight-log-submit-row">
            <span>{content.length}/{NOTE_LIMIT}</span>
            <button
              className="button button--primary"
              type="submit"
              disabled={!canSubmit}
            >
              {submitText}
            </button>
          </div>

          <p className="flight-log-submit-status" aria-live="polite">
            {submitState.status === 'error' ? submitState.message : ''}
            {submitState.status === 'sent' ? 'Sent.' : ''}
          </p>
        </form>
      </section>

      <section className="flight-log-board" aria-label="flight-log notes">
        <img
          className="flight-log-stamps"
          src={stampStrip}
          width="1100"
          height="240"
          alt="Aircraft-window stamps and path labels."
        />
        <FlightLogEntries state={state} />
      </section>
    </main>
  )
}
