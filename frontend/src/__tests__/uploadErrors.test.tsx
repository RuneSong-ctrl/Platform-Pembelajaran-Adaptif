import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiService } from "../services/apiClient";

const file = new File(["Fotosintesis terjadi di daun."], "modul.txt", { type: "text/plain" });
afterEach(() => vi.unstubAllGlobals());

describe("Module upload errors", () => {
  it("shows the server's reason instead of a generic connection message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ detail: "Anda tidak memiliki akses ke kelas ini." }) })));
    await expect(ApiService.uploadDocumentFile({ classroom_id: "c1", file })).rejects.toThrow("Anda tidak memiliki akses ke kelas ini.");
  });

  it("only mentions the connection when the server is actually unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(ApiService.uploadDocumentFile({ classroom_id: "c1", file })).rejects.toThrow("Server tidak dapat dihubungi");
    await expect(ApiService.authenticatedRequest("/documents/upload", { method: "POST" })).rejects.toThrow("Server tidak dapat dihubungi");
  });
});
