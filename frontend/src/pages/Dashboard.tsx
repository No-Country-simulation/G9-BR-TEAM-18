import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { buscarDashboard } from '../services/api'
import type { DashboardData } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, Zap, DollarSign, Leaf, TrendingUp, History } from 'lucide-react'

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }
    buscarDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [usuario, navigate])

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
        <p>Carregando dashboard...</p>
      </div>
    )
  }

  if (!data || data.totalAnalises === 0) {
    return (
      <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div style={{
          padding: '4rem 1rem',
          borderRadius: 12,
          background: 'var(--surface)',
          marginTop: '2rem',
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Nenhuma an\u00e1lise encontrada. Fa\u00e7a sua primeira an\u00e1lise para come\u00e7ar!
          </p>
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
            Fazer an\u00e1lise
          </button>
        </div>
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    borderRadius: 12,
    padding: '1.5rem',
    border: '1px solid var(--border, rgba(128,128,128,0.2))',
  }

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/historico')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 8,
              border: '1px solid var(--primary)',
              background: 'transparent',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <History size={18} /> Hist\u00f3rico
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Nova an\u00e1lise
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total de An\u00e1lises</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{data.totalAnalises}</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Zap size={20} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>M\u00e9dia de Consumo</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            {data.mediaConsumoKwh.toFixed(0)} <span style={{ fontSize: '0.9rem', fontWeight: 400, opacity: 0.6 }}>kWh</span>
          </p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <DollarSign size={20} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Custo Total</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            R$ {data.totalCustoEstimado.toFixed(2)}
          </p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Leaf size={20} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>CO\u2082 Total</span>
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            {data.totalEmissaoCo2Kg.toFixed(2)} <span style={{ fontSize: '0.9rem', fontWeight: 400, opacity: 0.6 }}>kg</span>
          </p>
        </div>
      </div>

      {data.consumoPorMes.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} /> Consumo por M\u00eas (kWh)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.consumoPorMes}>
              <XAxis
                dataKey="mes"
                tick={{ fill: 'var(--text)', fontSize: 12, opacity: 0.7 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text)', fontSize: 12, opacity: 0.7 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid rgba(128,128,128,0.3)',
                  borderRadius: 8,
                  color: 'var(--text)',
                }}
              />
              <Bar dataKey="consumoKwh" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
