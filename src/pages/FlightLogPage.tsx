import { useEffect, useState } from 'react'
import { ChatCenteredDots, Check, ThumbsUp, Trash, X } from '@phosphor-icons/react'
import { FlightLogComposer } from '../components/FlightLogComposer'
import {
  createFlightLogEntry,
  deleteFlightLogEntry,
  errorMessage,
  getFlightLogEntries,
  likeFlightLogEntry,
  unlikeFlightLogEntry,
  type FlightLogEntry,
} from '../lib/api'
import {
  formatTimestamp,
  useDateFormatter,
  useTranslation,
} from '../lib/i18n'

type EntriesState =
  | { status: 'loading' }
  | { status: 'ready'; entries: FlightLogEntry[] }
  | { status: 'error'; message: string }

const BOARD_ID = 'flight-log-board'

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
        setState({ status: 'error', message: error instanceof Error ? error.message : '' })
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
  const { t } = useTranslation()
  const dateFormatter = useDateFormatter({
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const callsign = entry.callsign?.trim() || t('flightLog.anonymous')
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
      setNotice(t('flightLog.likeError'))
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
      setNotice(t('flightLog.deleteError'))
      setDeleteBusy(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <article className="flight-log-entry">
      <div className="flight-log-entry__meta">
        <span>{callsign}</span>
        <time dateTime={entry.created_at > 0 ? String(entry.created_at) : undefined}>
          {formatTimestamp(entry.created_at, dateFormatter)}
        </time>
      </div>

      <p>{entry.content}</p>

      <div className="flight-log-entry__actions">
        <button
          type="button"
          className="flight-log-action flight-log-like"
          aria-pressed={entry.liked_by_this_user}
          aria-label={entry.liked_by_this_user ? t('flightLog.unlikeLabel') : t('flightLog.likeLabel')}
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
              <span>{t('flightLog.deleteConfirm')}</span>
              <button
                type="button"
                className="flight-log-action flight-log-action--danger"
                aria-label={t('flightLog.confirmDeleteAria')}
                disabled={deleteBusy}
                onClick={handleDelete}
              >
                <Check size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="flight-log-action"
                aria-label={t('flightLog.cancelDeleteAria')}
                disabled={deleteBusy}
                onClick={() => setConfirmingDelete(false)}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="flight-log-action flight-log-action--danger"
              aria-label={t('flightLog.deleteNoteAria')}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash size={15} aria-hidden="true" />
            </button>
          )
        ) : null}

        {notice ? <span className="flight-log-action-notice">{notice}</span> : null}
      </div>

      {entry.response ? (
        <div className="flight-log-entry__reply">
          <span className="flight-log-entry__reply-label">{t('flightLog.replyLabel')}</span>
          <p>{entry.response}</p>
          {entry.responded_at ? (
            <time dateTime={String(entry.responded_at)}>
              {formatTimestamp(entry.responded_at, dateFormatter)}
            </time>
          ) : null}
        </div>
      ) : null}
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
  const { t } = useTranslation()

  if (state.status === 'loading') return <EntrySkeletons />

  if (state.status === 'error') {
    return (
      <p className="flight-log-board-note">{t('flightLog.boardError', { message: state.message })}</p>
    )
  }

  if (state.entries.length === 0) {
    return <p className="flight-log-board-note">{t('flightLog.noNotes')}</p>
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
  const { t, locale } = useTranslation()
  const { state, prependEntry, setLiked, removeEntry } = useFlightLogEntries()
  const [composerOpen, setComposerOpen] = useState(false)

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

  async function handleSubmit(content: string) {
    const result = await createFlightLogEntry({ content })
    prependEntry({
      id: result.id,
      content,
      callsign: 'Anonymous',
      created_at: result.created_at,
      response: null,
      responded_at: null,
      created_by_this_user: true,
      likes: 0,
      liked_by_this_user: false,
    })
  }

  function scrollToBoard() {
    document.getElementById(BOARD_ID)?.scrollIntoView({ behavior: 'smooth' })
  }

  function openComposer() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setComposerOpen(true)
  }

  return (
    <main className="flight-log-page" aria-labelledby="flight-log-title">
      <section className="flight-log-hero">
        <div className="flight-log-copy">
          <p className="section-kicker">{t('flightLog.kicker')}</p>
          <h1 id="flight-log-title">{t('flightLog.title')}</h1>
          <p className="flight-log-copy__subtitle">{t('flightLog.subtitle')}</p>
          <p>{t('flightLog.description')}</p>
          <button
            type="button"
            className="button button--primary"
            onClick={scrollToBoard}
          >
            {t('flightLog.browseCta')}
          </button>
        </div>
      </section>

      <section
        id={BOARD_ID}
        className="flight-log-board"
        aria-label={t('a11y.flightLogBoard')}
      >
        <FlightLogComposer
          isOpen={composerOpen}
          onOpen={() => setComposerOpen(true)}
          onSubmit={async (content) => {
            try {
              await handleSubmit(content)
            } catch (error) {
              throw new Error(errorMessage(error, locale), { cause: error })
            }
          }}
        />

        <FlightLogEntries
          state={state}
          onLikeChange={toggleLike}
          onDelete={deleteEntry}
        />
      </section>

      <button
        type="button"
        className="flight-log-fab"
        aria-label={t('flightLog.fabAria')}
        onClick={openComposer}
      >
        <ChatCenteredDots size={18} weight="fill" aria-hidden="true" />
        <span>{t('flightLog.fabLabel')}</span>
      </button>
    </main>
  )
}
