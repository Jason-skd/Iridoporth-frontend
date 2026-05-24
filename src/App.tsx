import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import cabinWindow from './assets/home/porthole/cabin-window.svg'
import iridoporthTitle from './assets/home/title/iridoporth-title.svg'
import passingPlane from './assets/status/airplane/passing-plane.svg'
import lonelyPlanet from './assets/status/planet/lonely-planet.svg'
import './App.css'

type RaspiStatus = {
  ok?: boolean
  data: {
    available?: boolean
    name: string | undefined
    cpu_temperature: number | undefined
    cpu_temprature?: number | undefined
    cpu_usage: number | undefined
    memory_usage: number | undefined
  }
}

type AvailableRaspiStatus = RaspiStatus & {
  data: {
    available: true
    name: string
    cpu_temperature: number
    cpu_usage: number
    memory_usage: number
  }
}

const DEFAULT_STATUS_ENDPOINT = '/api/v1/raspi/status'
const STATUS_ENDPOINT = import.meta.env.VITE_STATUS_ENDPOINT as string || DEFAULT_STATUS_ENDPOINT
const PAGE_COUNT = 2
const WHEEL_THRESHOLD = 420
const TRANSITION_MS = 950
const NUDGE_LIMIT = 58

async function fetchRaspiStatus(): Promise<RaspiStatus> {
  const response = await fetch(STATUS_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Status request failed`)
  }

  return normalizeRaspiStatus(await response.json() as RaspiStatus)
}

function normalizeRaspiStatus(status: RaspiStatus): RaspiStatus {
  return {
    ...status,
    data: {
      ...status.data,
      cpu_temperature: status.data.cpu_temperature ?? status.data.cpu_temprature,
    },
  }
}

function createUnavailableStatus(): RaspiStatus {
  return {
    ok: false,
    data: {
      available: false,
      name: undefined,
      cpu_temperature: undefined,
      cpu_usage: undefined,
      memory_usage: undefined,
    },
  }
}

function isUnavailableStatus(status: RaspiStatus | undefined) {
  // 缺少 ok 字段时不进入深蓝离线态，把它视为信号包不完整。
  if (status === undefined || !('ok' in status)) return false

  // 缺少 available 字段时进入深蓝离线态，和明确 available: false 使用同一套视觉。
  return status.data.available !== true
}

function canShowRaspiInfo(status: RaspiStatus | undefined): status is AvailableRaspiStatus {
  return status?.ok === true && status.data.available === true && status.data.cpu_temperature !== undefined
}

function useRaspiStatus() {
  const [status, setStatus] = useState<RaspiStatus>()
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function refreshStatus() {
      try {
        const nextStatus = await fetchRaspiStatus()

        if (isMounted) {
          setStatus(nextStatus)
          setIsLive(Boolean(STATUS_ENDPOINT))
        }
      } catch {
        if (isMounted) {
          setStatus(createUnavailableStatus())
          setIsLive(false)
        }
      }
    }

    refreshStatus()
    const intervalId = window.setInterval(refreshStatus, 5000)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  return { status, isLive }
}

function useWheelPager(pageCount: number) {
  const [currentPage, setCurrentPage] = useState(0)
  const [nudge, setNudge] = useState(0)
  const pageRef = useRef(0)
  const wheelTotalRef = useRef(0)
  const transitionLockRef = useRef(false)
  const nudgeResetRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    pageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    function resetNudgeSoon() {
      if (nudgeResetRef.current) window.clearTimeout(nudgeResetRef.current)
      nudgeResetRef.current = window.setTimeout(() => {
        wheelTotalRef.current = 0
        setNudge(0)
      }, 140)
    }

    function goToPage(nextPage: number) {
      transitionLockRef.current = true
      wheelTotalRef.current = 0
      setNudge(0)
      setCurrentPage(nextPage)

      window.setTimeout(() => {
        transitionLockRef.current = false
      }, TRANSITION_MS)
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      if (transitionLockRef.current) return

      const delta = event.deltaY
      const direction = Math.sign(delta)
      const current = pageRef.current
      const isAtStart = current === 0 && direction < 0
      const isAtEnd = current === pageCount - 1 && direction > 0

      if (direction === 0 || isAtStart || isAtEnd) {
        setNudge(0)
        wheelTotalRef.current = 0
        return
      }

      wheelTotalRef.current += delta
      const clampedNudge = Math.max(-NUDGE_LIMIT, Math.min(NUDGE_LIMIT, wheelTotalRef.current * 0.14))
      setNudge(clampedNudge)

      if (Math.abs(wheelTotalRef.current) >= WHEEL_THRESHOLD) {
        goToPage(current + direction)
        return
      }

      resetNudgeSoon()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (transitionLockRef.current) return

      if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault()
        if (pageRef.current < pageCount - 1) goToPage(pageRef.current + 1)
      }

      if (['ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault()
        if (pageRef.current > 0) goToPage(pageRef.current - 1)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      if (nudgeResetRef.current) window.clearTimeout(nudgeResetRef.current)
    }
  }, [pageCount])

  return { currentPage, nudge }
}

function HomeSection() {
  return (
    <section className="home-section" aria-labelledby="site-title">
      <div className="paper-grain" aria-hidden="true" />
      <div className="home-ornaments" aria-hidden="true">
        <span className="map-line map-line-one" />
        <span className="map-line map-line-two" />
        <span className="map-pin map-pin-one" />
        <span className="map-pin map-pin-two" />
        <span className="corner-mark corner-mark-top" />
        <span className="corner-mark corner-mark-bottom" />
      </div>

      <div className="home-content">
        <div className="porthole-cluster reveal-item">
          <p className="side-note side-note-left" aria-hidden="true">
            WINDOW / 07A
          </p>
          <div className="porthole-frame" aria-hidden="true">
            <img src={cabinWindow} alt="" />
          </div>
          <p className="side-note side-note-bottom" aria-hidden="true">
            N4.514738 E73.371373
          </p>
        </div>

        <div className="title-lockup">
          <p className="eyebrow reveal-item" aria-hidden="true">
            PAPER ROUTE 01
          </p>
          <h1 id="site-title" className="sr-only">
            Iridoporth - 舷窗
          </h1>
          <img
            className="title-asset reveal-item"
            src={iridoporthTitle}
            alt=""
            aria-hidden="true"
          />
          <div className="flight-strip reveal-item" aria-hidden="true">
            <span>ALT 32000FT</span>
            <span>LINE STUDY</span>
            <span>DRIFT 05S</span>
          </div>
        </div>
      </div>
    </section>
  )
}

type StatusMetricProps = {
  label: string
  value: number
  unit: string
}

function StatusMetric({ label, value, unit }: StatusMetricProps) {
  return (
    <div className="status-metric">
      <dt>{label}</dt>
      <dd>
        {value}
        <span>{unit}</span>
      </dd>
    </div>
  )
}

type StatusSectionProps = {
  isLive: boolean
  status: RaspiStatus | undefined
}

function StatusMessage({
  title,
  children,
}: {
  title: string
  children: string
}) {
  return (
    <div className="status-message">
      <p className="reveal-item">{title}</p>
      <h2 id="status-title" className="reveal-item">{children}</h2>
    </div>
  )
}

function StatusSection({ isLive, status }: StatusSectionProps) {
  const isUnavailable = isUnavailableStatus(status)
  const canShowStatus = canShowRaspiInfo(status)

  if (isUnavailable) console.info('raspi unavailable', status)
  if (!isUnavailable && !canShowStatus) console.info('data incomplete', status)

  return (
    <section
      className={`status-section${isUnavailable ? ' status-section-unavailable' : ''}`}
      aria-labelledby="status-title"
    >
      <div className="status-scene" aria-hidden="true">
        <img className="planet-asset" src={lonelyPlanet} alt="" />
        <img className="plane-asset" src={passingPlane} alt="" />
        <span className="status-beacon status-beacon-one" />
        <span className="status-beacon status-beacon-two" />
        <span className="status-orbit status-orbit-one" />
        <span className="status-orbit status-orbit-two" />
      </div>

      <div className="status-panel">
        {isUnavailable ? (
          <StatusMessage title="Planet Offline">
            星球隐入深蓝的背面，弥留的引力是它曾存在过的唯一证明。
          </StatusMessage>
        ) : canShowStatus ? (
          <>
            <div className="status-heading">
              <p className="reveal-item">{isLive ? status.data.name : 'Local Signal'}</p>
              <h2 id="status-title" className="reveal-item">树莓派状态</h2>
            </div>

            <dl className="status-grid">
              <StatusMetric
                label="CPU 温度"
                value={status.data.cpu_temperature}
                unit="°C"
              />
              <StatusMetric label="CPU 占用" value={status.data.cpu_usage} unit="%" />
              <StatusMetric
                label="内存占用"
                value={status.data.memory_usage}
                unit="%"
              />
            </dl>

            <div className="status-readout reveal-item" aria-label="设备遥测概览">
              <span>{isLive ? 'Live Link' : 'Local Signal'}</span>
              <span>Refresh 5s</span>
              <span>{status.data.cpu_temperature < 70 ? 'Thermal Calm' : 'Thermal Watch'}</span>
            </div>
          </>
        ) : (
          <StatusMessage title="Signal Missing">
            设备的回声暂时沉入星尘。
          </StatusMessage>
        )}
      </div>
    </section>
  )
}

function App() {
  const { status, isLive } = useRaspiStatus()
  const { currentPage, nudge } = useWheelPager(PAGE_COUNT)
  const isUnavailable = isUnavailableStatus(status)

  return (
    <main
      className={isUnavailable ? 'planetary-main' : undefined}
      style={{ '--scroll-nudge': `${nudge}px` } as CSSProperties}
    >
      <div className="page-stack" aria-live="polite">
        <div className={`page-shell${currentPage === 0 ? ' is-active' : ''}`}>
          <HomeSection />
        </div>
        <div className={`page-shell${currentPage === 1 ? ' is-active' : ''}`}>
          <StatusSection status={status} isLive={isLive} />
        </div>
      </div>
    </main>
  )
}

export default App
