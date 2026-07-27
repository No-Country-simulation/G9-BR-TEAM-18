import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

const MOCK_NOT_OK = {
  ok: false,
  json: () => Promise.resolve({}),
} as unknown as Response;

const mockFetch = vi.fn(() => Promise.resolve(MOCK_NOT_OK));
globalThis.fetch = mockFetch;

function TestChild() {
  return <div>protected content</div>;
}

function TestResetPage() {
  return <div>reset password page</div>;
}

type AuthState = "authenticated-no-reset" | "authenticated-needs-reset" | "unauthenticated";

function renderWithState(state: AuthState) {
  document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";

  if (state === "authenticated-no-reset") {
    document.cookie = "SESSION_TOKEN=validtoken; Path=/";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "1", name: "Alice", email: "a@a.com" }),
    } as unknown as Response);
  } else if (state === "authenticated-needs-reset") {
    document.cookie = "SESSION_TOKEN=validtoken; Path=/";
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
  }

  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <TestChild />
              </PrivateRoute>
            }
          />
          <Route path="/reset-password" element={<TestResetPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("PrivateRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";
  });

  it("renders children when user is authenticated and no reset required", async () => {
    renderWithState("authenticated-no-reset");

    await vi.waitFor(() => {
      expect(screen.getByText("protected content")).toBeInTheDocument();
    });
  });

  it("redirects to /reset-password when passwordResetRequired is true", async () => {
    renderWithState("authenticated-needs-reset");

    await vi.waitFor(() => {
      expect(screen.getByText("reset password page")).toBeInTheDocument();
    });

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", async () => {
    renderWithState("unauthenticated");

    await vi.waitFor(() => {
      expect(screen.getByText("login page")).toBeInTheDocument();
    });
  });
});
