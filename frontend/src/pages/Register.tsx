import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../types'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors(null)

    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      setFieldErrors({ confirm_password: 'As senhas devem ser iguais' })
      setLoading(false)
      return
    }

    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFieldErrors(err.fields)
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <UserPlus size={40} className="auth-logo-icon" />
          <h1>EnergiIA</h1>
          <p>Crie sua conta</p>
        </div>

        {error && (
          <div className="result-error" style={{ marginBottom: '1rem' }}>
            <p className="error-title">{error}</p>
            {fieldErrors && Object.keys(fieldErrors).length > 0 && (
              <ul className="error-fields">
                {Object.entries(fieldErrors).map(([field, msg]) => (
                  <li key={field}><strong>{field}:</strong> {msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmar">Confirmar senha</label>
            <input
              id="confirmar"
              type="password"
              placeholder=".........."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="auth-footer-text">
          Já tem conta?{' '}
          <Link to="/login" className="auth-link">Faça login</Link>
        </p>

        <Link to="/" className="auth-back">Voltar ao início</Link>
      </div>
    </main>
  )
}
