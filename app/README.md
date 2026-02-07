# App

Next.js 14 frontend for UniPerk. Provides wallet connection, tier tracking, and ENS permission management.

## Pages

- **/** — Landing page with protocol overview
- **/dashboard** — User tier, trade stats, and current permissions
- **/configure** — Form to set ENS agent permissions

## Run

```bash
npm install
npm run dev
```

Requires `NEXT_PUBLIC_WALLETCONNECT_ID` in `.env.local`.
