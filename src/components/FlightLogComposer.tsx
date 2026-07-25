import { type FormEvent, useMemo, useState } from 'react'
import { useTranslation } from '../lib/i18n'

const NOTE_LIMIT = 300

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'sent' }
  | { status: 'error'; message: string }

type FlightLogComposerProps = {
  isOpen: boolean
  onOpen: () => void
  onSubmit: (content: string) => Promise<void>
}

export function FlightLogComposer({ isOpen, onOpen, onSubmit }: FlightLogComposerProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  const trimmed = content.trim()
  const canSubmit = trimmed.length > 0 && submitState.status !== 'submitting'

  const submitText = useMemo(() => {
    if (submitState.status === 'submitting') return t('flightLog.submitSubmitting')
    if (submitState.status === 'sent') return t('flightLog.submitSent')
    return t('flightLog.submitIdle')
  }, [submitState.status, t])

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

  if (!isOpen) {
    return (
      <button
        type="button"
        className="flight-log-composer-bar"
        onClick={onOpen}
      >
        {t('flightLog.composerPrompt')}
      </button>
    )
  }

  return (
    <form className="flight-log-composer" onSubmit={handleSubmit}>
      <div className="flight-log-field">
        <label htmlFor="flight-log-content">{t('flightLog.composerLabel')}</label>
        <textarea
          id="flight-log-content"
          name="content"
          value={content}
          maxLength={NOTE_LIMIT}
          required
          rows={8}
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
        <span>{content.length}/{NOTE_LIMIT}</span>
        <button className="button button--primary" type="submit" disabled={!canSubmit}>
          {submitText}
        </button>
      </div>

      <p className="flight-log-submit-status" aria-live="polite">
        {submitState.status === 'error' ? submitState.message : ''}
        {submitState.status === 'sent' ? t('flightLog.submitSuccess') : ''}
      </p>
    </form>
  )
}
