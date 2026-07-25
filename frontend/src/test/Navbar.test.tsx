import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import Navbar from "../components/Navbar";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

type AuthState = "authenticated" | "unauthenticated";

function renderWithState(state: AuthState) {
  localStorage.clear();
  document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";

  if (state === "authenticated") {
    localStorage.setItem(
      "energiai_user",
      JSON.stringify({ id: "1", name: "Alice", email: "a@a.com" }),
    );
    document.cookie = "SESSION_TOKEN=validtoken; Path=/";
  }

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  });

  it("renders the logo and EnergiIA name", async () => {
    renderWithState("unauthenticated");

    await screen.findByText("EnergiIA", {}, { timeout: 2000 });
    expect(screen.getByText("EnergiIA")).toBeInTheDocument();
  });

  it("shows login and register links when user is not authenticated", async () => {
    renderWithState("unauthenticated");

    await vi.waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
      expect(screen.getByText("Cadastrar")).toBeInTheDocument();
    });
  });

  it("shows dashboard, perfil, and history links when authenticated", async () => {
    renderWithState("authenticated");

    await vi.waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Perfil")).toBeInTheDocument();
      expect(screen.getByText("Histórico")).toBeInTheDocument();
    });
  });

  it("shows the user name when authenticated", async () => {
    renderWithState("authenticated");

    await vi.waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  it("shows logout button when authenticated", async () => {
    renderWithState("authenticated");

    await vi.waitFor(() => {
      expect(screen.getByLabelText("Sair")).toBeInTheDocument();
    });
  });

  it("shows two theme toggle buttons (desktop and mobile)", async () => {
    renderWithState("unauthenticated");

    await vi.waitFor(() => {
      const buttons = screen.getAllByLabelText("Modo escuro");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
