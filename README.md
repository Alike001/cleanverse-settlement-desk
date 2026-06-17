# Cleanverse Settlement Desk

**A control desk that verifies AI-agent payments before money moves.**

**Demo video: [TODO - record before submitting]**

**Live demo: [TODO - paste Vercel URL]**

*Built for Cleanverse Build: Verified Finance Hackathon 2026 - Trusted AI Agent Transactions track. Sponsor target: Cleanverse.*

---

## The Problem

AI agents can source vendors, negotiate terms, and prepare payments, but businesses still need a repeatable answer to one question: is this payment safe to approve, and can we prove why later? A wallet-to-wallet payment is not enough when the transaction depends on verified counterparties, clean deposit sources, and compliance evidence.

## The Solution

Cleanverse Settlement Desk is a payment operations dashboard for agent-driven settlement. It runs a Cleanverse preflight across A-Pass, A-Token, deposit address, transfer eligibility, institution whitelist, and a server-side spend mandate, then writes the result into an audit ledger with a readable receipt.

## Quick Start

```bash
git clone https://github.com/Alike001/cleanverse-settlement-desk.git
cd cleanverse-settlement-desk/server
npm install
cp .env.example .env
npm start
```

Then open `http://localhost:8787`.

Mock mode works without credentials. Live mode needs the Cleanverse hackathon `CLEANVERSE_APP_ID` and `CLEANVERSE_API_KEY` in `server/.env`.

## Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js + Express |
| Sponsor APIs | Cleanverse API v5.2 sandbox |
| Compliance primitives | A-Pass, A-Token, institution whitelist, faucet |
| Security | Server-side credential handling, AES-256-CBC helper for encrypted Cleanverse endpoints |
| Storage | Local JSON audit ledger and mandate store |
| Deployment | Vercel static frontend + serverless API |

## How It Works

```
┌─────────────────────┐
│ Browser dashboard   │
│ Payment intent UI   │
└──────────┬──────────┘
           │ calls /api/preflight
┌──────────▼──────────┐
│ Express API layer   │
│ secrets stay here   │
└──────────┬──────────┘
           │ Cleanverse sandbox calls
┌──────────▼──────────┐
│ Cleanverse stack    │
│ A-Pass + A-Token    │
│ whitelist + faucet  │
└──────────┬──────────┘
           │ result
┌──────────▼──────────┐
│ Audit receipt       │
│ ledger + decision   │
└─────────────────────┘
```

The backend orchestrates the full preflight. It checks the agent mandate first, loads the supported A-Token rail, queries payer and receiver A-Pass profiles, verifies transfer eligibility, fetches a deposit address, checks the institution whitelist, and writes the result into the ledger.

## Cleanverse Integration

| Endpoint | Purpose |
| -------- | ------- |
| `POST /query_deposit_atoken_list` | Resolve supported origin token and A-Token pair |
| `POST /query_apass` | Check payer and receiver A-Pass profile |
| `POST /verify_apass` | Verify whether a wallet can receive or transfer the selected A-Token |
| `POST /query_deposit_address` | Find the Cleanverse deposit wallet for clean-fund routing |
| `POST /query_institution_white_list` | Show approved institutions for deposit sources |
| `POST /faucet` | Request testnet tokens when live sandbox mode is enabled |

The app also includes AES helper support for encrypted Cleanverse write/admin endpoints. Those endpoints are not required for the MVP demo flow, but the backend is structured so they can be added without exposing secrets to the browser.

## Sponsor / Track Alignment

- **Trusted AI Agent Transactions** - The product focuses on a real agent payment approval flow, not a generic transfer screen.
- **Cleanverse A-Pass** - Both payer and receiver are checked for verified identity status before settlement approval.
- **Cleanverse A-Token** - The selected origin token is mapped to the compliant settlement token used for eligibility checks.
- **Cleanverse whitelist** - The UI shows which institutions can be trusted deposit sources for the selected rail.
- **Cleanverse protocol adoption** - The project can become a reference app for agent-commerce builders integrating Cleanverse.

## Security Notes

- Do not commit `server/.env`.
- The real API key is ignored by Git and must stay server-side.
- The browser never receives the Cleanverse App ID or API Key.
- Vercel environment variables should be configured in the Vercel dashboard, not in source code.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Demo Script

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

## Future Roadmap

- Replace local JSON storage with Supabase, Neon, or Vercel Postgres.
- Add wallet connection and signed payment approval.
- Add a merchant onboarding flow using Cleanverse A-Pass registration links.
- Add transaction report download through `download_travel_rule`.
- Package the backend as a Cleanverse developer reference integration.

## Team

- **Hammed Ali Oyeleye** - Frontend developer and Web3 builder - [GitHub](https://github.com/Alike001)

## License

MIT
