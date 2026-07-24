import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

function TestChild() {
  return <div>protected content</div>;
}

function TestResetPage() {
  return <div>reset password page</div>;
}

type AuthState = "authenticated-no-reset" | "authenticated-needs-reset" | "unauthenticated";

function renderWithState(state: AuthState) {
  // Set up localStorage + cookie based on desired auth state
  localStorage.clear();
  document.cookie = "SESSION_TOKEN=; Path=/; Max-Age=0";

  if (state === "authenticated-no-reset") {
    localStorage.setItem(
      "energiai_user",
      JSON.stringify({ id: "1", name: "Alice", email: "a@a.com", passwordResetRequired: false }),
    );
    document.cookie = "SESSION_TOKEN=validtoken; Path=/";
  } else if (state === "authenticated-needs-reset") {
    localStorage.setItem(
      "energiai_user",
      JSON.stringify({ id: "1", name: "Alice", email: "a@a.com", passwordResetRequired: true }),
    );
    document.cookie = "SESSION_TOKEN=validtoken; Path=/";
  }
  // unauthenticated: no cookie, no localStorage

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
