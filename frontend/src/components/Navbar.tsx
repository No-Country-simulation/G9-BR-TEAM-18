import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const { usuario, logout } = useAuth()

  const links = usuario
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/historico', label: 'Hist\u00f3rico' },
      ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/cadastrar', label: 'Cadastrar' },
      ]

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <Logo size={26} />
          <span className="navbar-logo-text">GambIA</span>
        </Link>

        <div className="navbar-right">
          {usuario && (
            <span className="navbar-user" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
              {usuario.nome}
            </span>
          )}
          {usuario && (
            <button className="theme-toggle" onClick={logout} aria-label="Sair" title="Sair">
              <LogOut size={18} />
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            className={`navbar-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className={`navbar-links ${menuOpen ? 'visible' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            className="theme-toggle mobile-only"
            onClick={toggle}
            aria-label={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
