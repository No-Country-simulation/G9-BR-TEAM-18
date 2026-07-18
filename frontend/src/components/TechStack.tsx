import { Globe, Server, Cpu, Container } from "lucide-react";

const LAYERS = [
  {
    icon: Globe,
    title: "Frontend (React + Vite)",
    desc: "Interface do usuário com TypeScript, React Router para navegação autenticada, Recharts para gráficos e Lucide para ícones.",
  },
  {
    icon: Server,
    title: "Backend (Spring Boot)",
    desc: "API REST com arquitetura hexagonal. Gerencia autenticação via sessão, valida payloads e orquestra chamadas ao ml-service.",
  },
  {
    icon: Cpu,
    title: "ML Service (FastAPI + scikit-learn)",
    desc: "Microsserviço Python com modelo Random Forest treinado com dados reais da PPH 2019. Fallback rule-based e recomendações via Groq LLM quando a confiança do modelo é baixa.",
  },
  {
    icon: Container,
    title: "Infraestrutura (Docker + Render)",
    desc: "Tudo containerizado com Docker Compose (PostgreSQL, Backend, ML Service, Frontend). Deploy automatizado no Render com CI/CD via GitHub Actions.",
  },
];

export default function TechStack() {
  return (
    <section id="arquitetura" className="features">
      <div className="features-container">
        <h2>Arquitetura do Projeto</h2>
        <p className="features-subtitle">Stack moderna e escalável para análise energética</p>
        <div className="features-grid">
          {LAYERS.map((l, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <l.icon size={32} />
              </div>
              <h3>{l.title}</h3>
              <p>{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
