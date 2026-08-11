import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext } from "./themeContextDef";

const COOKIE_NAME = "energiai_theme";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 ano

function getThemeCookie(): "light" | "dark" | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  if (value === "light" || value === "dark") return value;
  return null;
}

function setThemeCookie(theme: string): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(theme)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = getThemeCookie();
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setThemeCookie(theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
