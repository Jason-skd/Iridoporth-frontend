import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandSeal } from '../components/BrandSeal'
import {
  errorMessage,
  getAdminFlightLogEntries,
  login,
} from '../lib/api'
import { useTranslation } from '../lib/i18n'

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  // If a valid admin session already exists, skip the form.
  useEffect(() => {
    const controller = new AbortController()
    getAdminFlightLogEntries(controller.signal)
      .then(() => {
        navigate('/admin', { replace: true })
      })
      .catch(() => {
        /* not signed in: show the form */
      })
    return () => {
      controller.abort()
    }
  }, [navigate])

  const trimmedEmail = email.trim()
  const canSubmit =
    trimmedEmail.length > 0 &&
    password.length > 0 &&
    submitState.status !== 'submitting'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitState({ status: 'submitting' })
    try {
      await login(trimmedEmail, password)
      navigate('/admin', { replace: true })
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: errorMessage(error, 'login.error'),
      })
    }
  }

  const submitText = useMemo(
    () =>
      submitState.status === 'submitting'
        ? t('login.submitSubmitting')
        : t('login.submitIdle'),
    [submitState.status, t],
  )

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <BrandSeal size={48} className="login-card__seal" />
          <p className="section-kicker">{t('login.kicker')}</p>
          <h1>{t('login.title')}</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">{t('login.emailLabel')}</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (submitState.status === 'error') setSubmitState({ status: 'idle' })
              }}
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">{t('login.passwordLabel')}</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (submitState.status === 'error') setSubmitState({ status: 'idle' })
              }}
            />
          </div>

          <button
            className="button button--primary login-form__submit"
            type="submit"
            disabled={!canSubmit}
          >
            {submitText}
          </button>

          <p className="login-form__status" aria-live="polite">
            {submitState.status === 'error' ? submitState.message : ''}
          </p>
        </form>

        <Link className="button button--ghost login-card__home" to="/">
          {t('login.homeCta')}
        </Link>
      </div>
    </main>
  )
}
