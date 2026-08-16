import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/useAuth";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="auth-page"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.passwordResetRequired && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" replace />;
  }

  return <>{children}</>;
}
