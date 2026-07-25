import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../context/AuthContext";
import Register from "../pages/Register";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function renderPage() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  });

  it("renders the registration form with all fields", () => {
    renderPage();

    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cadastrar/i })).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    renderPage();

    expect(screen.getByText("Faça login")).toBeInTheDocument();
    expect(screen.getByText("Voltar ao início")).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText("Nome completo"), "Test User");
    await userEvent.type(screen.getByLabelText("E-mail"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Senha"), "password123");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "different321");

    await userEvent.click(screen.getByRole("button", { name: /Cadastrar/i }));

    expect(screen.getByText("As senhas não conferem")).toBeInTheDocument();
  });

  it("shows error message on failed registration", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Email já existe" }),
    });

    renderPage();

    await userEvent.type(screen.getByLabelText("Nome completo"), "Test User");
    await userEvent.type(screen.getByLabelText("E-mail"), "existing@test.com");
    await userEvent.type(screen.getByLabelText("Senha"), "password123");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /Cadastrar/i }));

    expect(await screen.findByText("Email já existe")).toBeInTheDocument();
  });

  it("navigates to home on successful registration", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "1", name: "Test", email: "test@test.com" }),
    });

    renderPage();

    await userEvent.type(screen.getByLabelText("Nome completo"), "Test User");
    await userEvent.type(screen.getByLabelText("E-mail"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Senha"), "password123");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /Cadastrar/i }));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("disables submit button while loading", async () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    renderPage();

    await userEvent.type(screen.getByLabelText("Nome completo"), "Test User");
    await userEvent.type(screen.getByLabelText("E-mail"), "test@test.com");
    await userEvent.type(screen.getByLabelText("Senha"), "password123");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /Cadastrar/i }));

    expect(screen.getByRole("button", { name: /Cadastrando/i })).toBeDisabled();
  });

  it("shows generic error message on failed registration", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Erro de validação" }),
    });

    renderPage();

    await userEvent.type(screen.getByLabelText("Nome completo"), "Test User");
    await userEvent.type(screen.getByLabelText("E-mail"), "invalid@test.com");
    await userEvent.type(screen.getByLabelText("Senha"), "longenoughPass1");
    await userEvent.type(screen.getByLabelText("Confirmar senha"), "longenoughPass1");
    await userEvent.click(screen.getByRole("button", { name: /Cadastrar/i }));

    expect(await screen.findByText("Erro de validação")).toBeInTheDocument();
  });
});
