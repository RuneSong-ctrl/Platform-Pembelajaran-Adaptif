import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiService } from "../services/apiClient";

beforeEach(() => {
  for (const name of ["localStorage", "sessionStorage"]) {
    const values = new Map<string, string>();
    vi.stubGlobal(name, {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
      key: (index: number) => [...values.keys()][index] ?? null,
      get length() { return values.size; },
    });
  }
  vi.stubGlobal("fetch", vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith("/auth/register")) {
      const payload = JSON.parse(String(options?.body));
      return { ok: true, json: async () => ({ token: "test-session", user: { ...payload, id: "test-user" } }) };
    }
    if (url.endsWith("/auth/login")) return { ok: false, status: 401, json: async () => ({ detail: "Kredensial tidak valid" }) };
    return { ok: true, json: async () => [] };
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
import { render, screen, act } from "@testing-library/react";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";

function TestConsumer() {
  const {
    isAuthenticated,
    login,
    registerUser,
    loginWithClassCode,
    logout,
    currentUser,
    switchUser,
    classrooms,
    createClassroom,
    joinClassroom,
    documents,
    uploadDocument,
  } = useApp();

  return (
    <div>
      <span data-testid="is-auth">{isAuthenticated ? "YES" : "NO"}</span>
      <span data-testid="user-name">{currentUser.name}</span>
      <span data-testid="user-role">{currentUser.role}</span>
      <span data-testid="class-count">{classrooms.length}</span>
      <span data-testid="doc-count">{documents.length}</span>

      <button
        data-testid="register-student"
        onClick={() =>
          registerUser({
            name: "Devan Rama",
            email: "devan@student.id",
            role: "SISWA",
            grade: 10,
          })
        }
      >
        Register Siswa
      </button>

      <button
        data-testid="register-teacher"
        onClick={() =>
          registerUser({
            name: "Bapak Guru Budi",
            email: "guru.budi@sekolah.id",
            role: "GURU",
          })
        }
      >
        Register Guru
      </button>

      <button
        data-testid="login-user"
        onClick={() => login("devan@student.id")}
      >
        Login User
      </button>

      <button
        data-testid="logout-btn"
        onClick={() => logout()}
      >
        Logout
      </button>

      <button
        data-testid="create-class"
        onClick={() => createClassroom("Biologi 10-A", "Biologi", 10)}
      >
        Create Class
      </button>
    </div>
  );
}

describe("AppContext Dynamic State & Actions", () => {
  it("stays signed out when a slow session restore finishes after logout", async () => {
    sessionStorage.setItem("eduadapt_token", "saved-token");
    let complete!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith("/auth/me") ? new Promise(resolve => { complete = resolve; }) : [],
    })));
    render(<AppProvider><TestConsumer /></AppProvider>);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { screen.getByTestId("logout-btn").click(); });
    await act(async () => { complete({ id: "student", name: "Siswa", role: "SISWA", learning_style: "VISUAL" }); });
    expect(screen.getByTestId("is-auth").textContent).toBe("NO");
    expect(screen.getByTestId("user-name").textContent).toBe("Pengguna");
  });

  it("preserves the visual deep link while restoring a session", async () => {
    sessionStorage.setItem("eduadapt_token", "saved-token");
    let complete!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith("/auth/me") ? new Promise(resolve => { complete = resolve; }) : [],
    })));
    render(<MemoryRouter initialEntries={["/student/learn?doc=doc"]}><AppProvider><Routes>
      <Route path="/" element={<p>Login gate</p>} />
      <Route path="/student/learn" element={<ProtectedRoute allowedRoles={["SISWA"]}><p>Visual deep link</p></ProtectedRoute>} />
    </Routes></AppProvider></MemoryRouter>);
    expect(screen.getByRole("status").textContent).toBe("Memulihkan sesi…");
    await act(async () => { await Promise.resolve(); complete({ id: "student", name: "Siswa", role: "SISWA", learning_style: "VISUAL" }); });
    expect(await screen.findByText("Visual deep link")).toBeTruthy();
    expect(screen.queryByText("Login gate")).toBeNull();
  });
  it("does not authenticate with local flags or failed server login", async () => {
    localStorage.setItem("eduadapt_is_authenticated", "true");
    render(<AppProvider><TestConsumer /></AppProvider>);
    await act(async () => { screen.getByTestId("login-user").click(); });
    expect(screen.getByTestId("is-auth").textContent).toBe("NO");
    expect(ApiService.getToken()).toBeNull();
  });
  it("should initialize cleanly without hardcoded state", () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId("is-auth").textContent).toBe("NO");
    expect(screen.getByTestId("class-count").textContent).toBe("0");
    expect(screen.getByTestId("doc-count").textContent).toBe("0");
  });

  it("should support dynamic registration of new students", async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    const regBtn = screen.getByTestId("register-student");
    await act(async () => {
      regBtn.click();
    });

    expect(screen.getByTestId("is-auth").textContent).toBe("YES");
    expect(screen.getByTestId("user-name").textContent).toBe("Devan Rama");
    expect(screen.getByTestId("user-role").textContent).toBe("SISWA");
  });

  it("should support login and logout flow", async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    const regTeacherBtn = screen.getByTestId("register-teacher");
    await act(async () => {
      regTeacherBtn.click();
    });

    expect(screen.getByTestId("is-auth").textContent).toBe("YES");
    expect(screen.getByTestId("user-role").textContent).toBe("GURU");

    const logoutBtn = screen.getByTestId("logout-btn");
    await act(async () => {
      logoutBtn.click();
    });

    expect(screen.getByTestId("is-auth").textContent).toBe("NO");
  });

  it("should allow creating dynamic classrooms", async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    await act(async () => { screen.getByTestId("register-teacher").click(); });
    const initialCount = Number(screen.getByTestId("class-count").textContent);
    const createBtn = screen.getByTestId("create-class");
    await act(async () => {
      createBtn.click();
    });

    const newCount = Number(screen.getByTestId("class-count").textContent);
    expect(newCount).toBe(initialCount + 1);
  });
});
