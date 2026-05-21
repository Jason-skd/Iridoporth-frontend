import { useEffect, useState } from 'react'
import cabinWindow from './assets/home/porthole/cabin-window.svg'
import iridoporthTitle from './assets/home/title/iridoporth-title.svg'
import './App.css'

type DeviceStatus = {
  cpuTemp: number
  cpuUsage: number
  memoryUsage: number
  updatedAt: string
}

const STATUS_ENDPOINT = import.meta.env.VITE_STATUS_ENDPOINT as string | undefined

const fallbackStatus: DeviceStatus = {
  cpuTemp: 47.8,
  cpuUsage: 18,
  memoryUsage: 42,
  updatedAt: new Date().toISOString(),
}

function createFallbackStatus(): DeviceStatus {
  const drift = Math.sin(Date.now() / 30000)

  return {
    cpuTemp: Number((fallbackStatus.cpuTemp + drift * 2.4).toFixed(1)),
    cpuUsage: Math.round(fallbackStatus.cpuUsage + drift * 6),
    memoryUsage: Math.round(fallbackStatus.memoryUsage + drift * 3),
    updatedAt: new Date().toISOString(),
  }
}

async function fetchDeviceStatus(): Promise<DeviceStatus> {
  if (!STATUS_ENDPOINT) {
    return createFallbackStatus()
  }

  const response = await fetch(STATUS_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Status request failed: ${response.status}`)
  }

  return response.json() as Promise<DeviceStatus>
}

function useDeviceStatus() {
  const [status, setStatus] = useState<DeviceStatus>(fallbackStatus)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function refreshStatus() {
      try {
        const nextStatus = await fetchDeviceStatus()

        if (isMounted) {
          setStatus(nextStatus)
          setIsLive(Boolean(STATUS_ENDPOINT))
        }
      } catch {
        if (isMounted) {
          setStatus(createFallbackStatus())
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

function HeroSection() {
  return (
    <section className="hero-section" aria-labelledby="site-title">
      <div className="paper-grain" aria-hidden="true" />
      <div className="hero-ornaments" aria-hidden="true">
        <span className="map-line map-line-one" />
        <span className="map-line map-line-two" />
        <span className="map-pin map-pin-one" />
        <span className="map-pin map-pin-two" />
        <span className="corner-mark corner-mark-top" />
        <span className="corner-mark corner-mark-bottom" />
      </div>

      <div className="hero-content">
        <div className="porthole-cluster">
          <p className="side-note side-note-left" aria-hidden="true">
            WINDOW / 07A
          </p>
          <div className="porthole-frame" aria-hidden="true">
            <img src={cabinWindow} alt="" />
          </div>
          <p className="side-note side-note-bottom" aria-hidden="true">
            N31.2304 E121.4737
          </p>
        </div>

        <div className="title-lockup">
          <p className="eyebrow" aria-hidden="true">
            PAPER ROUTE 01
          </p>
          <h1 id="site-title" className="sr-only">
            Iridoporth - 舷窗
          </h1>
          <img
            className="title-asset"
            src={iridoporthTitle}
            alt=""
            aria-hidden="true"
          />
          <div className="flight-strip" aria-hidden="true">
            <span>ALT 32000FT</span>
            <span>LINE STUDY</span>
            <span>DRIFT 05S</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatusMetric({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
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

function StatusSection() {
  const { status, isLive } = useDeviceStatus()
  const updatedTime = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(status.updatedAt))

  return (
    <section className="status-section" aria-labelledby="status-title">
      <div className="status-scene" aria-hidden="true">
        <div className="planet-placeholder" />
        <div className="plane-placeholder" />
      </div>

      <div className="status-panel">
        <div className="status-heading">
          <p>{isLive ? 'Live Raspberry Pi' : 'Mock Raspberry Pi'}</p>
          <h2 id="status-title">树莓派状态</h2>
        </div>

        <dl className="status-grid">
          <StatusMetric label="CPU 温度" value={status.cpuTemp} unit="°C" />
          <StatusMetric label="CPU 占用" value={status.cpuUsage} unit="%" />
          <StatusMetric label="内存占用" value={status.memoryUsage} unit="%" />
        </dl>

        <p className="status-updated">更新时间 {updatedTime}</p>
      </div>
    </section>
  )
}

function App() {
  return (
    <main>
      <HeroSection />
      <StatusSection />
    </main>
  )
}

export default App
