import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../context/useTheme";
import { useAuth } from "../context/useAuth";
import Logo from "./Logo";

const FULL_NAME = "EnergiIA";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (typed.length < FULL_NAME.length) {
      const t = setTimeout(() => setTyped(FULL_NAME.slice(0, typed.length + 1)), 150);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone(true), 600);
    return () => clearTimeout(t);
  }, [typed]);

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/profile", label: "Perfil" },
        { to: "/analysis", label: "Analisar" },
        { to: "/history", label: "Histórico" },
      ]
    : [
        { to: "/login", label: "Login" },
        { to: "/register", label: "Cadastrar" },
      ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <Logo size={34} />
          <span className="navbar-logo-text logo-type">
            {typed}
            <span className={`logo-cursor${done ? " logo-cursor--done" : ""}`} />
          </span>
        </Link>

        <div className="navbar-right">
          {user && (
            <span
              className="navbar-user"
              style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginRight: "0.5rem" }}
            >
              {user.name}
            </span>
          )}
          {user && (
            <button className="theme-toggle" onClick={logout} aria-label="Sair" title="Sair">
              <LogOut size={18} />
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            className={`navbar-toggle ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className={`navbar-links ${menuOpen ? "visible" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${location.pathname === link.to ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            className="theme-toggle mobile-only"
            onClick={toggle}
            aria-label={theme === "light" ? "Modo escuro" : "Modo claro"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === "light" ? "Modo escuro" : "Modo claro"}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
