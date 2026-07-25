import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { ApiError } from "../types";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors(null);
    try {
      const needsReset = await login(email, password);
      navigate(needsReset ? "/reset-password" : "/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError(err instanceof Error ? err.message : "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <LogIn size={40} className="auth-logo-icon" />
          <h1>EnergiIA</h1>
          <p>Entre na sua conta</p>
        </div>

        {error && (
          <div className="result-error" style={{ marginBottom: "1rem" }}>
            <p className="error-title">{error}</p>
            {fieldErrors && Object.keys(fieldErrors).length > 0 && (
              <ul className="error-fields">
                {Object.entries(fieldErrors).map(([field, msg]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
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
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder=".........."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer-text">
          Não tem conta?{" "}
          <Link to="/register" className="auth-link">
            Cadastre-se
          </Link>
        </p>

        <Link to="/" className="auth-back">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
