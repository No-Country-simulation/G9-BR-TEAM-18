import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../types'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [errosCampo, setErrosCampo] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setErrosCampo(null)
    try {
      await login(email, senha)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message)
        setErrosCampo(err.campos)
      } else {
        setErro(err instanceof Error ? err.message : 'Erro ao fazer login')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <LogIn size={40} className="auth-logo-icon" />
          <h1>GambIA</h1>
          <p>Entre na sua conta</p>
        </div>

        {erro && (
          <div className="result-error" style={{ marginBottom: '1rem' }}>
            <p className="error-title">{erro}</p>
            {errosCampo && Object.keys(errosCampo).length > 0 && (
              <ul className="error-fields">
                {Object.entries(errosCampo).map(([campo, msg]) => (
                  <li key={campo}><strong>{campo}:</strong> {msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              placeholder=".........."
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-footer-text">
          Não tem conta?{' '}
          <Link to="/cadastrar" className="auth-link">Cadastre-se</Link>
        </p>

        <Link to="/" className="auth-back">Voltar ao início</Link>
      </div>
    </main>
  )
}
