import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import App from "../App";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

type FakeUser = Record<string, unknown> & { id: string; learning_style: string | null };

// Minimal in-memory stand-in for the auth/profile endpoints the account flow touches.
function fakeBackend(options: { failFirstPatch?: boolean; users?: FakeUser[]; sessions?: Record<string, string> } = {}) {
  const users = new Map((options.users || []).map(user => [user.id, user]));
  const sessions = new Map(Object.entries(options.sessions || {}));
  const patches: Record<string, unknown>[] = [];
  let failPatch = Boolean(options.failFirstPatch);
  const reply = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input);
    const token = String((init?.headers as Record<string, string> | undefined)?.Authorization || "").replace("Bearer ", "");
    const user = users.get(sessions.get(token) || "");
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (url.endsWith("/auth/register")) {
      const created: FakeUser = { id: "new-student", name: body.name, email: body.email, role: body.role, learning_style: null, modality_scores: null };
      users.set(created.id, created);
      sessions.set("new-token", created.id);
      return reply(201, { token: "new-token", user: created });
    }
    if (url.endsWith("/auth/me")) return user ? reply(200, user) : reply(401, { detail: "Sesi tidak valid" });
    if (url.endsWith("/auth/logout")) { sessions.delete(token); return reply(200, { success: true }); }
    if (init?.method === "PATCH" && url.includes("/users/")) {
      if (!user) return reply(401, { detail: "Sesi tidak valid" });
      patches.push(body);
      if (failPatch) { failPatch = false; return reply(503, { detail: "Server sedang sibuk." }); }
      Object.assign(user, body);
      return reply(200, user);
    }
    return reply(200, []);
  });
  return { fetchMock, patches, sessions };
}

function renderApp(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppProvider><App /></AppProvider></MemoryRouter>);
}

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
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Student account flow", () => {
  it("sends a new student to profiling and only completes after the profile is saved", async () => {
    const backend = fakeBackend({ failFirstPatch: true });
    vi.stubGlobal("fetch", backend.fetchMock);
    renderApp("/");

    fireEvent.click(await screen.findByRole("button", { name: /Daftar/ }));
    fireEvent.change(screen.getByPlaceholderText("Contoh: I Made Sujana"), { target: { value: "Siswa Baru" } });
    fireEvent.change(screen.getByPlaceholderText("Contoh: made.sujana@student.eduadapt.id"), { target: { value: "baru@example.org" } });
    fireEvent.change(screen.getByPlaceholderText("Buat kata sandi akun"), { target: { value: "Password-1234" } });
    fireEvent.submit(screen.getByPlaceholderText("Buat kata sandi akun").closest("form")!);

    fireEvent.click(await screen.findByText("Mulai Asesmen & Kalibrasi Profil AI"));
    let finish: HTMLElement | null = null;
    while (!finish) {
      fireEvent.click(screen.getAllByRole("radio")[0]);
      finish = screen.queryByRole("button", { name: "Selesaikan dan Lihat Profil Kognitif AI" });
      if (!finish) fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Soal Berikutnya" }));
    }

    fireEvent.click(finish);
    expect((await screen.findByRole("alert")).textContent).toContain("Server sedang sibuk.");
    expect(screen.queryByText("Profil Kognitif Selesai!")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Selesaikan dan Lihat Profil Kognitif AI" }));
    expect(await screen.findByText("Profil Kognitif Selesai!")).toBeTruthy();
    expect(backend.patches).toHaveLength(2);
    expect(backend.patches[1]).toEqual(backend.patches[0]);
    expect(["VISUAL", "AUDITORI", "KINESTETIK"]).toContain(backend.patches[1].learning_style);
  });

  it("keeps an unprofiled student on profiling even through a direct link", async () => {
    const backend = fakeBackend({
      users: [{ id: "s1", name: "Siswa", email: "s1@example.org", role: "SISWA", learning_style: null }],
      sessions: { t1: "s1" },
    });
    vi.stubGlobal("fetch", backend.fetchMock);
    sessionStorage.setItem("eduadapt_token", "t1");
    renderApp("/student/profile");
    expect(await screen.findByText("Temukan Gaya & Ritme Belajarmu")).toBeTruthy();
  });

  it("really signs out from the profile page", async () => {
    const backend = fakeBackend({
      users: [{ id: "s1", name: "Siswa Lama", email: "s1@example.org", role: "SISWA", learning_style: "VISUAL" }],
      sessions: { t1: "s1" },
    });
    vi.stubGlobal("fetch", backend.fetchMock);
    sessionStorage.setItem("eduadapt_token", "t1");
    renderApp("/student/profile");

    fireEvent.click(await screen.findByRole("button", { name: /Keluar dari Akun Siswa/ }));
    expect(await screen.findByPlaceholderText("Masukkan nama akun atau email Anda")).toBeTruthy();
    expect(sessionStorage.getItem("eduadapt_token")).toBeNull();
    await waitFor(() => expect(backend.sessions.has("t1")).toBe(false));
  });

  it("shows a failed profile edit instead of claiming success", async () => {
    const backend = fakeBackend({
      failFirstPatch: true,
      users: [{ id: "s1", name: "Siswa Lama", email: "s1@example.org", role: "SISWA", learning_style: "VISUAL" }],
      sessions: { t1: "s1" },
    });
    vi.stubGlobal("fetch", backend.fetchMock);
    sessionStorage.setItem("eduadapt_token", "t1");
    renderApp("/student/profile");

    fireEvent.click(await screen.findByRole("button", { name: "Edit Data Profil" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan Perubahan" }));
    expect((await within(dialog).findByRole("alert")).textContent).toContain("Server sedang sibuk.");
    expect(within(dialog).queryByText("Profil berhasil diperbarui!")).toBeNull();
  });
});
