import { useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "../types"
import { AuthContext } from "./authContext"

const STORAGE_KEY = "energiai_user"

function restoreSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const u: User = JSON.parse(raw)
      if (u.id && u.name && document.cookie.includes("SESSION_TOKEN=")) {
        return u
      }
    }
  } catch { /* ignore */ }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(restoreSession)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
    const response = await fetch(`${url}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message ?? "Erro ao fazer login")
    }
    const data = await response.json()
    const u: User = {
      id: data.id,
      name: data.name,
      email: data.email,
      passwordResetRequired: data.password_reset_required,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
    return data.password_reset_required === true
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
      const response = await fetch(`${url}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message ?? "Erro ao cadastrar")
      }
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
    fetch(`${url}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {})
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0"
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const resetPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080"
    const response = await fetch(`${url}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message ?? "Erro ao redefinir senha")
    }
    const data = await response.json()
    const u: User = {
      id: data.id,
      name: data.name,
      email: data.email,
      passwordResetRequired: false,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
