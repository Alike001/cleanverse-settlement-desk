# Demo Video Script

Target length: 2 to 3 minutes.

## Opening

Say:

Cleanverse Settlement Desk is a payment control desk for AI-agent transactions. The problem is simple: agents can find suppliers and prepare payments, but businesses still need to verify who is being paid, whether the payment rail is allowed, whether funds are coming from approved sources, and whether there is evidence for compliance review.

## Show The App

Action:

Open the deployed Vercel link.

Say:

This is the working dashboard. The first screen is not a landing page. It starts at the real workflow: a payment intent from an AI procurement agent.

## Payment Intent

Action:

Show the default supplier payment:

- Task: Procure shipment inspection service
- Supplier: Zero Hash verified supplier desk
- Chain: Base
- Token: USDC
- Amount: 2500

Say:

Here the agent wants to pay a supplier. Before the payment can move, the app checks it against a server-side spend mandate and Cleanverse verification data.

## Mandate

Action:

Scroll to `Spend mandate`.

Say:

The mandate is the agent's permission boundary. It limits amount, chains, tokens, and payment categories. This is enforced by the backend, not just the form.

## Run Preflight

Action:

Scroll back up and click `Run preflight`.

Say:

The backend now runs the Cleanverse preflight. It checks supported A-Token rails, payer A-Pass, receiver A-Pass, A-Token transfer eligibility, deposit readiness, and the institution whitelist.

## Explain Results

Action:

Point to the PASS cards and LIVE/MOCK tags.

Say:

Each card maps to a Cleanverse primitive. A-Pass answers whether the wallet has verified identity. A-Token support tells us what compliant settlement token is available. The whitelist tells us which institutions can be used as approved deposit sources.

If a live Cleanverse call fails or a credential is unavailable, the app falls back to mock data and labels it clearly. That keeps the demo stable without hiding what is live.

## Audit Receipt

Action:

Scroll to the audit receipt and click `Copy receipt`.

Say:

At the end, the app produces an audit receipt. This is the value for a business or compliance team: they can see the decision, the payment intent, the mandate result, the Cleanverse verification result, and the settlement rail used.

## Audit History

Action:

Scroll to `Audit history`.

Say:

Every run is written to a persistent audit ledger locally. This turns the app from a one-time form into a settlement operations desk.

## Closing

Say:

For Cleanverse, this can become a reference app for verified agent commerce. It shows how A-Pass, A-Token, whitelist checks, and compliance-aware settlement can become a usable workflow for merchants, institutions, and AI-agent builders.

## Final Submission Line

Say:

This is Cleanverse Settlement Desk, built by Hammed Labs for the Trusted AI Agent Transactions track.
