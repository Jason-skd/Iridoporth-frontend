import { useEffect, useState } from 'react'
import cabinWindow from './assets/home/porthole/cabin-window.svg'
import iridoporthTitle from './assets/home/title/iridoporth-title.svg'
import passingPlane from './assets/status/airplane/passing-plane.svg'
import lonelyPlanet from './assets/status/planet/lonely-planet.svg'
import './App.css'

type DeviceStatus = {
  ok: boolean
  data: {
    available: boolean
    name: string | undefined
    cpu_temperature: number | undefined
    cpu_temprature?: number | undefined
    cpu_usage: number | undefined
    memory_usage: number | undefined
  }
}

type AvailableDeviceStatus = DeviceStatus & {
  data: {
    available: true
    name: string
    cpu_temperature: number
    cpu_usage: number
    memory_usage: number
  }
}

const DEFAULT_STATUS_ENDPOINT = '/api/v1/device/status'
const STATUS_ENDPOINT = import.meta.env.VITE_STATUS_ENDPOINT as string || DEFAULT_STATUS_ENDPOINT

async function fetchDeviceStatus(): Promise<DeviceStatus> {
  const response = await fetch(STATUS_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Status request failed`)
  }

  return normalizeDeviceStatus(await response.json() as DeviceStatus)
}

function normalizeDeviceStatus(status: DeviceStatus): DeviceStatus {
  return {
    ...status,
    data: {
      ...status.data,
      cpu_temperature: status.data.cpu_temperature ?? status.data.cpu_temprature,
    },
  }
}

function createUnavailableStatus(): DeviceStatus {
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

function isAvailableStatus(status: DeviceStatus): status is AvailableDeviceStatus {
  return status.data.available === true && status.data.cpu_temperature !== undefined
}

function useDeviceStatus() {
  const [status, setStatus] = useState<DeviceStatus>()
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
  status: DeviceStatus | undefined
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
      <p>{title}</p>
      <h2 id="status-title">{children}</h2>
    </div>
  )
}

function StatusSection({ isLive, status }: StatusSectionProps) {
  const isUnavailable = status?.data.available !== true
  const canShowDeviceInfo = status !== undefined && isAvailableStatus(status) && status.ok === true

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
        ) : canShowDeviceInfo ? (
          <>
            <div className="status-heading">
              <p>{isLive ? status.data.name : 'Local Signal'}</p>
              <h2 id="status-title">树莓派状态</h2>
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

            <div className="status-readout" aria-label="设备遥测概览">
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
  const { status, isLive } = useDeviceStatus()
  const isUnavailable = status?.data.available !== true

  return (
    <main className={isUnavailable ? 'planetary-main' : undefined}>
      <HomeSection />
      <StatusSection status={status} isLive={isLive} />
    </main>
  )
}

export default App
