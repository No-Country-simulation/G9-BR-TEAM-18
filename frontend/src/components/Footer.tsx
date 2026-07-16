import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Logo size={24} />
          <span className="navbar-logo-text">EnergIAI</span>
          <p>Inteligência Artificial para Otimização e Eficiência Energética</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Navegação</h4>
            <a href="/">Início</a>
            <a href="/login">Login</a>
            <a href="/cadastrar">Cadastrar</a>
          </div>
          <div className="footer-col">
            <h4>Projeto</h4>
            <a href="https://github.com/No-Country-simulation/G9-BR-TEAM-18" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/No-Country-simulation/G9-BR-TEAM-18/blob/main/README.md" target="_blank" rel="noopener noreferrer">Documentação</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} EnergIAI. Equipe G9-BR-TEAM-18.</p>
      </div>
    </footer>
  )
}
