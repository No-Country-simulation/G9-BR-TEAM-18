import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Usuario } from '../types'

const STORAGE_KEY = 'gambia_usuario'

interface AuthContextValue {
  usuario: Usuario | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  usuario: null,
  loading: true,
  login: async () => {},
  cadastrar: async () => {},
  logout: () => {},
})

function restaurarSessao(): Usuario | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const u: Usuario = JSON.parse(raw)
      if (u.id && u.nome && document.cookie.includes('SESSION_TOKEN=')) {
        return u
      }
    }
  } catch { /* ignore */ }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(restaurarSessao)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, senha: string) => {
    const url = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    const response = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.mensagem ?? 'Erro ao fazer login')
    }
    const data = await response.json()
    const u: Usuario = { id: data.id, nome: data.nome, email: data.email }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUsuario(u)
  }, [])

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    const url = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    const response = await fetch(`${url}/auth/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nome, email, senha }),
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.mensagem ?? 'Erro ao cadastrar')
    }
    await login(email, senha)
  }, [login])

  const logout = useCallback(() => {
    document.cookie = 'SESSION_TOKEN=; Path=/; Max-Age=0'
    localStorage.removeItem(STORAGE_KEY)
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, loading, login, cadastrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
