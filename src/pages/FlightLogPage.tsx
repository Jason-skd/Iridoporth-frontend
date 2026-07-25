import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ThumbsUp, Trash, X } from '@phosphor-icons/react'
import stampStrip from '../assets/home/stamp-strip.svg'
import {
  createFlightLogEntry,
  deleteFlightLogEntry,
  getFlightLogEntries,
  likeFlightLogEntry,
  unlikeFlightLogEntry,
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

const NOTE_LIMIT = 300

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed'
}

function formatEntryTime(seconds: number | null) {
  if (!seconds || seconds <= 0) return ''

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
    setLiked(id: number, liked: boolean) {
      setState((current) => {
        if (current.status !== 'ready') return current

        const entries = current.entries.map((entry) => {
          if (entry.id !== id) return entry
          const wasLiked = entry.liked_by_this_user
          const likes = entry.likes + (liked === wasLiked ? 0 : liked ? 1 : -1)
          return { ...entry, liked_by_this_user: liked, likes }
        })

        return { status: 'ready', entries }
      })
    },
    removeEntry(id: number) {
      setState((current) => {
        if (current.status !== 'ready') return current
        return {
          status: 'ready',
          entries: current.entries.filter((entry) => entry.id !== id),
        }
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

type EntryCardProps = {
  entry: FlightLogEntry
  onLikeChange: (entry: FlightLogEntry) => Promise<void>
  onDelete: (entry: FlightLogEntry) => Promise<void>
}

function EntryCard({ entry, onLikeChange, onDelete }: EntryCardProps) {
  const callsign = entry.callsign?.trim() || 'anonymous'
  const [likeBusy, setLikeBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleLike() {
    if (likeBusy) return
    setLikeBusy(true)
    setNotice(null)
    try {
      await onLikeChange(entry)
    } catch {
      setNotice('Could not update your like.')
    } finally {
      setLikeBusy(false)
    }
  }

  async function handleDelete() {
    if (deleteBusy) return
    setDeleteBusy(true)
    setNotice(null)
    try {
      await onDelete(entry)
    } catch {
      setNotice('Could not delete this note.')
      setDeleteBusy(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <article className="flight-log-entry">
      <div className="flight-log-entry__meta">
        <span>{callsign}</span>
        <time dateTime={String(entry.created_at)}>
          {formatEntryTime(entry.created_at)}
        </time>
      </div>

      <p>{entry.content}</p>

      {entry.response ? (
        <div className="flight-log-entry__reply">
          <span className="flight-log-entry__reply-label">reply</span>
          <p>{entry.response}</p>
          {entry.responded_at ? (
            <time dateTime={String(entry.responded_at)}>
              {formatEntryTime(entry.responded_at)}
            </time>
          ) : null}
        </div>
      ) : null}

      <div className="flight-log-entry__actions">
        <button
          type="button"
          className="flight-log-action flight-log-like"
          aria-pressed={entry.liked_by_this_user}
          aria-label={entry.liked_by_this_user ? 'Unlike this note' : 'Like this note'}
          disabled={likeBusy}
          onClick={handleLike}
        >
          <ThumbsUp
            size={15}
            weight={entry.liked_by_this_user ? 'fill' : 'regular'}
            aria-hidden="true"
          />
          <span>{entry.likes}</span>
        </button>

        {entry.created_by_this_user ? (
          confirmingDelete ? (
            <span className="flight-log-confirm">
              <span>Delete?</span>
              <button
                type="button"
                className="flight-log-action flight-log-action--danger"
                aria-label="Confirm delete"
                disabled={deleteBusy}
                onClick={handleDelete}
              >
                <Check size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="flight-log-action"
                aria-label="Cancel delete"
                disabled={deleteBusy}
                onClick={() => setConfirmingDelete(false)}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="flight-log-action"
              aria-label="Delete your note"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash size={15} aria-hidden="true" />
            </button>
          )
        ) : null}

        {notice ? <span className="flight-log-action-notice">{notice}</span> : null}
      </div>
    </article>
  )
}

function FlightLogEntries({
  state,
  onLikeChange,
  onDelete,
}: {
  state: EntriesState
  onLikeChange: (entry: FlightLogEntry) => Promise<void>
  onDelete: (entry: FlightLogEntry) => Promise<void>
}) {
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
        <EntryCard
          key={entry.id}
          entry={entry}
          onLikeChange={onLikeChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export function FlightLogPage() {
  const { state, prependEntry, setLiked, removeEntry } = useFlightLogEntries()
  const [content, setContent] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  const trimmedContent = content.trim()
  const canSubmit = trimmedContent.length > 0 && submitState.status !== 'submitting'

  const submitText = useMemo(() => {
    if (submitState.status === 'submitting') return 'Leaving'
    if (submitState.status === 'sent') return 'Left'
    return 'Leave note'
  }, [submitState.status])

  async function toggleLike(entry: FlightLogEntry) {
    const nextLiked = !entry.liked_by_this_user
    setLiked(entry.id, nextLiked)
    try {
      if (nextLiked) await likeFlightLogEntry(entry.id)
      else await unlikeFlightLogEntry(entry.id)
    } catch (error) {
      setLiked(entry.id, !nextLiked)
      throw error
    }
  }

  async function deleteEntry(entry: FlightLogEntry) {
    await deleteFlightLogEntry(entry.id)
    removeEntry(entry.id)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitState({ status: 'submitting' })

    createFlightLogEntry({ content: trimmedContent })
      .then((result) => {
        prependEntry({
          id: result.id,
          content: trimmedContent,
          callsign: 'Anonymous',
          created_at: result.created_at,
          response: null,
          responded_at: null,
          created_by_this_user: true,
          likes: 0,
          liked_by_this_user: false,
        })
        setContent('')
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
        <FlightLogEntries
          state={state}
          onLikeChange={toggleLike}
          onDelete={deleteEntry}
        />
      </section>
    </main>
  )
}
