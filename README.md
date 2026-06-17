# Cleanverse Settlement Desk

Cleanverse Settlement Desk is a payment review desk for AI-agent transactions. It checks whether a proposed payment is allowed before money moves, then records the decision in an audit trail the team can explain to judges, operators, and compliance reviewers.

Built for Cleanverse Build: Verified Finance Hackathon 2026, Trusted AI Agent Transactions track.

## What It Does

- Creates a payment intent for an AI procurement or settlement task
- Runs a server-side preflight against Cleanverse primitives
- Checks A-Pass identity for payer and receiver wallets
- Resolves the compliant A-Token rail for the selected asset and chain
- Checks the agent spend mandate before approval
- Pulls deposit readiness and institution whitelist evidence
- Writes every decision to an audit ledger with a readable receipt

## Why It Matters

AI agents can already find suppliers and prepare payments. The missing layer is trust: who is being paid, whether the route is compliant, and whether there is a record a business can review later. This project turns that missing layer into a working desk instead of a slide deck.

## How It Works

1. The user enters a payment intent.
2. The backend evaluates the intent against the spend mandate.
3. Cleanverse APIs verify the payer and receiver, resolve the settlement rail, and return compliance evidence.
4. The app renders the result as a plain-language audit receipt.
5. The decision is stored in a local ledger so the history stays visible during the demo.

## Cleanverse Integration

The backend is structured around the Cleanverse sandbox and uses the following primitives:

- `query_deposit_atoken_list`
- `query_apass`
- `verify_apass`
- `query_deposit_address`
- `query_institution_white_list`
- `faucet`

The browser never handles the Cleanverse App ID or API key. Those stay on the server.

## Testnet Faucet

The Circle faucet is used to mint testnet assets to a wallet on Monad testnet so the demo can show a real funding flow. In this project, that wallet is just a test address for proving the protocol path and the audit trail. It is not real value.

## Local Setup

```bash
git clone https://github.com/Alike001/cleanverse-settlement-desk.git
cd cleanverse-settlement-desk
npm install
npm start
```

Open `http://localhost:8787` after the server starts.

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express
- Storage: local JSON ledger and mandate store
- Sponsor integration: Cleanverse sandbox APIs

## License

MIT
