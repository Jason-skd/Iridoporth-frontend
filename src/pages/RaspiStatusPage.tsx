import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRaspiStatus, type RaspiStatus } from '../lib/api'
import { clampPercent, formatPercent, formatTemp } from '../lib/format'

const RASPI_POLL_INTERVAL_MS = 5000

type RaspiState =
  | { status: 'loading' }
  | { status: 'ready'; data: RaspiStatus; updatedAt: Date }
  | { status: 'error'; message: string }

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Signal unavailable'
}

function useRaspiStatus() {
  const [state, setState] = useState<RaspiState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    let controller: AbortController | null = null

    const fetchStatus = () => {
      controller?.abort()
      const requestController = new AbortController()
      controller = requestController

      getRaspiStatus(requestController.signal)
        .then((data) => {
          if (!active || requestController.signal.aborted) return
          setState({ status: 'ready', data, updatedAt: new Date() })
        })
        .catch((error: unknown) => {
          if (!active || requestController.signal.aborted) return
          setState({ status: 'error', message: getErrorMessage(error) })
        })
    }

    fetchStatus()
    const intervalId = window.setInterval(fetchStatus, RASPI_POLL_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
      controller?.abort()
    }
  }, [])

  return state
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function getDisplayStatus(state: RaspiState) {
  if (state.status === 'loading') return 'listening'
  if (state.status === 'error') return 'signal lost'
  return state.data.available ? 'online' : 'unavailable'
}

function getNeedleRotation(status: RaspiStatus | null) {
  if (!status?.available) return -42

  const cpu = clampPercent(status.cpu_usage)
  const memory = clampPercent(status.memory_usage)
  const temperature = status.cpu_temperature === null
    ? 0
    : Math.min(Math.max((status.cpu_temperature - 25) / 55, 0), 1) * 100

  const load = cpu * 0.42 + memory * 0.34 + temperature * 0.24
  return -42 + (load / 100) * 84
}

function StatusNote({ state }: { state: RaspiState }) {
  if (state.status === 'loading') {
    return <p className="raspi-status-note">Waiting for the onboard pulse.</p>
  }

  if (state.status === 'error') {
    return <p className="raspi-status-note">Backend preview: {state.message}</p>
  }

  if (!state.data.available) {
    return <p className="raspi-status-note">This environment is not reporting raspi telemetry.</p>
  }

  return (
    <p className="raspi-status-note">
      Last signal {formatTime(state.updatedAt)}
    </p>
  )
}

function MetricRow({
  label,
  value,
  meter,
}: {
  label: string
  value: string
  meter: number
}) {
  return (
    <div className="raspi-metric-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <span className="raspi-meter" aria-hidden="true">
        <span style={{ inlineSize: `${meter}%` }} />
      </span>
    </div>
  )
}

export function RaspiStatusPage() {
  const state = useRaspiStatus()
  const data = state.status === 'ready' ? state.data : null
  const statusLabel = getDisplayStatus(state)

  const metrics = useMemo(
    () => [
      {
        label: 'temperature',
        value: formatTemp(data?.cpu_temperature ?? null),
        meter: data?.available
          ? Math.min(Math.max(((data.cpu_temperature ?? 0) / 85) * 100, 0), 100)
          : 0,
      },
      {
        label: 'processor',
        value: formatPercent(data?.cpu_usage ?? null),
        meter: data?.available ? clampPercent(data.cpu_usage) : 0,
      },
      {
        label: 'memory',
        value: formatPercent(data?.memory_usage ?? null),
        meter: data?.available ? clampPercent(data.memory_usage) : 0,
      },
    ],
    [data],
  )

  return (
    <main className="raspi-page" aria-labelledby="raspi-title">
      <section className="raspi-hero">
        <div className="raspi-hero__copy">
          <p className="section-kicker">raspi-status</p>
          <h1 id="raspi-title">Onboard pulse</h1>
          <StatusNote state={state} />
          <div className="raspi-actions">
            <Link className="button button--primary" to="/">
              Home
            </Link>
          </div>
        </div>

        <div className="raspi-instrument" aria-label={`Raspi status: ${statusLabel}`}>
          <div className="raspi-instrument__plate">
            <span className="raspi-instrument__window" aria-hidden="true" />
            <span className="raspi-instrument__status">{statusLabel}</span>
            <span className="raspi-instrument__host">{data?.name ?? 'raspberrypi'}</span>
            <div className="raspi-dial" aria-hidden="true">
              <span className="raspi-dial__arc" />
              <span
                className="raspi-dial__needle"
                style={{ transform: `rotate(${getNeedleRotation(data)}deg)` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="raspi-readout" aria-label="Raspi telemetry">
        {metrics.map((metric) => (
          <MetricRow
            key={metric.label}
            label={metric.label}
            value={metric.value}
            meter={metric.meter}
          />
        ))}
      </section>
    </main>
  )
}
