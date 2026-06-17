import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANDATE_PATH = path.join(__dirname, "..", "data", "mandate.json");

const DEFAULT_MANDATE = {
  agentName: "Procurement Agent #1",
  maxAmountUsd: 5000,
  allowedChains: ["base", "polygon", "ethereum", "arbitrum", "monad"],
  allowedSymbols: ["usdc", "usdt"],
  allowedCategories: ["supplier_payment", "shipment_inspection", "logistics", "software_license"],
  expiresAt: null, // ISO string or null = no expiry
  humanApprovalThresholdUsd: 5000, // amounts >= this still need a human sign-off
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function ensureMandateFile() {
  const dir = path.dirname(MANDATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MANDATE_PATH)) {
    fs.writeFileSync(MANDATE_PATH, JSON.stringify(DEFAULT_MANDATE, null, 2), "utf8");
  }
}

export function readMandate() {
  ensureMandateFile();
  try {
    return JSON.parse(fs.readFileSync(MANDATE_PATH, "utf8"));
  } catch {
    return DEFAULT_MANDATE;
  }
}

export function writeMandate(partialUpdate) {
  ensureMandateFile();
  const current = readMandate();
  const updated = {
    ...current,
    ...partialUpdate,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(MANDATE_PATH, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

/**
 * Evaluates a proposed payment intent against the current mandate.
 * Returns { allowed, requiresHumanApproval, reasons: string[] }
 */
export function evaluateMandate(intent) {
  const mandate = readMandate();
  const reasons = [];
  let allowed = true;

  if (mandate.expiresAt && new Date(mandate.expiresAt).getTime() < Date.now()) {
    allowed = false;
    reasons.push(`Mandate expired on ${mandate.expiresAt}.`);
  }

  if (!mandate.allowedChains.includes(intent.chain)) {
    allowed = false;
    reasons.push(`Chain "${intent.chain}" is not in the agent's allowed chain list.`);
  }

  if (!mandate.allowedSymbols.includes(intent.symbol)) {
    allowed = false;
    reasons.push(`Token "${intent.symbol}" is not in the agent's allowed token list.`);
  }

  if (intent.amount > mandate.maxAmountUsd) {
    allowed = false;
    reasons.push(`Amount $${intent.amount.toLocaleString()} exceeds mandate max of $${mandate.maxAmountUsd.toLocaleString()}.`);
  }

  if (intent.category && mandate.allowedCategories.length && !mandate.allowedCategories.includes(intent.category)) {
    allowed = false;
    reasons.push(`Category "${intent.category}" is not pre-approved under this mandate.`);
  }

  const requiresHumanApproval = intent.amount >= mandate.humanApprovalThresholdUsd;
  if (requiresHumanApproval) {
    reasons.push(`Amount is at or above the $${mandate.humanApprovalThresholdUsd.toLocaleString()} human-approval threshold.`);
  }

  return { allowed, requiresHumanApproval, reasons, mandate };
}
