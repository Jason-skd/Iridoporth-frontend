// FlightLogSection — the third scroll page of the SPA.
//
// Layout strategy (simplest that preserves the artist's intent):
//   1. Title (航行日志) centered at the top, mobile/desktop variants via
//      CSS — same pattern used elsewhere in this app (no JS breakpoint).
//   2. `journal-spread.svg` rendered as a 16:9 background filling the
//      remaining viewport. Content (feed + compose) is overlaid in a
//      two-column grid whose track sizes mirror the journal's left/right
//      pages.
//   3. The compose card and list rows use their corresponding
//      `note-card-*.svg` as backgrounds; text and inputs sit inside the
//      documented safe area.
//
// All assets come from `src/assets/flight-log/**` and are bundled by Vite
// (imported as URLs). No SVG editing or runtime injection.

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import journalSpread from '../../assets/flight-log/journal/journal-spread.svg'
import titleDesktop from '../../assets/flight-log/header/title-desktop.svg'
import titleMobile from '../../assets/flight-log/header/title-mobile.svg'
import noteCompose from '../../assets/flight-log/notes/note-card-compose.svg'
import noteList from '../../assets/flight-log/notes/note-card-list.svg'
import paperPlane from '../../assets/flight-log/elements/paper-plane.svg'
import { useFlightLog } from './useFlightLog'
import type { FlightLogEntry } from '../../api/flight-log'

const MAX_CONTENT_LENGTH = 500
const MAX_CALLSIGN_LENGTH = 24

function formatStamp(seconds: number): string {
  // Backend `created_at` is Unix SECONDS. We display HH:mm in local time
  // (the "tree-hole" feel) for the visible feed.
  const date = new Date(seconds * 1000)
  if (Number.isNaN(date.getTime())) return '—'
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function displayCallsign(callsign: string | null): string {
  if (!callsign) return '匿名飞行者'
  return callsign
}

function FlightLogRow({ entry }: { entry: FlightLogEntry }) {
  // Optimistic rows have negative ids. We don't surface this in the UI —
  // it just means the row was just inserted; the server will replace
  // it shortly. We do disable user-driven interactions on it implicitly
  // by not rendering any controls per row.
  return (
    <li className="feed-row reveal-item" data-temp={entry.id < 0 ? 'true' : undefined}>
      <img className="feed-row-card" src={noteList} alt="" aria-hidden="true" />
      <div className="feed-row-body">
        <p className="feed-row-content">{entry.content}</p>
        <p className="feed-row-meta">
          <span className="feed-row-callsign">{displayCallsign(entry.callsign)}</span>
          <span className="feed-row-dot" aria-hidden="true">·</span>
          <span className="feed-row-stamp">{formatStamp(entry.created_at)}</span>
        </p>
      </div>
    </li>
  )
}

function FeedEmpty({ message }: { message: string }) {
  return (
    <li className="feed-empty reveal-item" aria-live="polite">
      <p>{message}</p>
    </li>
  )
}

function FlightLogSection() {
  const { entries, status, loadError, submitError, submit, dismissSubmitError } = useFlightLog()
  const [content, setContent] = useState('')
  const [callsign, setCallsign] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Trimming helpers keep the form strict without surprising the user —
  // spaces in a "tree-hole" message are usually accidental.
  const trimmedContent = content.trim()
  const canSubmit = trimmedContent.length > 0 && !isSubmitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    const result = await submit({
      content: trimmedContent,
      callsign: callsign.trim() === '' ? null : callsign.trim(),
    })
    setIsSubmitting(false)
    if (result.ok) {
      setContent('')
    }
  }

  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setContent(event.target.value)
  }

  function handleCallsignChange(event: ChangeEvent<HTMLInputElement>) {
    setCallsign(event.target.value)
  }

  // Auto-dismiss the submit error after the hook's 3s timer, but also
  // allow the user to dismiss it manually (e.g. by clicking it). This
  // hook's own timer already clears it, so this is a no-op unless the
  // user clicks sooner.
  useEffect(() => {
    if (!submitError) return
    const timer = window.setTimeout(() => {
      dismissSubmitError()
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [submitError, dismissSubmitError])

  const feedMessage = (() => {
    if (status === 'loading') return '正在翻开日志…'
    if (status === 'error') return loadError ?? '日志暂时无法打开'
    if (entries.length === 0) return '还没有人留下过航迹,要不要写第一行?'
    return null
  })()

  return (
    <section className="flight-log-section" aria-labelledby="flight-log-title">
      <div className="paper-grain" aria-hidden="true" />

      <header className="flight-log-header">
        <img className="flight-log-title flight-log-title-desktop" src={titleDesktop} alt="" aria-hidden="true" />
        <img className="flight-log-title flight-log-title-mobile" src={titleMobile} alt="" aria-hidden="true" />
        <h2 id="flight-log-title" className="sr-only">
          航行日志
        </h2>
      </header>

      <div className="journal-stage">
        <img className="journal-bg" src={journalSpread} alt="" aria-hidden="true" />

        <div className="journal-grid">
          <section
            className="feed-pane reveal-item"
            aria-label="日志条目列表"
            aria-live="polite"
          >
            <header className="pane-heading">
              <span className="pane-eyebrow">READING</span>
              <span className="pane-title">日志</span>
            </header>
            <ul className="feed-list">
              {feedMessage ? (
                <FeedEmpty message={feedMessage} />
              ) : (
                entries.map((entry) => <FlightLogRow key={entry.id} entry={entry} />)
              )}
            </ul>
          </section>

          <section className="compose-pane reveal-item" aria-label="撰写新条目">
            <img className="compose-card" src={noteCompose} alt="" aria-hidden="true" />
            <form className="compose-form" onSubmit={handleSubmit} aria-label="提交新日志条目">
              <header className="pane-heading">
                <span className="pane-eyebrow">WRITING</span>
                <span className="pane-title">落笔</span>
              </header>

              <label className="compose-field">
                <span className="compose-label">内容</span>
                <textarea
                  className="compose-textarea"
                  name="content"
                  value={content}
                  onChange={handleContentChange}
                  maxLength={MAX_CONTENT_LENGTH}
                  rows={5}
                  placeholder="写下一段航迹…"
                  required
                />
                <span className="compose-counter" aria-live="off">
                  {trimmedContent.length} / {MAX_CONTENT_LENGTH}
                </span>
              </label>

              <label className="compose-field">
                <span className="compose-label">呼号 (可选)</span>
                <input
                  className="compose-input"
                  name="callsign"
                  value={callsign}
                  onChange={handleCallsignChange}
                  maxLength={MAX_CALLSIGN_LENGTH}
                  placeholder="匿名"
                />
              </label>

              {submitError ? (
                <p className="compose-error" role="alert">
                  {submitError}
                </p>
              ) : null}

              <div className="compose-submit-row">
                <button
                  type="submit"
                  className="compose-submit"
                  disabled={!canSubmit}
                  aria-label="提交笔记"
                >
                  <img className="compose-submit-icon" src={paperPlane} alt="" aria-hidden="true" />
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </section>
  )
}

export { FlightLogSection }
