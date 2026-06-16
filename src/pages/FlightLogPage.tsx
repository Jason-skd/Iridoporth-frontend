import { Link } from 'react-router-dom'

export function FlightLogPage() {
  return (
    <main className="placeholder-page" aria-labelledby="flight-log-title">
      <p className="section-kicker">flight-log</p>
      <h1 id="flight-log-title">Flight log</h1>
      <p>
        This page will become the writable logbook for callsigns, route notes,
        and timestamped observations.
      </p>
      <Link className="button button--primary" to="/">
        Back home
      </Link>
    </main>
  )
}

