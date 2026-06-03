import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { CSSProperties } from 'react'
import { request } from './api/client'
import { FlightLogSection } from './features/flight-log/FlightLogSection'
import cabinWindow from './assets/home/porthole/cabin-window.svg'
import iridoporthTitle from './assets/home/title/iridoporth-title.svg'
import passingPlane from './assets/status/airplane/passing-plane.svg'
import lonelyPlanet from './assets/status/planet/lonely-planet.svg'
import './App.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

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

const STATUS_ENDPOINT = '/api/v1/raspi/status'
const PAGE_COUNT = 3
const FOREGROUND_DRAG_UNIT = 42
const LOG_DRAG_RESPONSE = 7
const PAGE_SWITCH_THRESHOLD = 0.72
const SCROLL_SEGMENT_DVH = 170
const PAGE_FADE_MS = 760
const FOREGROUND_DRAG_LAYERS = {
  porthole: 1.08,
  title: 0.72,
  status: 0.86,
}

async function fetchRaspiStatus(): Promise<RaspiStatus> {
  const raw = await request<RaspiStatus>(STATUS_ENDPOINT)
  return normalizeRaspiStatus(raw)
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

function getPageFromProgress(progress: number, currentPage: number, pageCount: number) {
  const pageProgress = progress * (pageCount - 1)

  if (currentPage < pageCount - 1 && pageProgress >= currentPage + PAGE_SWITCH_THRESHOLD) {
    return currentPage + 1
  }

  if (currentPage > 0 && pageProgress <= currentPage - PAGE_SWITCH_THRESHOLD) {
    return currentPage - 1
  }

  return currentPage
}

function getForegroundDrag(progress: number, pageIndex: number, pageCount: number) {
  const pageProgress = progress * (pageCount - 1)
  const offsetFromPage = pageProgress - pageIndex
  const direction = Math.sign(offsetFromPage)
  const distance = Math.min(Math.abs(offsetFromPage), PAGE_SWITCH_THRESHOLD)
  const dragRatio =
    Math.log1p(distance * LOG_DRAG_RESPONSE) /
    Math.log1p(PAGE_SWITCH_THRESHOLD * LOG_DRAG_RESPONSE)

  return -direction * dragRatio * FOREGROUND_DRAG_UNIT
}

function useScrollPager(pageCount: number) {
  const [currentPage, setCurrentPage] = useState(0)
  const [leavingPage, setLeavingPage] = useState<number>()
  const [pageDrags, setPageDrags] = useState(() =>
    Array.from({ length: pageCount }, (_, index) => getForegroundDrag(0, index, pageCount)),
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(0)
  const leavingResetRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    pageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    return () => {
      if (leavingResetRef.current) window.clearTimeout(leavingResetRef.current)
    }
  }, [])

  useGSAP(() => {
    if (!scrollRef.current) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const trigger = ScrollTrigger.create({
      trigger: scrollRef.current,
      start: 'top top',
      end: 'bottom bottom',
      snap: prefersReducedMotion
        ? undefined
        : {
            snapTo: (progress) => getPageFromProgress(progress, pageRef.current, pageCount) / (pageCount - 1),
            duration: { min: 0.25, max: 0.55 },
            delay: 0.04,
            ease: 'power2.out',
      },
      onUpdate: ({ progress }) => {
        const activePage = pageRef.current
        const nextPage = getPageFromProgress(progress, activePage, pageCount)

        setPageDrags(Array.from({ length: pageCount }, (_, index) => getForegroundDrag(progress, index, pageCount)))

        if (nextPage !== activePage) {
          pageRef.current = nextPage
          setLeavingPage(activePage)
          setCurrentPage(nextPage)

          if (leavingResetRef.current) window.clearTimeout(leavingResetRef.current)
          leavingResetRef.current = window.setTimeout(() => {
            setLeavingPage(undefined)
          }, PAGE_FADE_MS)
        }
      },
    })

    return () => trigger.kill()
  }, [pageCount])

  return {
    currentPage,
    leavingPage,
    pageDrags,
    scrollHeight: `calc(100dvh + ${(pageCount - 1) * SCROLL_SEGMENT_DVH}dvh)`,
    scrollRef,
  }
}

function getPageStyle(pageDrag: number, pageIndex: number, scrollHeight?: string) {
  return {
    ...(scrollHeight ? { '--page-scroll-height': scrollHeight } : {}),
    '--porthole-drag': `${pageDrag * FOREGROUND_DRAG_LAYERS.porthole}px`,
    '--title-drag': `${pageDrag * FOREGROUND_DRAG_LAYERS.title}px`,
    '--status-drag': `${pageDrag * FOREGROUND_DRAG_LAYERS.status}px`,
    '--page-index': pageIndex,
  } as CSSProperties
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
  const { currentPage, leavingPage, pageDrags, scrollHeight, scrollRef } = useScrollPager(PAGE_COUNT)
  const isUnavailable = isUnavailableStatus(status)

  return (
    <main className={isUnavailable ? 'planetary-main' : undefined}>
      <div ref={scrollRef} className="page-scroll" style={getPageStyle(0, 0, scrollHeight)}>
        <div
          className="page-stack"
          aria-live="polite"
        >
          <div
            className={`page-shell${currentPage === 0 ? ' is-active' : ''}${leavingPage === 0 ? ' is-leaving' : ''}`}
            style={getPageStyle(pageDrags[0] ?? 0, 0)}
          >
            <HomeSection />
          </div>
          <div
            className={`page-shell${currentPage === 1 ? ' is-active' : ''}${leavingPage === 1 ? ' is-leaving' : ''}`}
            style={getPageStyle(pageDrags[1] ?? 0, 1)}
          >
            <StatusSection status={status} isLive={isLive} />
          </div>
          <div
            className={`page-shell${currentPage === 2 ? ' is-active' : ''}${leavingPage === 2 ? ' is-leaving' : ''}`}
            style={getPageStyle(pageDrags[2] ?? 0, 2)}
          >
            <FlightLogSection />
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
