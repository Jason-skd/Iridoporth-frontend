import { NavLink } from 'react-router-dom'
import { BrandSeal } from './components/BrandSeal'
import { useTranslation } from './lib/i18n'
import { AppRouter } from './router/AppRouter'

function Nav() {
  const { t } = useTranslation()
  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/raspi-status', label: t('nav.raspiStatus') },
    { to: '/flight-log', label: t('nav.flightLog') },
  ]

  return (
    <header className="site-header">
      <NavLink className="brand-mark" to="/" aria-label={t('a11y.brandHome')}>
        <BrandSeal size={28} className="brand-mark__seal" />
        <span>{t('brand')}</span>
      </NavLink>

      <div className="site-header__tools">
        <nav className="site-nav" aria-label={t('a11y.primaryNav')}>
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
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="app-shell">
      <Nav />

      <AppRouter />
    </div>
  )
}

export default App
