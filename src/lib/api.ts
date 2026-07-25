/**
 * Barrel facade for the API surface.
 *
 * The implementation is split by layer (mirroring the backend's
 * `api/ | http/ | services/` separation):
 *   - `src/api/`        pure DTO wire shapes
 *   - `src/http/`       fetch client + typed errors (ApiError)
 *   - `src/services/`   per-feature call orchestration
 *
 * Everything is re-exported here so existing imports (`from '../lib/api'`)
 * keep working unchanged. Import directly from the layered modules when
 * adding new call sites; this facade exists only to avoid churning page
 * imports during the split.
 */
export type { RaspiStatus } from '../api/raspi'
export type { FlightLogEntry, AdminFlightLogEntry } from '../api/flight-log'

export { ApiError, errorCode, errorMessage } from '../http/api_error'

export { getRaspiStatus } from '../services/raspi'

export {
  getFlightLogEntries,
  createFlightLogEntry,
  getAdminFlightLogEntries,
  likeFlightLogEntry,
  unlikeFlightLogEntry,
  deleteFlightLogEntry,
  setFlightLogHidden,
  respondFlightLogEntry,
  clearFlightLogResponse,
} from '../services/flight-log'

export { login, changePassword } from '../services/account'
