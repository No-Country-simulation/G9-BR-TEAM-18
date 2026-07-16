import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function TestConsumer() {
  const { usuario, login, cadastrar, logout, loading } = useAuth()

  if (loading) return <span>loading...</span>

  const handleLogin = () => { login('a@a.com', '123').catch(() => {}) }
  const handleCadastrar = () => { cadastrar('A', 'a@a.com', '123').catch(() => {}) }

  return (
    <div>
      <span>{usuario ? `logado como ${usuario.nome}` : 'deslogado'}</span>
      <button onClick={handleLogin}>login</button>
      <button onClick={handleCadastrar}>cadastrar</button>
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

  it('exibe deslogado após carregamento', async () => {
    renderWithAuth(<TestConsumer />)

    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })

  it('login bem-sucedido atualiza estado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', nome: 'Alice', email: 'a@a.com' }),
    })

    renderWithAuth(<TestConsumer />)
    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByText('logado como Alice')).toBeInTheDocument())
    expect(localStorage.getItem('energiai_usuario')).toContain('Alice')
  })

  it('login com erro não altera estado', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ mensagem: 'Credenciais inválidas' }),
    })

    renderWithAuth(<TestConsumer />)
    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())

    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
  })

  it('logout limpa estado e localStorage', async () => {
    localStorage.setItem('energiai_usuario', JSON.stringify({ id: '1', nome: 'Alice', email: 'a@a.com' }))
    document.cookie = 'SESSION_TOKEN=abc; Path=/'

    renderWithAuth(<TestConsumer />)

    await waitFor(() => expect(screen.getByText('logado como Alice')).toBeInTheDocument())

    await userEvent.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())
    expect(localStorage.getItem('energiai_usuario')).toBeNull()
  })

  it('cadastrar bem-sucedido faz login automático', async () => {
    // cadastro OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })
    // login automático OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '2', nome: 'Bob', email: 'b@b.com' }),
    })

    renderWithAuth(<TestConsumer />)
    await waitFor(() => expect(screen.getByText('deslogado')).toBeInTheDocument())

    await userEvent.click(screen.getByText('cadastrar'))

    await waitFor(() => expect(screen.getByText('logado como Bob')).toBeInTheDocument())
  })
})
