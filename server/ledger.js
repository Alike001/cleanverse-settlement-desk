import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.VERCEL ? "/tmp/cleanverse-settlement-desk" : path.join(__dirname, "..", "data");
const LEDGER_PATH = path.join(DATA_DIR, "ledger.json");

function ensureLedgerFile() {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LEDGER_PATH)) fs.writeFileSync(LEDGER_PATH, "[]", "utf8");
}

export function readLedger() {
  ensureLedgerFile();
  try {
    const raw = fs.readFileSync(LEDGER_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function appendLedgerEntry(entry) {
  ensureLedgerFile();
  const entries = readLedger();
  const record = {
    id: `PF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  entries.unshift(record); // newest first
  // Keep ledger bounded for a demo (last 200 entries)
  const trimmed = entries.slice(0, 200);
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(trimmed, null, 2), "utf8");
  return record;
}

export function clearLedger() {
  ensureLedgerFile();
  fs.writeFileSync(LEDGER_PATH, "[]", "utf8");
}
