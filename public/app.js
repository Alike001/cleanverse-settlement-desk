const $ = (id) => document.getElementById(id);

const state = {
  live: false,
  running: false
};

function formData() {
  return {
    task: $("task").value.trim(),
    supplier: $("supplier").value.trim(),
    chain: $("chain").value,
    symbol: $("symbol").value.toLowerCase(),
    category: $("category").value,
    amount: Number($("amount").value || 0),
    payer: $("payer").value.trim(),
    receiver: $("receiver").value.trim()
  };
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  return res.json();
}

function setMetrics(decision, colorClass) {
  const data = formData();
  $("metricAmount").textContent = `$${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  $("metricRail").textContent = `${data.chain[0].toUpperCase()}${data.chain.slice(1)} / ${data.symbol.toUpperCase()}`;
  const el = $("metricDecision");
  el.textContent = decision;
  el.className = colorClass || "";
}

function setRunning(running) {
  state.running = running;
  const btn = $("runBtn");
  btn.disabled = running;
  btn.textContent = running ? "Running…" : "Run preflight";
  if (running) {
    $("checks").innerHTML = `<div class="spinner-row"><div class="spinner"></div><span>Running Cleanverse checks${state.live ? " against live sandbox" : ""}…</span></div>`;
  }
}

function checkCard(title, status, detail, magickLink, sourceTag) {
  return `
    <article class="check ${status}">
      <span class="status ${status}">${status.toUpperCase()}</span>
      ${sourceTag ? `<span class="source-tag ${sourceTag}">${sourceTag === "live" ? "LIVE" : "MOCK"}</span>` : ""}
      <strong>${title}</strong>
      <p>${detail}</p>
      ${magickLink ? `<a class="magick-link" href="${magickLink}" target="_blank" rel="noopener">→ Start A-Pass onboarding</a>` : ""}
    </article>
  `;
}

function renderChecks(result) {
  const { mandateResult, token, payerApass, receiverApass, payerVerify, receiverVerify, deposit, whitelist, apiModes, intent } = result;
  const modeTag = (i) => (apiModes[i] === "live" ? "live" : "mock");

  const cards = [];

  cards.push(checkCard(
    "Spend mandate",
    mandateResult.allowed ? (mandateResult.requiresHumanApproval ? "warn" : "pass") : "fail",
    mandateResult.reasons.length
      ? mandateResult.reasons.join(" ")
      : `Within "${mandateResult.mandate.agentName}" mandate: $${intent.amount.toLocaleString()} is allowed on ${intent.chain}/${intent.symbol}.`
  ));

  cards.push(checkCard(
    "A-Token support",
    token ? "pass" : "fail",
    token
      ? `${intent.symbol.toUpperCase()} on ${intent.chain} is supported. Settlement token: ${token.atoken.symbol.toUpperCase()} via AccessCore ${token.accesscore_address.slice(0, 10)}…`
      : `No Cleanverse A-Token found for ${intent.symbol.toUpperCase()} on ${intent.chain}.`,
    null, modeTag(0)
  ));

  cards.push(checkCard(
    "Payer A-Pass profile",
    payerApass.status === 1 ? "pass" : "fail",
    `Tier ${payerApass.tier || "—"} · Group ${payerApass.group || "—"} · Status ${payerApass.status === 1 ? "Active" : "Inactive/Frozen"}.`,
    null, modeTag(1)
  ));
  cards.push(checkCard(
    "Receiver A-Pass profile",
    receiverApass.status === 1 ? "pass" : "fail",
    `Tier ${receiverApass.tier || "—"} · Group ${receiverApass.group || "—"} · Status ${receiverApass.status === 1 ? "Active" : "Inactive/Frozen"}.`,
    null, modeTag(2)
  ));

  cards.push(checkCard(
    "Payer transfer eligibility",
    payerVerify.code === 4 ? "pass" : payerVerify.code === 2 ? "fail" : "warn",
    payerVerify.message,
    payerVerify.magickLink || null, modeTag(3)
  ));
  cards.push(checkCard(
    "Receiver transfer eligibility",
    receiverVerify.code === 4 ? "pass" : receiverVerify.code === 2 ? "fail" : "warn",
    receiverVerify.message,
    receiverVerify.magickLink || null, modeTag(4)
  ));

  const depositWallet = deposit.depositUSDCWallet || deposit.depositUSDTWallet;
  cards.push(checkCard(
    "Deposit readiness",
    depositWallet ? "pass" : "warn",
    depositWallet ? `Clean-fund deposit wallet ready: ${depositWallet}` : "No deposit wallet returned.",
    null, modeTag(5)
  ));

  const entries = whitelist.token_whitelist.flatMap((i) => i.whitelist || []);
  cards.push(checkCard(
    "Institution whitelist",
    entries.length ? "pass" : "warn",
    entries.length
      ? `${entries.length} approved source(s): ${entries.map((e) => `${e.service_name} (${e.category})`).join(", ")}.`
      : "No whitelisted institutions returned.",
    null, modeTag(6)
  ));

  $("checks").innerHTML = cards.join("");
}

function receiptText(result) {
  const { intent, decision, mandateResult, token, payerVerify, receiverVerify, whitelist, apiModes, timestamp, ledgerEntry } = result;
  const institutions = whitelist.token_whitelist.flatMap((i) => i.whitelist || []).map((i) => `${i.service_name} (${i.category})`).join(", ");
  const liveCount = apiModes.filter((m) => m === "live").length;

  const decisionLabel = {
    approved: "APPROVED - Cleanverse-ready settlement",
    human_review: "APPROVED PENDING HUMAN SIGN-OFF",
    blocked: "BLOCKED / NEEDS REVIEW"
  }[decision];

  const lines = [
    "====================================================",
    "   CLEANVERSE SETTLEMENT DESK - AUDIT RECEIPT",
    "====================================================",
    "",
    `Receipt ID       : ${ledgerEntry?.id || "—"}`,
    `Decision         : ${decisionLabel}`,
    `Data source      : ${liveCount > 0 ? `${liveCount}/${apiModes.length} checks via LIVE Cleanverse sandbox` : "Mock demo data"}`,
    `Generated        : ${timestamp}`,
    "",
    "-- AGENT MANDATE -----------------------------------",
    `Agent            : ${mandateResult.mandate.agentName}`,
    `Mandate max      : $${mandateResult.mandate.maxAmountUsd.toLocaleString()}`,
    `Mandate check    : ${mandateResult.allowed ? "Within mandate" : "VIOLATION"}`,
    mandateResult.reasons.length ? `Notes            : ${mandateResult.reasons.join(" ")}` : null,
    "",
    "-- PAYMENT INTENT ----------------------------------",
    `Agent task       : ${intent.task}`,
    `Supplier         : ${intent.supplier}`,
    `Rail             : ${intent.chain.toUpperCase()} / ${intent.symbol.toUpperCase()}`,
    `Amount           : $${intent.amount.toLocaleString()}`,
    `Category         : ${intent.category}`,
    "",
    "-- COUNTERPARTY VERIFICATION -----------------------",
    `Payer wallet     : ${intent.payer}`,
    `Receiver wallet  : ${intent.receiver}`,
    `Payer status     : ${payerVerify.message}`,
    `Receiver status  : ${receiverVerify.message}`,
    "",
    "-- CLEANVERSE SETTLEMENT RAIL ----------------------",
    token ? `Origin token     : ${token.origin_token.symbol.toUpperCase()} (${token.origin_token.address})` : "Origin token     : not resolved",
    token ? `A-Token          : ${token.atoken.symbol.toUpperCase()} (${token.atoken.address})` : "",
    token ? `AccessCore       : ${token.accesscore_address}` : "",
    "",
    "-- INSTITUTION WHITELIST ---------------------------",
    `Approved sources : ${institutions || "No whitelist returned"}`,
    "",
    "====================================================",
    "Powered by Cleanverse A-Pass, A-Token, and ClevrPay",
    "Track: Trusted AI Agent Transactions",
    "Cleanverse Build: Verified Finance Hackathon 2026",
    "===================================================="
  ].filter((l) => l !== null);

  return lines.join("\n");
}

async function runPreflight() {
  if (state.running) return;
  const data = formData();

  if (!data.payer || !data.receiver || data.amount <= 0) {
    $("checks").innerHTML = checkCard("Intent validation", "fail", "Payer wallet, receiver wallet, and a positive amount are all required before running preflight.");
    setMetrics("Invalid intent");
    return;
  }

  setRunning(true);
  setMetrics("Checking…");

  try {
    const result = await api("/api/preflight", {
      method: "POST",
      body: JSON.stringify({ ...data, live: state.live })
    });

    setRunning(false);
    renderChecks(result);

    const colorClass = result.decision === "approved" ? "decision-approved" : result.decision === "human_review" ? "decision-warn" : "decision-blocked";
    const label = result.decision === "approved" ? "Approved" : result.decision === "human_review" ? "Needs human sign-off" : "Blocked";
    setMetrics(label, colorClass);

    $("receipt").classList.remove("empty");
    $("receipt").textContent = receiptText(result);

    document.getElementById("audit").scrollIntoView({ behavior: "smooth", block: "start" });
    refreshHistory();
  } catch (err) {
    setRunning(false);
    $("checks").innerHTML = checkCard("Server error", "fail", `Could not reach the Settlement Desk backend: ${err.message}. Is the server running on port 8787?`);
    setMetrics("Server error");
  }
}

function loadSample() {
  $("task").value = "Procure shipment inspection service";
  $("supplier").value = "Zero Hash verified supplier desk";
  $("chain").value = "base";
  $("symbol").value = "usdc";
  $("category").value = "shipment_inspection";
  $("amount").value = "2500";
  $("payer").value = "0x888895E314BF33CEeBCF5320279061aed3a5E2bd";
  $("receiver").value = "0x52411a2b15e1Cd44bd332eF4F8D599D9e7ae6103";
  setMetrics("Ready to check");
}

// ── Mandate panel ──────────────────────────────────────────────────────
async function loadMandate() {
  const m = await api("/api/mandate");
  $("mAgentName").value = m.agentName;
  $("mMaxAmount").value = m.maxAmountUsd;
  $("mApprovalThreshold").value = m.humanApprovalThresholdUsd;
  $("mChains").value = m.allowedChains.join(", ");
  $("mCategories").value = m.allowedCategories.join(", ");
}

async function saveMandate() {
  const btn = $("saveMandateBtn");
  btn.textContent = "Saving…";
  await api("/api/mandate", {
    method: "PUT",
    body: JSON.stringify({
      agentName: $("mAgentName").value.trim(),
      maxAmountUsd: Number($("mMaxAmount").value),
      humanApprovalThresholdUsd: Number($("mApprovalThreshold").value),
      allowedChains: $("mChains").value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      allowedCategories: $("mCategories").value.split(",").map((s) => s.trim()).filter(Boolean)
    })
  });
    btn.textContent = "Saved";
  setTimeout(() => (btn.textContent = "Save mandate"), 1400);
}

// ── History / ledger panel ───────────────────────────────────────────
async function refreshHistory() {
  const entries = await api("/api/ledger");
  if (!entries.length) {
    $("historyList").innerHTML = `<p class="hint">No preflight runs yet. Run a preflight above to start building the audit trail.</p>`;
    return;
  }
  $("historyList").innerHTML = entries.slice(0, 25).map((e) => `
    <article class="history-item ${e.decision}">
      <div class="history-head">
        <span class="status ${e.decision === "approved" ? "pass" : e.decision === "human_review" ? "warn" : "fail"}">${e.decision.replace("_", " ").toUpperCase()}</span>
        <span class="history-time">${new Date(e.timestamp).toLocaleString()}</span>
      </div>
      <strong>${e.intent.task}</strong>
      <p>$${e.intent.amount.toLocaleString()} · ${e.intent.chain}/${e.intent.symbol} · ${e.intent.payer.slice(0, 8)}… → ${e.intent.receiver.slice(0, 8)}…</p>
      ${e.reasons.length ? `<p class="history-reason">${e.reasons.join(" ")}</p>` : ""}
    </article>
  `).join("");
}

// ── Faucet panel ──────────────────────────────────────────────────────
async function requestFaucet() {
  const btn = $("faucetBtn");
  btn.disabled = true;
  btn.textContent = "Requesting…";
  $("faucetResult").classList.remove("empty");
  $("faucetResult").textContent = "Calling Cleanverse faucet…";

  try {
    const result = await api("/api/cleanverse/faucet", {
      method: "POST",
      body: JSON.stringify({
        chain: $("fChain").value,
        symbol: $("fSymbol").value,
        depositAddress: $("fAddress").value.trim(),
        amount: $("fAmount").value.trim(),
        live: state.live
      })
    });

    const sourceTag = result._mode === "live" ? "LIVE" : result._mode === "mock-fallback" ? "MOCK (live call failed)" : "MOCK";
    $("faucetResult").textContent = [
      `Source: ${sourceTag}`,
      result._error ? `Live error: ${result._error}` : null,
      "",
      JSON.stringify(result.data, null, 2)
    ].filter(Boolean).join("\n");
  } catch (err) {
    $("faucetResult").textContent = `Error: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Request test tokens";
  }
}

// ── Mode toggle ─────────────────────────────────────────────────────────
async function refreshModeUI() {
  const status = await api("/api/status");
  const note = $("modeNote");
  if (status.configured) {
    note.textContent = "Backend has real Cleanverse credentials configured. Toggle to call the live sandbox.";
  } else {
    note.textContent = "Backend has no Cleanverse credentials configured — running mock-only.";
  }
}

$("runBtn").addEventListener("click", runPreflight);
$("sampleBtn").addEventListener("click", loadSample);
$("copyBtn").addEventListener("click", async () => {
  const text = $("receipt").textContent;
  if (text && !$("receipt").classList.contains("empty")) {
    await navigator.clipboard.writeText(text);
    $("copyBtn").textContent = "Copied";
    setTimeout(() => ($("copyBtn").textContent = "Copy receipt"), 1400);
  }
});

$("modeToggle").addEventListener("click", () => {
  state.live = !state.live;
  $("modeToggle").textContent = state.live ? "Live mode" : "Mock mode";
  $("modeToggle").style.background = state.live ? "#2557d6" : "";
});

$("saveMandateBtn").addEventListener("click", saveMandate);
$("refreshHistoryBtn").addEventListener("click", refreshHistory);
$("faucetBtn").addEventListener("click", requestFaucet);

["amount", "chain", "symbol"].forEach((id) => $(id).addEventListener("input", () => setMetrics("Ready to check")));

loadSample();
loadMandate();
refreshHistory();
refreshModeUI();
