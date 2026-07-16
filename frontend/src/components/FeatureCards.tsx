import { Brain, Lightbulb, Wallet } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'Classificador IA',
    desc: 'Modelo Random Forest treinado com dados sintéticos que classifica seu perfil de eficiência energética em Eficiente, Moderado ou Ineficiente.',
  },
  {
    icon: Lightbulb,
    title: 'Recomendações Inteligentes',
    desc: 'Com base na sua classificação, o sistema gera recomendações personalizadas usando IA generativa (Groq LLM) para reduzir seu consumo.',
  },
  {
    icon: Wallet,
    title: 'Custo e Impacto',
    desc: 'Estime seu custo mensal com base na tarifa de R$ 0,75/kWh e veja o impacto das mudanças sugeridas na sua conta de luz.',
  },
]

export default function FeatureCards() {
  return (
    <section id="features" className="features">
      <div className="features-container">
        <h2>Como funciona</h2>
        <p className="features-subtitle">
          Três etapas para entender e otimizar seu consumo de energia
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <f.icon size={32} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
