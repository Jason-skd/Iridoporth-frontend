import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X } from '@phosphor-icons/react'
import { useTranslation } from '../lib/i18n'

const NOTE_LIMIT = 300

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'sent' }
  | { status: 'error'; message: string }

type FlightLogComposerProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => Promise<void>
}

/**
 * Composer lives in an overlay so expanding it never collides with the entry
 * cards below. Desktop slides it in from the right; mobile lifts it as a
 * bottom sheet (see `.composer-drawer` in App.css).
 */
export function FlightLogComposer({ isOpen, onClose, onSubmit }: FlightLogComposerProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmed = content.trim()
  const canSubmit = trimmed.length > 0 && submitState.status !== 'submitting'

  // Lock background scroll, focus the field, and close on Esc while open.
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    textareaRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitState({ status: 'submitting' })
    try {
      await onSubmit(trimmed)
      setContent('')
      setSubmitState({ status: 'sent' })
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error instanceof Error ? error.message : t('errors.generic'),
      })
    }
  }

  const submitText =
    submitState.status === 'submitting'
      ? t('flightLog.submitSubmitting')
      : submitState.status === 'sent'
        ? t('flightLog.submitSent')
        : t('flightLog.submitIdle')

  return (
    <div
      className={`composer-drawer${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="composer-drawer__scrim"
        tabIndex={isOpen ? 0 : -1}
        aria-label={t('a11y.closeComposer')}
        onClick={onClose}
      />

      <div
        className="composer-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('a11y.composerDialog')}
      >
        <header className="composer-drawer__head">
          <div className="composer-drawer__heading">
            <p className="section-kicker">{t('flightLog.kicker')}</p>
            <h2>{t('flightLog.composerTitle')}</h2>
            <p className="composer-drawer__subtitle">{t('flightLog.composerSubtitle')}</p>
          </div>
          <button
            type="button"
            className="composer-drawer__close"
            aria-label={t('a11y.closeComposer')}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="composer-drawer__form" onSubmit={handleSubmit}>
          <div className="flight-log-field">
            <label htmlFor="flight-log-content">{t('flightLog.composerLabel')}</label>
            <textarea
              ref={textareaRef}
              id="flight-log-content"
              name="content"
              value={content}
              maxLength={NOTE_LIMIT}
              required
              rows={6}
              placeholder={t('flightLog.composerPlaceholder')}
              onChange={(event) => {
                setContent(event.target.value)
                if (submitState.status !== 'submitting') {
                  setSubmitState({ status: 'idle' })
                }
              }}
            />
          </div>

          <div className="flight-log-submit-row">
            <span>
              {content.length}/{NOTE_LIMIT}
            </span>
            <button className="button button--primary" type="submit" disabled={!canSubmit}>
              {submitText}
            </button>
          </div>

          <p className="flight-log-submit-status" aria-live="polite">
            {submitState.status === 'error' ? submitState.message : ''}
            {submitState.status === 'sent' ? t('flightLog.submitSuccess') : ''}
          </p>
        </form>
      </div>
    </div>
  )
}
