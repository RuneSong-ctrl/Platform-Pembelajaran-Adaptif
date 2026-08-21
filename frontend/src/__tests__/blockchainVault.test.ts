import { describe, it, expect } from "vitest";
import {
  sha256,
  generateBlockHash,
  generateTransactionId,
  verifyCertificateIntegrity,
  GENESIS_BLOCK_HASH,
} from "../services/blockchainVault";
import { BlockchainCredential } from "../types";

describe("Blockchain Cryptographic Vault", () => {
  it("should calculate deterministic SHA-256 hashes", async () => {
    const hash1 = await sha256("Hello EduAdapt Blockchain");
    const hash2 = await sha256("Hello EduAdapt Blockchain");
    const hash3 = await sha256("Different String");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });

  it("should generate valid Merkle block hash with fixed length", async () => {
    const timestamp = "2026-08-20T08:00:00.000Z";
    const blockHash = await generateBlockHash(
      1,
      GENESIS_BLOCK_HASH,
      "user_ayu_01",
      "KOG-2026-BIO-X7A9",
      95.0,
      timestamp
    );

    expect(blockHash).toBeDefined();
    expect(blockHash.length).toBe(64);

    const txId = await generateTransactionId(blockHash, "KOG-2026-BIO-X7A9");
    expect(txId.startsWith("0x")).toBe(true);
    expect(txId.length).toBe(42);
  });

  it("should verify valid certificate integrity as TRUE", async () => {
    const timestamp = "2026-08-20T08:00:00.000Z";
    const blockHash = await generateBlockHash(
      1,
      GENESIS_BLOCK_HASH,
      "user_ayu_01",
      "KOG-2026-BIO-X7A9",
      95.0,
      timestamp
    );
    const txId = await generateTransactionId(blockHash, "KOG-2026-BIO-X7A9");

    const validCert: BlockchainCredential = {
      id: "cred_test_01",
      certificateId: "KOG-2026-BIO-X7A9",
      studentId: "user_ayu_01",
      studentName: "Ayu Lestari",
      classroomId: "cls_bio_10a",
      className: "Biologi Kelas 10-A",
      competencyTitle: "Penguasaan Fisiologi Sistem Pencernaan",
      score: 95.0,
      blockIndex: 1,
      previousHash: GENESIS_BLOCK_HASH,
      blockHash,
      transactionId: txId,
      verifiedBy: "Universitas Udayana",
      issuedAt: timestamp,
    };

    const result = await verifyCertificateIntegrity(validCert);
    expect(result.isValid).toBe(true);
    expect(result.isTampered).toBe(false);
    expect(result.computedHash).toBe(blockHash);
  });

  it("should detect tamper when score is modified", async () => {
    const timestamp = "2026-08-20T08:00:00.000Z";
    const originalHash = await generateBlockHash(
      1,
      GENESIS_BLOCK_HASH,
      "user_ayu_01",
      "KOG-2026-BIO-X7A9",
      70.0,
      timestamp
    );

    const tamperedCert: BlockchainCredential = {
      id: "cred_test_02",
      certificateId: "KOG-2026-BIO-X7A9",
      studentId: "user_ayu_01",
      studentName: "Ayu Lestari",
      classroomId: "cls_bio_10a",
      className: "Biologi Kelas 10-A",
      competencyTitle: "Penguasaan Fisiologi Sistem Pencernaan",
      score: 70.0,
      blockIndex: 1,
      previousHash: GENESIS_BLOCK_HASH,
      blockHash: originalHash,
      transactionId: "0xtest",
      verifiedBy: "Universitas Udayana",
      issuedAt: timestamp,
    };

    // User tests modifying score from 70 to 100
    const tamperCheck = await verifyCertificateIntegrity(tamperedCert, 100);
    expect(tamperCheck.isValid).toBe(false);
    expect(tamperCheck.isTampered).toBe(true);
    expect(tamperCheck.tamperReason).toBeDefined();
  });
});
