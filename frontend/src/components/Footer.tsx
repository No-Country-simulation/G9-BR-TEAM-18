import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Logo size={24} />
          <span className="navbar-logo-text">GambIA</span>
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
            <a href="https://github.com/DessimA/gambia" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/DessimA/gambia/blob/main/README.md" target="_blank" rel="noopener noreferrer">Documentação</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} GambIA. Desenvolvido por José Anderson.</p>
      </div>
    </footer>
  )
}
