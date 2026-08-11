import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import { useAuth } from "../context/useAuth";

export default function ResetPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, resetPassword } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As novas senhas não conferem");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(currentPassword, newPassword);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Lock size={40} className="auth-logo-icon" />
          <h1>Redefinir Senha</h1>
          <p>Por segurança, confirme sua senha atual e defina uma nova</p>
        </div>

        {error && (
          <div className="result-error" style={{ marginBottom: "1rem" }}>
            <p className="error-title">{error}</p>
          </div>
        )}

        {user?.auth_provider === "GOOGLE" ? (
          <div className="auth-coming-soon" role="alert">
            <span className="coming-soon-badge">Operação indisponível</span>
            <p>
              Contas vinculadas ao Google não podem alterar a senha por aqui. O acesso é gerenciado
              diretamente pela sua conta Google.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => navigate("/")}
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="current-password">Senha Atual</label>
              <input
                id="current-password"
                type="password"
                placeholder="Sua senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">Nova Senha</label>
              <input
                id="new-password"
                type="password"
                placeholder="Nova senha (mín. 6 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar Nova Senha</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
