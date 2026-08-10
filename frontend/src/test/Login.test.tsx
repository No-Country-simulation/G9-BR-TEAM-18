import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Login from "../pages/Login";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

const MOCK_NOT_OK = {
  ok: false,
  json: () => Promise.resolve({}),
} as unknown as Response;

const mockFetch = vi.fn(() => Promise.resolve(MOCK_NOT_OK));
globalThis.fetch = mockFetch;

function renderPage() {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  });

  it("renders the login form with email and password fields", () => {
    renderPage();

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
  });

  it("shows link to register page", () => {
    renderPage();

    expect(screen.getByText("Cadastre-se")).toBeInTheDocument();
    expect(screen.getByText("Voltar ao início")).toBeInTheDocument();
  });

  it("disables submit button while loading", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK);
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    renderPage();

    await userEvent.type(screen.getByLabelText("E-mail"), "a@a.com");
    await userEvent.type(screen.getByLabelText("Senha"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    expect(screen.getByRole("button", { name: /Entrando/i })).toBeDisabled();
  });

  it("shows error message on failed login", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Credenciais inválidas" }),
    } as unknown as Response);

    renderPage();

    await userEvent.type(screen.getByLabelText("E-mail"), "wrong@email.com");
    await userEvent.type(screen.getByLabelText("Senha"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    expect(await screen.findByText("Credenciais inválidas")).toBeInTheDocument();
  });

  it("navigates to home on successful login when no reset required", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "1", name: "Test", email: "a@a.com" }),
    } as unknown as Response);

    renderPage();

    await userEvent.type(screen.getByLabelText("E-mail"), "a@a.com");
    await userEvent.type(screen.getByLabelText("Senha"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("navigates to reset-password when password reset is required", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "1",
          name: "Test",
          email: "a@a.com",
          password_reset_required: true,
        }),
    } as unknown as Response);

    renderPage();

    await userEvent.type(screen.getByLabelText("E-mail"), "a@a.com");
    await userEvent.type(screen.getByLabelText("Senha"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /Entrar/i }));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/reset-password");
    });
  });
});
