import crypto from "crypto";
import { encryptPayload, decryptPayload } from "./crypto.js";

const ENCRYPTED_ENDPOINTS = new Set([
  "/generate_apass",
  "/update_status",
  "/atoken/register_atoken",
  "/atoken/launch",
  "/atoken/register_wrapped_atoken",
  "/atoken/launch_wrapped_atoken",
  "/atoken/add_rule",
  "/atoken/remove_rule",
  "/atoken/set_paused",
  "/atoken/add_whitelist_for_institutional",
  "/blacklist/add",
  "/validator/grant",
  "/validator/register",
  "/validator/set_rule",
  "/validator/add_rule",
  "/validator/remove_rule",
  "/validator/set_paused"
]);

function getBaseUrl() {
  const env = process.env.CLEANVERSE_ENV || "sandbox";
  if (env === "production") return "https://api.cleanverse.com/api/cooperate";
  return process.env.CLEANVERSE_BASE_URL || "https://uatapi.cleanverse.com/api/cooperate";
}

/**
 * Calls a real Cleanverse endpoint. Throws on network/HTTP failure so the
 * caller can decide whether to fall back to mock data.
 */
export async function callCleanverse(path, body) {
  const appId = process.env.CLEANVERSE_APP_ID;
  if (!appId) {
    throw new Error("CLEANVERSE_APP_ID is not configured");
  }

  const isEncrypted = ENCRYPTED_ENDPOINTS.has(path);
  const requestBody = isEncrypted ? encryptPayload(body) : body;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-id": appId,
      "X-Request-ID": crypto.randomUUID()
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(10000) // 10s — fail fast instead of hanging on blocked/unreachable hosts
  });

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    const err = new Error(`Non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 200)}`);
    err.httpStatus = res.status;
    err.rawBody = rawText;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(json?.message || `Cleanverse HTTP ${res.status}`);
    err.cleanverseResponse = json;
    throw err;
  }

  // If the response itself is an encrypted envelope (rare for query endpoints,
  // but documented for some), decrypt it transparently.
  if (isEncrypted && json?.data && typeof json.data === "string") {
    try {
      const decrypted = decryptPayload(json.data);
      return { ...json, data: decrypted };
    } catch {
      // Not actually encrypted in this response shape — return as-is.
      return json;
    }
  }

  return json;
}

export function isConfigured() {
  return Boolean(process.env.CLEANVERSE_APP_ID);
}
