import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollHint } from '../components/ScrollHint'
import heroWindow from '../assets/home/hero-aircraft-window.svg'
import journalFragments from '../assets/home/journal-fragments.svg'
import stampStrip from '../assets/home/stamp-strip.svg'
import {
  getFlightLogEntries,
  getRaspiStatus,
  type FlightLogEntry,
  type RaspiStatus,
} from '../lib/api'
import { formatPercent, formatTemp } from '../lib/format'
import {
  formatTimestamp,
  useDateFormatter,
  useTranslation,
} from '../lib/i18n'

type RemoteState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }

const flightLogFallback: FlightLogEntry = {
  id: 0,
  content: '',
  callsign: null,
  created_at: 0,
  response: null,
  responded_at: null,
  created_by_this_user: false,
  likes: 0,
  liked_by_this_user: false,
}

function useHomeSignals() {
  const [raspi, setRaspi] = useState<RemoteState<RaspiStatus>>({
    status: 'loading',
  })
  const [latestFlightLogEntry, setLatestFlightLogEntry] =
    useState<RemoteState<FlightLogEntry>>({
      status: 'loading',
    })

  useEffect(() => {
    const controller = new AbortController()

    getRaspiStatus(controller.signal)
      .then((data) => {
        setRaspi({ status: 'ready', data })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setRaspi({
          status: 'error',
          message: error instanceof Error ? error.message : '',
        })
      })

    getFlightLogEntries(controller.signal)
      .then((entries) => {
        setLatestFlightLogEntry(
          entries.length > 0
            ? { status: 'ready', data: entries[0] }
            : { status: 'empty' },
        )
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLatestFlightLogEntry({
          status: 'error',
          message: error instanceof Error ? error.message : '',
        })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return { raspi, latestFlightLogEntry }
}

function SignalPreview({ state }: { state: RemoteState<RaspiStatus> }) {
  const { t } = useTranslation()

  if (state.status === 'loading') {
    return (
      <div className="signal-preview signal-preview--loading" aria-live="polite">
        <span className="signal-preview__bar" />
        <span className="signal-preview__bar signal-preview__bar--short" />
        <span className="signal-preview__bar signal-preview__bar--mid" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="signal-preview signal-preview--note">
        {t('home.signalPreview.error', { message: state.message })}
      </p>
    )
  }

  if (state.status === 'empty') {
    return (
      <p className="signal-preview signal-preview--note">
        {t('home.signalPreview.empty')}
      </p>
    )
  }

  const status = state.data

  if (!status.available) {
    return (
      <p className="signal-preview signal-preview--note">
        {t('home.signalPreview.unavailable')}
      </p>
    )
  }

  const metrics = [
    { label: t('home.signalPreview.host'), value: status.name ?? 'raspberrypi' },
    { label: t('home.signalPreview.temp'), value: formatTemp(status.cpu_temperature) },
    { label: t('home.signalPreview.cpu'), value: formatPercent(status.cpu_usage) },
    { label: t('home.signalPreview.mem'), value: formatPercent(status.memory_usage) },
  ]

  return (
    <dl className="signal-grid">
      {metrics.map(({ label, value }) => (
        <div key={label} className="signal-grid__item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function FlightLogPreview({ state }: { state: RemoteState<FlightLogEntry> }) {
  const { t } = useTranslation()
  const dateFormatter = useDateFormatter({
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const entry = useMemo(() => {
    if (state.status === 'ready') return state.data
    return flightLogFallback
  }, [state])

  if (state.status === 'loading') {
    return (
      <div className="flight-log-preview flight-log-preview--loading" aria-live="polite">
        <span />
        <span />
        <span />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <p className="flight-log-preview flight-log-preview--note">
        {t('home.flightLogPreview.error', { message: state.message })}
      </p>
    )
  }

  const content = entry.content || t('home.flightLogPreview.empty')

  return (
    <article className="flight-log-preview">
      <time dateTime={entry.created_at > 0 ? String(entry.created_at) : undefined}>
        {formatTimestamp(entry.created_at, dateFormatter)}
      </time>
      <p>{content}</p>
    </article>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const { raspi, latestFlightLogEntry } = useHomeSignals()

  function scrollToRoutes() {
    document.querySelector('.home-route-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="home-page">
      <section className="hero-section" aria-labelledby="home-title">
        <div className="hero-copy">
          <h1 id="home-title">{t('home.title')}</h1>
          <div className="hero-actions" aria-label={t('home.primaryNavAria')}>
            <Link className="button button--primary" to="/flight-log">
              {t('home.flightLogCta')}
            </Link>
            <Link className="button button--ghost" to="/raspi-status">
              {t('home.signalCta')}
            </Link>
          </div>
        </div>

        <figure className="hero-asset">
          <img
            src={heroWindow}
            width="1400"
            height="1100"
            alt={t('home.heroImageAlt')}
          />
        </figure>

        <ScrollHint
          className="hero-scroll-hint"
          label={t('a11y.scrollHint')}
          onClick={scrollToRoutes}
        />
      </section>

      <section className="home-route-panel" aria-label={t('a11y.siteRoutes')}>
        <Link className="route-card route-card--signal" to="/raspi-status">
          <span>{t('home.raspiCardKicker')}</span>
          <h2>{t('home.raspiCardTitle')}</h2>
          <SignalPreview state={raspi} />
        </Link>

        <Link className="route-card route-card--flight-log" to="/flight-log">
          <span>{t('home.flightLogCardKicker')}</span>
          <h2>{t('home.flightLogCardTitle')}</h2>
          <p className="route-card__subtitle">{t('home.flightLogCardSubtitle')}</p>
          <FlightLogPreview state={latestFlightLogEntry} />
        </Link>
      </section>

      <section className="notebook-section" aria-labelledby="notebook-title">
        <div className="notebook-copy">
          <h2 id="notebook-title">{t('home.notebookTitle')}</h2>
        </div>
        <div className="notebook-assets">
          <img
            className="notebook-assets__fragments"
            src={journalFragments}
            width="1200"
            height="820"
            alt={t('home.journalFragmentsAlt')}
          />
          <img
            className="notebook-assets__stamps"
            src={stampStrip}
            width="1100"
            height="240"
            alt={t('home.stampStripAlt')}
          />
        </div>
      </section>
    </main>
  )
}
