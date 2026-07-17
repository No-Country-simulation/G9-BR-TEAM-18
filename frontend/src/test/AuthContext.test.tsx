import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function TestConsumer() {
  const { user, login, register, logout, loading } = useAuth()

  if (loading) return <span>loading...</span>

  const handleLogin = () => { login('a@a.com', '123').catch(() => {}) }
  const handleRegister = () => { register('A', 'a@a.com', '123').catch(() => {}) }

  return (
    <div>
      <span>{user ? `logged in as ${user.name}` : 'logged out'}</span>
      <button onClick={handleLogin}>login</button>
      <button onClick={handleRegister}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

function renderWithAuth(node: ReactNode) {
  return render(<AuthProvider>{node}</AuthProvider>)
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.cookie = 'SESSION_TOKEN=; Path=/; Max-Age=0'
  })

  it('shows logged out after loading', async () => {
    renderWithAuth(<TestConsumer />)

    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })

  it('successful login updates state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', name: 'Alice', email: 'a@a.com' }),
    })

    renderWithAuth(<TestConsumer />)
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByText('logged in as Alice')).toBeInTheDocument())
    expect(localStorage.getItem('energiai_user')).toContain('Alice')
  })

  it('login error does not change state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Credenciais inválidas' }),
    })

    renderWithAuth(<TestConsumer />)
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())

    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })

  it('logout clears state and localStorage', async () => {
    localStorage.setItem('energiai_user', JSON.stringify({ id: '1', name: 'Alice', email: 'a@a.com' }))
    document.cookie = 'SESSION_TOKEN=abc; Path=/'

    renderWithAuth(<TestConsumer />)

    await waitFor(() => expect(screen.getByText('logged in as Alice')).toBeInTheDocument())

    await userEvent.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
    expect(localStorage.getItem('energiai_user')).toBeNull()
  })

  it('successful register auto-logs in', async () => {
    // cadastro OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })
    // login automático OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '2', name: 'Bob', email: 'b@b.com' }),
    })

    renderWithAuth(<TestConsumer />)
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())

    await userEvent.click(screen.getByText('register'))

    await waitFor(() => expect(screen.getByText('logged in as Bob')).toBeInTheDocument())
  })
})
