import { useTranslation } from '../lib/i18n'

export function LocaleToggle() {
  const { locale, setLocale } = useTranslation()
  const next = locale === 'en' ? 'zh' : 'en'

  return (
    <button
      type="button"
      className="locale-toggle"
      aria-label={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
      onClick={() => setLocale(next)}
    >
      <span aria-hidden={locale !== 'en'} className={locale === 'en' ? 'is-active' : undefined}>
        EN
      </span>
      <span className="locale-toggle__divider" aria-hidden="true" />
      <span aria-hidden={locale !== 'zh'} className={locale === 'zh' ? 'is-active' : undefined}>
        中
      </span>
    </button>
  )
}
