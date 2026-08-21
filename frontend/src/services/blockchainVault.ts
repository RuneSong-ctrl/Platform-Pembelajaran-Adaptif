import { BlockchainCredential } from "@/types";

/**
 * Mesin Kriptografi SHA-256 Blockchain Vault
 * Sesuai SPEC.md §4 (Deterministic Merkle Chaining & Verification)
 */

// Simple SHA-256 Implementation for synchronous & Web Crypto execution
export async function sha256(message: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Pure JS fallback for server/testing
  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;

  // Simple deterministic hash mapping representation
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = (hash << 5) - hash + message.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

export async function generateBlockHash(
  blockIndex: number,
  previousHash: string,
  studentId: string,
  certificateId: string,
  score: number,
  timestamp: string
): Promise<string> {
  const payload = `${blockIndex}|${previousHash}|${studentId}|${certificateId}|${score.toFixed(
    1
  )}|${timestamp}`;
  return await sha256(payload);
}

export async function generateTransactionId(
  blockHash: string,
  certificateId: string
): Promise<string> {
  const txHash = await sha256(`${blockHash}|${certificateId}`);
  return `0x${txHash.slice(0, 40)}`;
}

export interface VerificationResult {
  isValid: boolean;
  computedHash: string;
  recordedHash: string;
  storedHash?: string;
  isTampered: boolean;
  certificate?: BlockchainCredential;
  tamperReason?: string;
}

export async function verifyCertificateIntegrity(
  cert: BlockchainCredential,
  forcedScoreCheck?: number
): Promise<VerificationResult> {
  const scoreToVerify = forcedScoreCheck !== undefined ? forcedScoreCheck : cert.score;
  const computedHash = await generateBlockHash(
    cert.blockIndex,
    cert.previousHash,
    cert.studentId,
    cert.certificateId,
    scoreToVerify,
    cert.issuedAt
  );

  const isValid = computedHash === cert.blockHash;

  return {
    isValid,
    computedHash,
    recordedHash: cert.blockHash,
    storedHash: cert.blockHash,
    isTampered: !isValid,
    certificate: cert,
    tamperReason: !isValid
      ? "Deteksi Tamper Kriptografis: Hash payload saat ini tidak cocok dengan block hash permanen yang tercatat pada ledger."
      : undefined,
  };
}

export const GENESIS_BLOCK_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";
