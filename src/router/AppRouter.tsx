import { Route, Routes } from 'react-router-dom'
import { AdminPage } from '../pages/AdminPage'
import { FlightLogPage } from '../pages/FlightLogPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { RaspiStatusPage } from '../pages/RaspiStatusPage'

/** Route table. Keep the header/shell in App.tsx; routes live here. */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/raspi-status" element={<RaspiStatusPage />} />
      <Route path="/flight-log" element={<FlightLogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
