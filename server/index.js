import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import { callCleanverse, isConfigured } from "./cleanverseClient.js";
import * as mock from "./mockData.js";
import { readLedger, appendLedgerEntry, clearLedger } from "./ledger.js";
import { readMandate, writeMandate, evaluateMandate } from "./mandate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Helper: try live Cleanverse call, fall back to mock on any failure or if not in live mode.
async function liveOrMock(req, path, body, mockFn) {
  const wantsLive = req.body?.live === true || req.query?.live === "true";
  if (wantsLive && isConfigured()) {
    try {
      const result = await callCleanverse(path, body);
      return { result, mode: "live" };
    } catch (err) {
      return { result: mockFn(), mode: "mock-fallback", error: err.message };
    }
  }
  return { result: mockFn(), mode: "mock" };
}

// ── Status ──────────────────────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  res.json({
    configured: isConfigured(),
    appIdPresent: Boolean(process.env.CLEANVERSE_APP_ID),
    apiKeyPresent: Boolean(process.env.CLEANVERSE_API_KEY),
    env: process.env.CLEANVERSE_ENV || "sandbox"
  });
});

// ── Mandate ─────────────────────────────────────────────────────────────
app.get("/api/mandate", (req, res) => {
  res.json(readMandate());
});

app.put("/api/mandate", (req, res) => {
  const updated = writeMandate(req.body || {});
  res.json(updated);
});

// ── Ledger ──────────────────────────────────────────────────────────────
app.get("/api/ledger", (req, res) => {
  res.json(readLedger());
});

app.delete("/api/ledger", (req, res) => {
  clearLedger();
  res.json({ ok: true });
});

// ── Cleanverse: supported A-Token list ─────────────────────────────────
app.post("/api/cleanverse/supported", async (req, res) => {
  const { chain, symbol } = req.body;
  const { result, mode, error } = await liveOrMock(
    req,
    "/query_deposit_atoken_list",
    { chain, symbol },
    () => mock.mockSupported
  );
  res.json({ ...result, _mode: mode, _error: error });
});

// ── Cleanverse: A-Pass profile ──────────────────────────────────────────
app.post("/api/cleanverse/apass", async (req, res) => {
  const { chain, address } = req.body;
  const { result, mode, error } = await liveOrMock(
    req,
    "/query_apass",
    { chain, address },
    () => mock.mockApass(address)
  );
  res.json({ ...result, _mode: mode, _error: error });
});

// ── Cleanverse: verify A-Pass / transfer eligibility ────────────────────
app.post("/api/cleanverse/verify", async (req, res) => {
  const { chain, atoken, address } = req.body;
  const { result, mode, error } = await liveOrMock(
    req,
    "/verify_apass",
    { chain, atoken, address },
    () => mock.mockVerify(chain, atoken, address)
  );
  res.json({ ...result, _mode: mode, _error: error });
});

// ── Cleanverse: deposit address ─────────────────────────────────────────
app.post("/api/cleanverse/deposit", async (req, res) => {
  const { chain, address } = req.body;
  const { result, mode, error } = await liveOrMock(
    req,
    "/query_deposit_address",
    { chain, address },
    () => mock.mockDeposit(chain, address)
  );
  res.json({ ...result, _mode: mode, _error: error });
});

// ── Cleanverse: institution whitelist ───────────────────────────────────
app.post("/api/cleanverse/whitelist", async (req, res) => {
  const { chain, symbol } = req.body;
  const { result, mode, error } = await liveOrMock(
    req,
    "/query_institution_white_list",
    { chain, symbol },
    () => mock.mockWhitelist
  );
  res.json({ ...result, _mode: mode, _error: error });
});

// ── Cleanverse: faucet (real testnet tokens, not in encrypted list) ────
app.post("/api/cleanverse/faucet", async (req, res) => {
  const { chain, symbol, depositAddress, amount } = req.body;
  const { result, mode, error } = await liveOrMock(
    req,
    "/faucet",
    { chain, symbol, depositAddress, amount },
    () => mock.mockFaucet(chain, symbol, depositAddress, amount)
  );
  res.json({ ...result, _mode: mode, _error: error });
});

// ── Preflight: orchestrates the full Cleanverse check sequence ─────────
app.post("/api/preflight", async (req, res) => {
  const intent = req.body;
  const live = Boolean(intent.live);
  const modes = [];

  const mandateResult = evaluateMandate(intent);

  const callStep = async (path, body, mockFn) => {
    const r = await liveOrMock({ body: { live } }, path, body, mockFn);
    modes.push(r.mode);
    return r.result;
  };

  const supported = await callStep("/query_deposit_atoken_list", { chain: intent.chain, symbol: intent.symbol }, () => mock.mockSupported);
  const token =
    supported.data.tokens.find((t) => t.origin_token.symbol === intent.symbol) ||
    supported.data.tokens[0];

  const [payerApass, receiverApass] = await Promise.all([
    callStep("/query_apass", { chain: intent.chain, address: intent.payer }, () => mock.mockApass(intent.payer)),
    callStep("/query_apass", { chain: intent.chain, address: intent.receiver }, () => mock.mockApass(intent.receiver))
  ]);

  const atokenAddr = token ? token.atoken.address : "";
  const [payerVerify, receiverVerify] = await Promise.all([
    callStep("/verify_apass", { chain: intent.chain, atoken: atokenAddr, address: intent.payer }, () => mock.mockVerify(intent.chain, atokenAddr, intent.payer)),
    callStep("/verify_apass", { chain: intent.chain, atoken: atokenAddr, address: intent.receiver }, () => mock.mockVerify(intent.chain, atokenAddr, intent.receiver))
  ]);

  const deposit = await callStep("/query_deposit_address", { chain: intent.chain, address: intent.payer }, () => mock.mockDeposit(intent.chain, intent.payer));
  const whitelist = await callStep("/query_institution_white_list", { chain: intent.chain, symbol: intent.symbol }, () => mock.mockWhitelist);

  const payerOk = payerVerify.data.code === 4;
  const receiverOk = receiverVerify.data.code === 4;
  const approved = mandateResult.allowed && payerOk && receiverOk && Boolean(token) && !mandateResult.requiresHumanApproval;
  const needsHumanReview = mandateResult.allowed && payerOk && receiverOk && Boolean(token) && mandateResult.requiresHumanApproval;

  const decision = approved ? "approved" : needsHumanReview ? "human_review" : "blocked";

  const response = {
    intent,
    decision,
    mandateResult,
    token,
    payerApass: payerApass.data,
    receiverApass: receiverApass.data,
    payerVerify: payerVerify.data,
    receiverVerify: receiverVerify.data,
    deposit: deposit.data,
    whitelist: whitelist.data,
    apiModes: modes,
    timestamp: new Date().toISOString()
  };

  const ledgerEntry = appendLedgerEntry({
    decision,
    intent,
    reasons: mandateResult.reasons,
    apiModes: modes,
    payerStatus: payerVerify.data.message,
    receiverStatus: receiverVerify.data.message
  });

  res.json({ ...response, ledgerEntry });
});

export default app;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, () => {
    console.log(`Cleanverse Settlement Desk server running on http://localhost:${PORT}`);
    console.log(`Cleanverse live mode configured: ${isConfigured()}`);
  });
}
