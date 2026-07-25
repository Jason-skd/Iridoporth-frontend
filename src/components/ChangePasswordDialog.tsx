import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, X } from '@phosphor-icons/react'
import { changePassword, errorCode } from '../lib/api'
import { useTranslation } from '../lib/i18n'

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string }

type ChangePasswordDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Mirror of the backend password rules (`validatePassword` in the API): ASCII
 * only, no space/tab/newline/CR, 8–128 codepoints. Kept in lockstep so a
 * password that passes here also passes the server.
 */
function isNewPasswordValid(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false
  for (const char of password) {
    const code = char.charCodeAt(0)
    if (code > 0x7f) return false
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') return false
  }
  return true
}

/**
 * Centered modal for rotating the signed-in account's password. Reuses the
 * login-card surface and the composer's overlay habits (scrim, Esc, scroll
 * lock, autofocus). The backend does not yet distinguish "wrong current
 * password" from "session expired", so an `unauthenticated` response is
 * treated as a session timeout and redirects to /login.
 */
export function ChangePasswordDialog({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const currentRef = useRef<HTMLInputElement>(null)
  const prevOpen = useRef(isOpen)

  const mismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword

  const canSubmit =
    currentPassword.length > 0 &&
    isNewPasswordValid(newPassword) &&
    confirmPassword.length > 0 &&
    !mismatch &&
    submitState.status !== 'submitting'

  // Reset the form whenever the dialog closes (any close path), so no password
  // lingers in component state.
  useEffect(() => {
    if (prevOpen.current && !isOpen) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setReveal(false)
      setSubmitState({ status: 'idle' })
    }
    prevOpen.current = isOpen
  }, [isOpen])

  // Lock background scroll, focus the first field, and close on Esc while open.
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    currentRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  // Close shortly after a successful update so the success line is readable.
  useEffect(() => {
    if (submitState.status !== 'success') return
    const id = window.setTimeout(onClose, 1600)
    return () => window.clearTimeout(id)
  }, [submitState, onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitState({ status: 'submitting' })
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSubmitState({ status: 'success' })
      onSuccess?.()
    } catch (error) {
      const code = errorCode(error)
      if (code === 'unauthenticated') {
        navigate('/login', { replace: true })
        return
      }
      const message =
        code === 'invalid_request'
          ? t('password.invalidNew')
          : code === 'user_not_found'
            ? t('errors.user_not_found')
            : t('errors.generic')
      setSubmitState({ status: 'error', message })
    }
  }

  function clearError() {
    if (submitState.status === 'error') setSubmitState({ status: 'idle' })
  }

  const inputType = reveal ? 'text' : 'password'
  const submitText =
    submitState.status === 'submitting'
      ? t('password.submitSubmitting')
      : submitState.status === 'success'
        ? t('password.success')
        : t('password.submitIdle')

  const statusText =
    submitState.status === 'error'
      ? submitState.message
      : submitState.status === 'success'
        ? t('password.success')
        : mismatch
          ? t('password.mismatch')
          : ''

  return (
    <div
      className={`modal-overlay${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="modal-overlay__scrim"
        tabIndex={isOpen ? 0 : -1}
        aria-label={t('a11y.closeChangePassword')}
        onClick={onClose}
      />

      <div
        className="login-card modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={t('a11y.changePasswordDialog')}
      >
        <button
          type="button"
          className="modal-card__close"
          aria-label={t('a11y.closeChangePassword')}
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="modal-card__brand">
          <p className="section-kicker">{t('password.kicker')}</p>
          <h2>{t('password.title')}</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field password-field">
            <label htmlFor="change-password-current">{t('password.currentLabel')}</label>
            <span className="password-field__control">
              <input
                ref={currentRef}
                id="change-password-current"
                name="current-password"
                type={inputType}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value)
                  clearError()
                }}
              />
              <button
                type="button"
                className="password-field__toggle"
                aria-label={reveal ? t('a11y.hidePassword') : t('a11y.showPassword')}
                onClick={() => setReveal((value) => !value)}
              >
                {reveal ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
          </div>

          <div className="login-field password-field">
            <label htmlFor="change-password-new">{t('password.newLabel')}</label>
            <span className="password-field__control">
              <input
                id="change-password-new"
                name="new-password"
                type={inputType}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  clearError()
                }}
              />
              <button
                type="button"
                className="password-field__toggle"
                aria-label={reveal ? t('a11y.hidePassword') : t('a11y.showPassword')}
                onClick={() => setReveal((value) => !value)}
              >
                {reveal ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
          </div>

          <div className="login-field password-field">
            <label htmlFor="change-password-confirm">{t('password.confirmLabel')}</label>
            <span className="password-field__control">
              <input
                id="change-password-confirm"
                name="confirm-password"
                type={inputType}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  clearError()
                }}
              />
              <button
                type="button"
                className="password-field__toggle"
                aria-label={reveal ? t('a11y.hidePassword') : t('a11y.showPassword')}
                onClick={() => setReveal((value) => !value)}
              >
                {reveal ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
          </div>

          <p className="password-form__hint">{t('password.hint')}</p>

          <button
            className="button button--primary login-form__submit"
            type="submit"
            disabled={!canSubmit}
          >
            {submitText}
          </button>

          <p className="login-form__status" aria-live="polite">
            {statusText}
          </p>
        </form>
      </div>
    </div>
  )
}
