# Cleanverse Settlement Desk

> **Hackathon:** Cleanverse Build — Verified Finance Hackathon
> **Track:** Trusted AI Agent Transactions
> **Deadline:** June 17, 2026, 23:59 UTC
> **Built by:** Hammed Ali Oyeleye (Hammed Labs)

---

## What it does

Cleanverse Settlement Desk is a payment control desk for AI agents. Before a single dollar moves, it runs a structured **Cleanverse preflight** against both counterparties, enforces an **agent spend mandate**, and writes every decision to a persistent **audit ledger** — producing receipts finance and compliance teams can actually read.

**The problem:** AI agents can source vendors, negotiate terms, and trigger payments — but nobody has a clear, repeatable answer to *"is this payment safe to execute, and can I prove it later?"*

**The solution:** A real backend (not just a frontend demo) that:

- Calls **live Cleanverse sandbox APIs** when credentials are present, with automatic mock fallback if a call fails
- Enforces a **persistent agent mandate** (max amount, allowed chains/tokens/categories, human-approval threshold) server-side, not just as a form field
- Writes every preflight run to a **JSON audit ledger** so there's a real history, not a one-off receipt
- Keeps the Cleanverse `api-id` and AES `api-key` strictly server-side — never exposed to the browser
- Implements the documented **AES-256-CBC encryption spec** for Cleanverse's write/admin endpoints
- Optionally calls the real **testnet faucet** to mint test tokens with a real transaction hash

---

## Architecture

```
cleanverse-settlement-desk/
├── server/                  # Express backend — the real integration layer
│   ├── index.js              # Routes: preflight orchestration, mandate, ledger, faucet
│   ├── cleanverseClient.js    # Real HTTP calls to Cleanverse sandbox/production
│   ├── crypto.js              # AES-256-CBC encryption per Cleanverse v5.2 spec
│   ├── mandate.js             # Agent mandate persistence + enforcement logic
│   ├── ledger.js               # Audit trail persistence
│   ├── mockData.js             # Realistic mock responses (demo / fallback mode)
│   ├── .env.example            # Template — copy to .env, fill in real credentials
│   └── package.json
├── public/                  # Frontend — served by the same Express server
│   ├── index.html             # Intent → Preflight → Receipt → Mandate → History → Faucet
│   ├── app.js                  # Calls our backend, never calls Cleanverse directly
│   ├── styles.css
│   └── assets/icon.svg
└── data/                    # Runtime JSON storage (gitignored, not source)
    ├── mandate.json
    └── ledger.json
```

**Why a backend at all?** Cleanverse's write/admin endpoints require AES-encrypting the request body with a secret `api-key`. That key can never live in browser JS. The backend is also what makes the mandate and audit ledger *real* — persistent state a single static page can't honestly claim to have.

---

## Run it

```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your Cleanverse APP_ID and API_KEY

npm start
# Server + frontend both served at http://localhost:8787
```

Open `http://localhost:8787` in your browser. Mock mode works immediately with no credentials. Toggle "Live mode" in the sidebar once `.env` has real credentials to call the actual Cleanverse sandbox.

---

## Cleanverse API integration

| Endpoint | Encrypted? | Purpose |
|---|---|---|
| `POST /query_deposit_atoken_list` | No | Load supported tokens and A-Token addresses per chain |
| `POST /query_apass` | No | Check payer and receiver A-Pass profile |
| `POST /verify_apass` | No | Transfer eligibility — the core compliance gate |
| `POST /query_deposit_address` | No | Confirm clean-fund deposit wallet is ready |
| `POST /query_institution_white_list` | No | Verify approved institutional sources |
| `POST /faucet` | No | Mint real testnet tokens, returns a real tx hash |

Write/admin endpoints (`/generate_apass`, `/atoken/*`, `/validator/*`, `/blacklist/add`) are implemented in `cleanverseClient.js` with full AES-256-CBC support per the documented spec, but are out of scope for this MVP's demo flow.

**Encryption spec implemented** (per `docs.cleanverse.com`):
- Algorithm: AES-256-CBC, fixed zero IV
- Key: base64-decoded `api-key`
- Request: `{ "data": "<base64 ciphertext>" }`

---

## Demo flow

1. Load the supplier demo or fill in a payment intent manually
2. (Optional) Adjust the agent's spend mandate — it's enforced server-side on every run
3. Click **Run preflight** — mandate check, A-Token support, A-Pass profile, transfer eligibility, deposit readiness, and institution whitelist all run in sequence against either mock or live Cleanverse data
4. Review PASS / WARN / FAIL badges, each tagged LIVE or MOCK depending on data source
5. Copy the audit receipt, or check **Audit History** to see every past decision persisted
6. (Optional) Use the **Testnet Faucet** panel to request real test tokens with a live tx hash

---

## Security notes

- `.env` (real credentials) is gitignored and was never committed
- The AES `api-key` only ever touches `server/crypto.js`, server-side
- The frontend never sees `api-id` or `api-key` — it only talks to our own `/api/*` routes

---

## Judging notes

- **Real integration, not just a mock demo:** live Cleanverse sandbox calls with graceful mock fallback, visibly tagged in the UI
- **Compliance awareness:** every check maps directly to a Cleanverse primitive (A-Pass, A-Token, deposit whitelist)
- **Agentic depth:** a persistent, enforced spend mandate plus a real audit ledger — not a single-shot form
- **Correct security architecture:** secrets never reach the browser; encryption implemented per spec
- **Commercial path:** reference app → merchant pilots → institutional agent-commerce dashboard

---

## Contact

hammedoye10@gmail.com
