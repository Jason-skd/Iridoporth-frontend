import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import { FlightLogPage } from './pages/FlightLogPage'
import { HomePage } from './pages/HomePage'
import { RaspiStatusPage } from './pages/RaspiStatusPage'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/raspi-status', label: 'Raspi status' },
  { to: '/flight-log', label: 'flight-log' },
]

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand-mark" to="/" aria-label="Iridoporth home">
          <span className="brand-mark__window" aria-hidden="true" />
          <span>Iridoporth</span>
        </NavLink>

        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'site-nav__link is-active' : 'site-nav__link'
              }
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/raspi-status" element={<RaspiStatusPage />} />
        <Route path="/flight-log" element={<FlightLogPage />} />
      </Routes>
    </div>
  )
}

export default App
