import { ClipboardList, BarChart3, Lightbulb, LineChart } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "1. Informe seus dados",
    desc: "Adicione os aparelhos que você possui, o tipo de imóvel e seus hábitos de consumo. Quanto mais detalhes, mais precisa será a análise.",
  },
  {
    icon: BarChart3,
    title: "2. Classificação por IA",
    desc: "O modelo preditivo (scikit-learn) classifica seu perfil em uma das 5 categorias de eficiência energética: Excelente, Bom, Mediano, Ruim ou Crítico.",
  },
  {
    icon: Lightbulb,
    title: "3. Recomendações inteligentes",
    desc: "Com base na sua categoria, o sistema gera recomendações personalizadas usando regras especializadas ou IA generativa (Groq LLM).",
  },
  {
    icon: LineChart,
    title: "4. Acompanhe seu histórico",
    desc: "Todas as análises ficam salvas no seu Dashboard e Histórico para você monitorar a evolução do seu consumo.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="features">
      <div className="features-container">
        <h2>Passo a passo</h2>
        <p className="features-subtitle">
          Da coleta de dados à recomendação personalizada em segundos
        </p>
        <div className="features-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <s.icon size={32} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
