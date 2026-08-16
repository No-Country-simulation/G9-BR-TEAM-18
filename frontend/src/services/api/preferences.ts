import { authFetch, redirectToLogin } from "./client";

export async function fetchPreferences(): Promise<{
  consumption_goal?: number;
  regularity?: string;
  // F069 / ADR-0046: campos expostos pelo backend após B051
  peak_hour_usage?: boolean;
  high_consumption_hours?: number;
}> {
  const response = await authFetch("/auth/me");
  if (!response.ok) {
    if (response.status === 401) redirectToLogin();
    return {};
  }
  return response.json();
}

export async function updatePreferences(preferences: {
  consumption_goal?: number | null;
  regularity?: string | null;
  // F069 / ADR-0046: persistidos nas preferências do usuário (backend B051)
  peak_hour_usage?: boolean | null;
  high_consumption_hours?: number | null;
}): Promise<void> {
  const response = await authFetch("/auth/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Erro ao salvar preferências");
  }
}
