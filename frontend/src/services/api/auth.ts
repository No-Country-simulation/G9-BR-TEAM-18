import { API_URL } from "./client";

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao fazer login");
  }
}

export async function register(name: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao cadastrar");
  }
}
