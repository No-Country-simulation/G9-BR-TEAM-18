import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../context/AuthContext";
import ResetPasswordPage from "../pages/ResetPasswordPage";

const MOCK_NOT_OK = {
  ok: false,
  json: () => Promise.resolve({}),
} as unknown as Response;

const mockFetch = vi.fn(() => Promise.resolve(MOCK_NOT_OK));
globalThis.fetch = mockFetch;

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ResetPasswordPage />
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  });

  it("renders all three password fields", () => {
    renderPage();

    expect(screen.getByLabelText("Senha Atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Nova Senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar Nova Senha")).toBeInTheDocument();
  });

  it("shows error when new passwords do not match", async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText("Senha Atual"), "currentPass");
    await userEvent.type(screen.getByLabelText("Nova Senha"), "newPass123");
    await userEvent.type(screen.getByLabelText("Confirmar Nova Senha"), "differentPass");

    await userEvent.click(screen.getByRole("button", { name: /Redefinir Senha/i }));

    expect(screen.getByText("As novas senhas não conferem")).toBeInTheDocument();
  });

  it("shows error when new password is too short", async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText("Senha Atual"), "currentPass");
    await userEvent.type(screen.getByLabelText("Nova Senha"), "123");
    await userEvent.type(screen.getByLabelText("Confirmar Nova Senha"), "123");

    await userEvent.click(screen.getByRole("button", { name: /Redefinir Senha/i }));

    expect(screen.getByText("A nova senha deve ter no mínimo 6 caracteres")).toBeInTheDocument();
  });

  it("disables submit button while loading", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_NOT_OK);
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    localStorage.setItem(
      "energiai_user",
      JSON.stringify({
        id: "1",
        name: "Test",
        email: "test@test.com",
        passwordResetRequired: true,
      }),
    );
    document.cookie = "SESSION_TOKEN=abc; Path=/";

    renderPage();

    await userEvent.type(screen.getByLabelText("Senha Atual"), "currentPass");
    await userEvent.type(screen.getByLabelText("Nova Senha"), "newPass123");
    await userEvent.type(screen.getByLabelText("Confirmar Nova Senha"), "newPass123");

    const button = screen.getByRole("button", { name: /Redefinir Senha/i });
    await userEvent.click(button);

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: /Redefinindo/i })).toBeDisabled();
    });
  });
});
