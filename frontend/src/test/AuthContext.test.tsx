import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/useAuth";
import type { ReactNode } from "react";

const MOCK_NOT_OK = {
  ok: false,
  json: () => Promise.resolve({}),
} as unknown as Response;

const MOCK_OK_USER = {
  ok: true,
  json: () =>
    Promise.resolve({
      id: "1",
      name: "Alice",
      email: "a@a.com",
    }),
} as unknown as Response;

const MOCK_OK_USER_RESET_NEEDED = {
  ok: true,
  json: () =>
    Promise.resolve({
      id: "1",
      name: "Alice",
      email: "a@a.com",
      password_reset_required: true,
    }),
} as unknown as Response;

const mockFetch = vi.fn(() => Promise.resolve(MOCK_NOT_OK));
globalThis.fetch = mockFetch;

function TestConsumer() {
  const { user, login, register, logout, resetPassword, loading } = useAuth();

  if (loading) return <span>loading...</span>;

  const handleLogin = () => {
    login("a@a.com", "123").catch(() => {});
  };
  const handleRegister = () => {
    register("A", "a@a.com", "123").catch(() => {});
  };
  const handleReset = () => {
    resetPassword("oldPass", "newPass").catch(() => {});
  };

  return (
    <div>
      <span>{user ? `logged in as ${user.name}` : "logged out"}</span>
      {user?.passwordResetRequired && <span>needs reset</span>}
      <button onClick={handleLogin}>login</button>
      <button onClick={handleRegister}>register</button>
      <button onClick={logout}>logout</button>
      <button onClick={handleReset}>reset password</button>
    </div>
  );
}

function renderWithAuth(node: ReactNode) {
  return render(<AuthProvider>{node}</AuthProvider>);
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  });

  it("shows logged out after loading", async () => {
    renderWithAuth(<TestConsumer />);

    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());
  });

  it("successful login updates state", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK); // /auth/me returns 401
    renderWithAuth(<TestConsumer />);
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce(MOCK_OK_USER); // /auth/login returns user

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByText("logged in as Alice")).toBeInTheDocument());
  });

  it("login error does not change state", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK); // /auth/me returns 401
    renderWithAuth(<TestConsumer />);
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Credenciais inválidas" }),
    } as unknown as Response);

    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());
  });

  it("login with passwordResetRequired flag stores it in user state", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK); // /auth/me returns 401
    renderWithAuth(<TestConsumer />);
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "1",
          name: "Alice",
          email: "a@a.com",
          password_reset_required: true,
        }),
    } as unknown as Response);

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByText("logged in as Alice")).toBeInTheDocument();
      expect(screen.getByText("needs reset")).toBeInTheDocument();
    });
  });

  it("logout clears state", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_USER); // /auth/me returns Alice
    renderWithAuth(<TestConsumer />);

    await waitFor(() => expect(screen.getByText("logged in as Alice")).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response); // /auth/logout

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());
  });

  it("successful register auto-logs in", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK); // /auth/me returns 401
    renderWithAuth(<TestConsumer />);
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response); // /auth/register
    mockFetch.mockResolvedValueOnce(MOCK_OK_USER); // /auth/login returns user

    await userEvent.click(screen.getByText("register"));

    await waitFor(() => expect(screen.getByText("logged in as Alice")).toBeInTheDocument());
  });

  it("resetPassword sends request and updates user state on success", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_USER_RESET_NEEDED); // /auth/me with reset needed
    renderWithAuth(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByText("logged in as Alice")).toBeInTheDocument();
      expect(screen.getByText("needs reset")).toBeInTheDocument();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "1",
          name: "Alice",
          email: "a@a.com",
          password_reset_required: false,
        }),
    } as unknown as Response);

    await userEvent.click(screen.getByText("reset password"));

    await waitFor(() => {
      expect(screen.queryByText("needs reset")).not.toBeInTheDocument();
    });
  });

  it("resetPassword propagates error on failure", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_USER_RESET_NEEDED); // /auth/me with reset needed
    renderWithAuth(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByText("logged in as Alice")).toBeInTheDocument();
      expect(screen.getByText("needs reset")).toBeInTheDocument();
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Senha atual inválida" }),
    } as unknown as Response);

    await userEvent.click(screen.getByText("reset password"));

    await waitFor(() => {
      expect(screen.getByText("needs reset")).toBeInTheDocument();
    });
  });

  it("resetPassword sends POST to /auth/reset-password with snake_case fields", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_USER); // /auth/me returns Alice
    renderWithAuth(<TestConsumer />);
    await waitFor(() => expect(screen.getByText("logged in as Alice")).toBeInTheDocument());

    mockFetch.mockResolvedValueOnce(MOCK_OK_USER);

    await userEvent.click(screen.getByText("reset password"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/reset-password"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("current_password"),
        }),
      );
    });
  });
});
