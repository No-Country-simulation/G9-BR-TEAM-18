import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarAnalises } from '../services/api'
import type { AnaliseHistorico } from '../types'
import { Clock, Zap, DollarSign, ArrowLeft } from 'lucide-react'

export default function Historico() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [analises, setAnalises] = useState<AnaliseHistorico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }
    listarAnalises()
      .then(setAnalises)
      .finally(() => setLoading(false))
  }, [usuario, navigate])

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
        <p>Carregando hist\u00f3rico...</p>
      </div>
    )
  }

  const badgeColor = (cat: string) => {
    switch (cat) {
      case 'Eficiente': return 'var(--primary)'
      case 'Moderado': return 'var(--accent)'
      default: return '#ef4444'
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          opacity: 0.7,
        }}
      >
        <ArrowLeft size={18} /> Voltar ao Dashboard
      </button>

      <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Clock size={28} /> Hist\u00f3rico de An\u00e1lises
      </h1>

      {analises.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          borderRadius: 12,
          background: 'var(--surface)',
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Nenhuma an\u00e1lise encontrada.</p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Fazer primeira an\u00e1lise
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {analises.map((a) => (
            <div
              key={a.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                border: '1px solid var(--border, rgba(128,128,128,0.2))',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.75rem',
                    borderRadius: 999,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: badgeColor(a.categoria),
                    color: '#fff',
                  }}>
                    {a.categoria}
                  </span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                    {new Date(a.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                    <Zap size={16} /> {a.consumoKwh.toFixed(0)} kWh
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                    <DollarSign size={16} /> R$ {a.custoEstimadoMensal.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 8,
                  border: '1px solid var(--primary)',
                  background: 'transparent',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Nova an\u00e1lise
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
