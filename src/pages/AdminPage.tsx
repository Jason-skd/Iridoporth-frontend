import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChatTeardropDots,
  Eye,
  EyeSlash,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react'
import { BrandSeal } from '../components/BrandSeal'
import { ChangePasswordDialog } from '../components/ChangePasswordDialog'
import {
  clearFlightLogResponse,
  errorMessage,
  errorCode,
  getAdminFlightLogEntries,
  respondFlightLogEntry,
  setFlightLogHidden,
  type AdminFlightLogEntry,
} from '../lib/api'
import { formatTimestamp, useDateFormatter, useTranslation } from '../lib/i18n'

type AdminState =
  | { status: 'loading' }
  | { status: 'ready'; entries: AdminFlightLogEntry[] }
  | { status: 'forbidden' }
  | { status: 'error'; message: string }

type Bucket = 'active' | 'unreplied' | 'hidden' | 'deleted'

const NOTE_LIMIT = 300

function bucketOf(entry: AdminFlightLogEntry): Bucket {
  if (entry.deleted_at != null) return 'deleted'
  if (entry.hidden_at != null) return 'hidden'
  if (entry.response == null) return 'unreplied'
  return 'active'
}

const TAB_KEYS: Bucket[] = ['unreplied', 'active', 'hidden', 'deleted']

export function AdminPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const dateFormatter = useDateFormatter({
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const [state, setState] = useState<AdminState>({ status: 'loading' })
  const [tab, setTab] = useState<Bucket>('unreplied')
  const [notice, setNotice] = useState<string | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [replyingId, setReplyingId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    return getAdminFlightLogEntries(controller.signal)
      .then((entries) => {
        setState({ status: 'ready', entries })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const code = errorCode(error)
        if (code === 'unauthenticated') {
          navigate('/login', { replace: true })
          return
        }
        if (code === 'forbidden') {
          setState({ status: 'forbidden' })
          return
        }
        setState({ status: 'error', message: errorMessage(error) })
      })
  }, [navigate])

  useEffect(() => {
    reload()
    return () => {
      abortRef.current?.abort()
    }
  }, [reload])

  async function runAction(label: string, action: () => Promise<unknown>) {
    setNotice(null)
    try {
      await action()
    } catch (error) {
      if (errorCode(error) === 'unauthenticated') {
        navigate('/login', { replace: true })
        return
      }
      setNotice(t('admin.actionFailed', { label }))
    }
    await reload()
  }

  function startReply(entry: AdminFlightLogEntry) {
    setReplyingId(entry.id)
    setReplyText(entry.response ?? '')
    setNotice(null)
  }

  function cancelReply() {
    setReplyingId(null)
    setReplyText('')
  }

  function handleReplySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (replyingId == null) return
    const trimmed = replyText.trim()
    if (trimmed.length === 0) return
    const id = replyingId
    runAction(t('admin.replyAction'), () => respondFlightLogEntry(id, trimmed)).then(() => {
      cancelReply()
    })
  }

  const tabs = TAB_KEYS.map((key) => ({ key, label: t(`admin.tabs.${key}`) }))
  const counts: Record<Bucket, number> = {
    active: 0,
    unreplied: 0,
    hidden: 0,
    deleted: 0,
  }
  const visibleEntries: AdminFlightLogEntry[] =
    state.status === 'ready' ? state.entries : []
  for (const entry of visibleEntries) {
    counts[bucketOf(entry)] += 1
  }
  const bucketEntries = visibleEntries.filter((entry) => bucketOf(entry) === tab)

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-header__copy">
          <BrandSeal size={40} className="admin-header__seal" />
          <p className="section-kicker">{t('admin.kicker')}</p>
          <h1>{t('admin.title')}</h1>
        </div>
        <div className="admin-header__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setPasswordOpen(true)}
          >
            {t('admin.changePasswordCta')}
          </button>
          <Link className="button button--ghost" to="/">
            {t('admin.homeCta')}
          </Link>
        </div>
      </header>

      {notice ? <p className="admin-notice" role="status">{notice}</p> : null}

      <nav className="admin-tabs" aria-label={t('a11y.adminLists')}>
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className="admin-tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
          >
            <span>{item.label}</span>
            <span className="admin-tab__count">{counts[item.key]}</span>
          </button>
        ))}
      </nav>

      <AdminList
        state={state}
        entries={bucketEntries}
        replyingId={replyingId}
        replyText={replyText}
        onReplyTextChange={setReplyText}
        onStartReply={startReply}
        onCancelReply={cancelReply}
        onReplySubmit={handleReplySubmit}
        onHide={(id) => runAction(t('admin.hideAction'), () => setFlightLogHidden(id, true))}
        onDisplay={(id) => runAction(t('admin.displayAction'), () => setFlightLogHidden(id, false))}
        onClearReply={(id) => runAction(t('admin.clearReplyAction'), () => clearFlightLogResponse(id))}
        dateFormatter={dateFormatter}
      />

      <ChangePasswordDialog
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </main>
  )
}

type AdminListProps = {
  state: AdminState
  entries: AdminFlightLogEntry[]
  replyingId: number | null
  replyText: string
  onReplyTextChange: (value: string) => void
  onStartReply: (entry: AdminFlightLogEntry) => void
  onCancelReply: () => void
  onReplySubmit: (event: FormEvent<HTMLFormElement>) => void
  onHide: (id: number) => void
  onDisplay: (id: number) => void
  onClearReply: (id: number) => void
  dateFormatter: Intl.DateTimeFormat
}

function AdminList({
  state,
  entries,
  replyingId,
  replyText,
  onReplyTextChange,
  onStartReply,
  onCancelReply,
  onReplySubmit,
  onHide,
  onDisplay,
  onClearReply,
  dateFormatter,
}: AdminListProps) {
  const { t } = useTranslation()

  if (state.status === 'loading') {
    return (
      <div className="admin-skeletons" aria-live="polite">
        <span />
        <span />
        <span />
      </div>
    )
  }

  if (state.status === 'forbidden') {
    return <p className="admin-board-note">{t('admin.forbidden')}</p>
  }

  if (state.status === 'error') {
    return <p className="admin-board-note">{t('admin.boardError', { message: state.message })}</p>
  }

  if (entries.length === 0) {
    return <p className="admin-board-note">{t('admin.emptyList')}</p>
  }

  return (
    <ul className="admin-list">
      {entries.map((entry) => {
        const bucket = bucketOf(entry)
        const callsign = entry.callsign?.trim() || t('flightLog.anonymous')
        return (
          <li key={entry.id}>
            <article className="admin-row">
              <div className="admin-row__meta">
                <span>{callsign}</span>
                <time dateTime={String(entry.created_at)}>
                  {formatTimestamp(entry.created_at, dateFormatter)}
                </time>
              </div>

              <p>{entry.content}</p>

              {replyingId === entry.id ? (
                <form className="admin-reply" onSubmit={onReplySubmit}>
                  <textarea
                    className="admin-reply__textarea"
                    value={replyText}
                    maxLength={NOTE_LIMIT}
                    rows={3}
                    placeholder={t('admin.replyPlaceholder')}
                    autoFocus
                    onChange={(event) => onReplyTextChange(event.target.value)}
                  />
                  <div className="admin-reply__actions">
                    <span>{replyText.length}/{NOTE_LIMIT}</span>
                    <button type="button" className="button button--ghost" onClick={onCancelReply}>
                      {t('admin.cancelAction')}
                    </button>
                    <button
                      type="submit"
                      className="button button--primary"
                      disabled={replyText.trim().length === 0}
                    >
                      <PaperPlaneTilt size={15} aria-hidden="true" />
                      {t('admin.sendAction')}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="admin-row__actions">
                {bucket === 'active' ? (
                  <button
                    type="button"
                    className="flight-log-action"
                    onClick={() => onHide(entry.id)}
                  >
                    <EyeSlash size={15} aria-hidden="true" />
                    <span>{t('admin.hideAction')}</span>
                  </button>
                ) : null}

                {bucket === 'unreplied' ? (
                  <>
                    <button
                      type="button"
                      className="flight-log-action"
                      onClick={() => onStartReply(entry)}
                    >
                      <ChatTeardropDots size={15} aria-hidden="true" />
                      <span>{t('admin.replyAction')}</span>
                    </button>
                    <button
                      type="button"
                      className="flight-log-action"
                      onClick={() => onHide(entry.id)}
                    >
                      <EyeSlash size={15} aria-hidden="true" />
                      <span>{t('admin.hideAction')}</span>
                    </button>
                  </>
                ) : null}

                {bucket === 'hidden' ? (
                  <button
                    type="button"
                    className="flight-log-action"
                    onClick={() => onDisplay(entry.id)}
                  >
                    <Eye size={15} aria-hidden="true" />
                    <span>{t('admin.displayAction')}</span>
                  </button>
                ) : null}

                {bucket === 'deleted' ? (
                  <span className="admin-row__muted">{t('admin.noActions')}</span>
                ) : null}
              </div>

              {entry.response ? (
                <div className="admin-row__reply">
                  <span className="admin-row__reply-label">{t('admin.replyLabel')}</span>
                  <p>{entry.response}</p>
                  {entry.responded_at ? (
                    <time dateTime={String(entry.responded_at)}>
                      {formatTimestamp(entry.responded_at, dateFormatter)}
                    </time>
                  ) : null}
                  <button
                    type="button"
                    className="admin-row__clear"
                    aria-label={t('admin.clearReplyAria')}
                    onClick={() => onClearReply(entry.id)}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </article>
          </li>
        )
      })}
    </ul>
  )
}
