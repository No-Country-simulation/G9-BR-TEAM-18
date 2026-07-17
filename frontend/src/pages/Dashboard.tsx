import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchDashboard } from '../services/api'
import type { DashboardData } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, Zap, DollarSign, Leaf, TrendingUp, History } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (loading) {
    return (
      <div className="dash-page" style={{ display: 'flex', justifyContent: 'center' }}>
        <p>Carregando dashboard...</p>
      </div>
    )
  }

  if (!data || data.totalAnalyses === 0) {
    return (
      <div className="dash-page" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <BarChart3 size={28} /> Dashboard
        </h1>
        <div className="history-empty">
          <p>Nenhuma an\u00e1lise encontrada. Fa\u00e7a sua primeira an\u00e1lise para come\u00e7ar!</p>
          <button onClick={() => navigate('/')} className="dash-btn dash-btn--primary">
            Fazer an\u00e1lise
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h1><BarChart3 size={28} /> Dashboard</h1>
        <div className="dash-actions">
          <button onClick={() => navigate('/history')} className="dash-btn dash-btn--secondary">
            <History size={18} /> Hist\u00f3rico
          </button>
          <button onClick={() => navigate('/')} className="dash-btn dash-btn--primary">
            Nova an\u00e1lise
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <TrendingUp size={20} className="dash-card-icon" />
            <span className="dash-card-label">Total de An\u00e1lises</span>
          </div>
          <p className="dash-card-value">{data.totalAnalyses}</p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <Zap size={20} className="dash-card-icon" />
            <span className="dash-card-label">M\u00e9dia de Consumo</span>
          </div>
          <p className="dash-card-value">
            {data.averageConsumptionKwh.toFixed(0)} <span className="dash-card-unit">kWh</span>
          </p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <DollarSign size={20} className="dash-card-icon" />
            <span className="dash-card-label">Custo Total</span>
          </div>
          <p className="dash-card-value">
            R$ {data.totalEstimatedCost.toFixed(2)}
          </p>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <Leaf size={20} className="dash-card-icon" />
            <span className="dash-card-label">CO\u2082 Total</span>
          </div>
          <p className="dash-card-value">
            {data.totalCo2EmissionKg.toFixed(2)} <span className="dash-card-unit">kg</span>
          </p>
        </div>
      </div>

      {data.monthlyConsumption.length > 0 && (
        <div className="dash-chart">
          <h3><TrendingUp size={20} /> Consumo por M\u00eas (kWh)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyConsumption}>
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--text-primary)', fontSize: 12, opacity: 0.7 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-primary)', fontSize: 12, opacity: 0.7 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--ink)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="consumptionKwh" fill="var(--accent-green)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
