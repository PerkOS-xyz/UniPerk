# App

Next.js 14 frontend for UniPerk. Provides wallet connection, tier tracking, and ENS permission management.

## Pages

- **/** — Landing page with protocol overview
- **/dashboard** — User tier, trade stats, and permissions (subdomain or CTA to register)
- **/register** — Claim a subdomain (e.g. you.uniperk.eth) via gateway; no gas
- **/configure** — Set agent permissions for your subdomain (offchain via gateway API)

## Run

```bash
npm install
npm run dev
```

## Env

- `NEXT_PUBLIC_WALLETCONNECT_ID` — WalletConnect project id (optional, default `demo`).
- `NEXT_PUBLIC_GATEWAY_API_URL` — Base URL of the ENS gateway (e.g. `https://uniperk-ens-gateway.xxx.workers.dev`). Required for subdomain registration and permission updates.
