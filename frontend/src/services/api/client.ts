const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function redirectToLogin(): void {
  document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  window.location.href = "/login";
}

async function authFetch(path: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...((options?.headers as Record<string, string>) ?? {}),
    },
    credentials: "include",
  });
  return response;
}

export { API_URL, authFetch, redirectToLogin };
