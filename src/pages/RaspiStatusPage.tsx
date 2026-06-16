import { Link } from 'react-router-dom'

export function RaspiStatusPage() {
  return (
    <main className="placeholder-page" aria-labelledby="raspi-title">
      <p className="section-kicker">raspi-status</p>
      <h1 id="raspi-title">Onboard pulse</h1>
      <p>
        This page will become the focused instrument view for temperature,
        processor load, memory, and host availability.
      </p>
      <Link className="button button--primary" to="/">
        Back home
      </Link>
    </main>
  )
}

