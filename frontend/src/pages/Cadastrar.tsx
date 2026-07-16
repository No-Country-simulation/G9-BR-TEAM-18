import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../types'

export default function Cadastrar() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [errosCampo, setErrosCampo] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const { cadastrar } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setErrosCampo(null)

    if (senha !== confirmar) {
      setErro('As senhas não conferem')
      setErrosCampo({ confirmar_senha: 'As senhas devem ser iguais' })
      setLoading(false)
      return
    }

    try {
      await cadastrar(nome, email, senha)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setErro(err.message)
        setErrosCampo(err.campos)
      } else {
        setErro(err instanceof Error ? err.message : 'Erro ao cadastrar')
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
          <h1>GambIA</h1>
          <p>Crie sua conta</p>
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
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
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
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
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
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
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
