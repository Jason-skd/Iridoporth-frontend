import { Link } from 'react-router-dom'

export function FlightLogPage() {
  return (
    <main className="placeholder-page" aria-labelledby="flight-log-title">
      <p className="section-kicker">flight-log</p>
      <h1 id="flight-log-title">flight-log</h1>
      <p>
        A quiet place for anonymous notes.
      </p>
      <Link className="button button--primary" to="/">
        Back home
      </Link>
    </main>
  )
}
