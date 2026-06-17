import crypto from "crypto";

/**
 * Cleanverse API v5.2 encryption spec:
 * - Algorithm: AES (256-bit, derived from base64-decoded api-key)
 * - Mode: CBC
 * - Padding: PKCS5 (Node's "aes-256-cbc" uses PKCS7 padding, which is
 *   byte-compatible with PKCS5 for AES's 16-byte block size)
 * - IV: fixed 16 zero bytes
 * - Output: Base64-encoded ciphertext, sent as { "data": "<ciphertext>" }
 */

const ZERO_IV = Buffer.alloc(16, 0);

function getKeyBuffer() {
  const apiKey = process.env.CLEANVERSE_API_KEY;
  if (!apiKey) {
    throw new Error("CLEANVERSE_API_KEY is not set in environment");
  }
  const keyBuffer = Buffer.from(apiKey, "base64");
  if (keyBuffer.length !== 32) {
    // Cleanverse issues a base64-encoded 256-bit (32-byte) key for AES-256.
    throw new Error(
      `Decoded api-key is ${keyBuffer.length} bytes, expected 32 bytes for AES-256`
    );
  }
  return keyBuffer;
}

/**
 * Encrypts a plaintext JS object into the { data: "<base64>" } envelope
 * Cleanverse expects for write/admin endpoints.
 */
export function encryptPayload(plainObject) {
  const key = getKeyBuffer();
  const plaintext = JSON.stringify(plainObject);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, ZERO_IV);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { data: encrypted.toString("base64") };
}

/**
 * Decrypts a Cleanverse encrypted response body back into a JS object.
 * Use only on responses from endpoints documented as encrypted.
 */
export function decryptPayload(base64Ciphertext) {
  const key = getKeyBuffer();
  const encryptedBytes = Buffer.from(base64Ciphertext, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, ZERO_IV);
  const decrypted = Buffer.concat([decipher.update(encryptedBytes), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}
