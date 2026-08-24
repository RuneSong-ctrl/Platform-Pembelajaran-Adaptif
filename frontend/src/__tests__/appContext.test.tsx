import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AppProvider, useApp } from "../contexts/AppContext";

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

    const initialCount = Number(screen.getByTestId("class-count").textContent);
    const createBtn = screen.getByTestId("create-class");
    await act(async () => {
      createBtn.click();
    });

    const newCount = Number(screen.getByTestId("class-count").textContent);
    expect(newCount).toBe(initialCount + 1);
  });
});
