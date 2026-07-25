/** Wire shapes for the flight-log endpoints. Pure data, no logic. */

export type FlightLogEntry = {
  id: number
  content: string
  callsign: string | null
  created_at: number
  response: string | null
  responded_at: number | null
  created_by_this_user: boolean
  likes: number
  liked_by_this_user: boolean
}

export type AdminFlightLogEntry = FlightLogEntry & {
  deleted_at: number | null
  hidden_at: number | null
}
