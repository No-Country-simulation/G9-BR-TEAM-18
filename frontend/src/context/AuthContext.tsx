import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { AuthContext } from "./authContext";

function clearSession(): void {
  document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
    fetch(`${url}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            passwordResetRequired: data.password_reset_required,
          });
        } else {
          clearSession();
        }
      })
      .catch(() => {
        // Network error — browser will redirect on first 401
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
    const response = await fetch(`${url}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message ?? "Erro ao fazer login");
    }
    const data = await response.json();
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      passwordResetRequired: data.password_reset_required,
    });
    return data.password_reset_required === true;
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
      const response = await fetch(`${url}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message ?? "Erro ao cadastrar");
      }
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
    fetch(`${url}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const url = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
    const response = await fetch(`${url}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message ?? "Erro ao redefinir senha");
    }
    const data = await response.json();
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      passwordResetRequired: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
