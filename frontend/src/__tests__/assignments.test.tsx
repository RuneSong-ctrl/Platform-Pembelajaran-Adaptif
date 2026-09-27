import { describe, it, expect, vi, afterEach } from "vitest";
import { ApiService, normalizeSubmission } from "../services/apiClient";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Assignments and submissions", () => {
  it("shows a graded submission as graded and never invents an attachment", () => {
    const graded = normalizeSubmission({ id: "s1", task_id: "t1", status: "GRADED", grade: 85, content: "", attachments: [] });
    expect(graded.status).toBe("Graded");
    expect(graded.grade).toBe(85);
    expect(graded.attachmentName).toBeUndefined();
    expect(normalizeSubmission({ id: "s2", status: "IN_PROGRESS" }).status).toBe("InProgress");
  });

  it("sends text, kept files and new files as multipart form data", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({ id: "s1", status: "SUBMITTED" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["%PDF-1.4"], "laporan.pdf", { type: "application/pdf" });

    await ApiService.submitAssignment({ task_id: "t1", content: "Jawabanku", keep_file_ids: ["f1"], files: [file] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/submissions$/);
    const body = init.body as FormData;
    expect(body.get("task_id")).toBe("t1");
    expect(body.get("content")).toBe("Jawabanku");
    expect(body.get("keep_files")).toBe('["f1"]');
    expect((body.get("files") as File).name).toBe("laporan.pdf");
    // The browser must set the multipart boundary itself.
    expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("passes on the server's reason when a file is refused", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ detail: "tugas.pdf: isi file tidak sesuai jenisnya." }),
    })));
    await expect(
      ApiService.submitAssignment({ task_id: "t1", content: "", keep_file_ids: [], files: [new File(["x"], "tugas.pdf")] }),
    ).rejects.toThrow("isi file tidak sesuai jenisnya");
  });
});
