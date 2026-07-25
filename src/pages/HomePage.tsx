import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

type RemoteState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }

const flightLogFallback: FlightLogEntry = {
  id: 0,
  content: 'Nothing has been left here yet.',
  callsign: null,
  created_at: 0,
  response: null,
  responded_at: null,
  created_by_this_user: false,
  likes: 0,
  liked_by_this_user: false,
}

function formatDate(seconds: number) {
  if (seconds <= 0) return 'pending'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(seconds * 1000))
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
          message: error instanceof Error ? error.message : 'Signal unavailable',
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
          message: error instanceof Error ? error.message : 'flight-log unavailable',
        })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return { raspi, latestFlightLogEntry }
}

function SignalPreview({ state }: { state: RemoteState<RaspiStatus> }) {
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
        Signal missing. Backend preview: {state.message}
      </p>
    )
  }

  if (state.status === 'empty') {
    return (
      <p className="signal-preview signal-preview--note">
        The aircraft instrument has not reported a signal yet.
      </p>
    )
  }

  const status = state.data

  if (!status.available) {
    return (
      <p className="signal-preview signal-preview--note">
        The aircraft instrument is not available in this environment.
      </p>
    )
  }

  const metrics = [
    ['host', status.name ?? 'raspberrypi'],
    ['temp', formatTemp(status.cpu_temperature)],
    ['cpu', formatPercent(status.cpu_usage)],
    ['mem', formatPercent(status.memory_usage)],
  ]

  return (
    <dl className="signal-grid">
      {metrics.map(([label, value]) => (
        <div key={label} className="signal-grid__item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function FlightLogPreview({ state }: { state: RemoteState<FlightLogEntry> }) {
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
        flight-log is empty. {state.message}
      </p>
    )
  }

  return (
    <article className="flight-log-preview">
      <time dateTime={entry.created_at > 0 ? String(entry.created_at) : undefined}>
        {formatDate(entry.created_at)}
      </time>
      <p>{entry.content}</p>
    </article>
  )
}

export function HomePage() {
  const { raspi, latestFlightLogEntry } = useHomeSignals()

  return (
    <main className="home-page">
      <section className="hero-section" aria-labelledby="home-title">
        <div className="hero-copy">
          <h1 id="home-title">Iridoporth</h1>
          <div className="hero-actions" aria-label="Primary navigation">
            <Link className="button button--primary" to="/flight-log">
              flight-log
            </Link>
            <Link className="button button--ghost" to="/raspi-status">
              Signal
            </Link>
          </div>
        </div>

        <figure className="hero-asset">
          <img
            src={heroWindow}
            width="1400"
            height="1100"
            alt="A hand-journal tray-table scene with a capsule aircraft window above clouds."
          />
        </figure>
      </section>

      <section className="home-route-panel" aria-label="Site routes">
        <Link className="route-card route-card--signal" to="/raspi-status">
          <span>raspi-status</span>
          <h2>Onboard pulse</h2>
          <SignalPreview state={raspi} />
        </Link>

        <Link className="route-card route-card--flight-log" to="/flight-log">
          <span>flight-log</span>
          <h2>Leave your record</h2>
          <FlightLogPreview state={latestFlightLogEntry} />
        </Link>
      </section>

      <section className="notebook-section" aria-labelledby="notebook-title">
        <div className="notebook-copy">
          <h2 id="notebook-title">Comming soon.</h2>
        </div>
        <div className="notebook-assets">
          <img
            className="notebook-assets__fragments"
            src={journalFragments}
            width="1200"
            height="820"
            alt="Hand-journal fragments for the onboard pulse and private notes."
          />
          <img
            className="notebook-assets__stamps"
            src={stampStrip}
            width="1100"
            height="240"
            alt="Aircraft-window stamps and path labels."
          />
        </div>
      </section>
    </main>
  )
}
