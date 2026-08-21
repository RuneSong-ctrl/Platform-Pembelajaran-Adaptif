import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AppProvider, useApp } from "../contexts/AppContext";

function TestConsumer() {
  const {
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
      <span data-testid="user-name">{currentUser.name}</span>
      <span data-testid="user-role">{currentUser.role}</span>
      <span data-testid="class-count">{classrooms.length}</span>
      <span data-testid="doc-count">{documents.length}</span>

      <button
        data-testid="switch-to-teacher"
        onClick={() => switchUser("user_teacher_01")}
      >
        Switch to Guru
      </button>

      <button
        data-testid="create-class"
        onClick={() => createClassroom("Biologi 10-C", "Biologi", 10)}
      >
        Create Class
      </button>

      <button
        data-testid="join-class"
        onClick={() => joinClassroom("UDU802")}
      >
        Join Class
      </button>
    </div>
  );
}

describe("AppContext State & Actions", () => {
  it("should render default student user Ayu Lestari", () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    expect(screen.getByTestId("user-name").textContent).toBe("Ayu Lestari");
    expect(screen.getByTestId("user-role").textContent).toBe("SISWA");
    expect(Number(screen.getByTestId("class-count").textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId("doc-count").textContent)).toBeGreaterThan(0);
  });

  it("should switch user persona to Guru Pak Made", async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    );

    const switchBtn = screen.getByTestId("switch-to-teacher");
    await act(async () => {
      switchBtn.click();
    });

    expect(screen.getByTestId("user-name").textContent).toContain("Made Sukadana");
    expect(screen.getByTestId("user-role").textContent).toBe("GURU");
  });

  it("should allow creating a new classroom", async () => {
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
