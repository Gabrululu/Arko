# Arko

> Documentation owned by you, verified by Ethereum.

Submission for the [Arkiv Web3 Database Builders Challenge](https://github.com/Arkiv-Network/arkiv-web3-database-builders-challenge) — Knowledge Base vertical.

---

## What makes Arko different

- **You own your docs.** Every space is created by a wallet transaction. Your wallet address is your identity — no platform account that can be suspended, no server that can delete your content.
- **Every save is permanent.** Arko never calls `updateEntity`. Each publish creates a new immutable Arkiv entity with an incremented version number. Old versions accumulate on-chain forever.
- **Prove what your docs said at any block.** Append `?atBlock=21504823` to any doc URL. Arko uses the Arkiv SDK's native `validAtBlock()` query to reconstruct the exact state of that doc at that block — cryptographically provable, impossible to fake.

---

## Quick start

```bash
# 1. Clone and install
git clone <repo-url> && cd arko
npm install

# 2. Get Kaolin testnet ETH
#    → https://kaolin.hoodi.arkiv.network/faucet/

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect MetaMask (Kaolin testnet, chain ID `60138453025`), create a space, and write your first doc.

**Optional — test the data layer without a browser:**

```bash
echo "ARKIV_TEST_PRIVATE_KEY=0x<test-key>" > .env.local
npx tsx scripts/test-arkiv.ts
```

The script creates a space, saves two doc versions, queries them back, and verifies `validAtBlock()` point-in-time querying.

---

## How it works

Arko uses Arkiv as its only data layer — no backend, no database, no external services. Every read is a `publicClient.buildQuery().fetch()` call to the Kaolin node; every write is a `walletClient.createEntity()` signed by the user's wallet. See [ARCHITECTURE.md](./ARCHITECTURE.md) for entity schemas, the immutable versioning pattern, the `validAtBlock` mechanic, and the transport bridge explanation.

---

## Built with

- **Next.js 14** (App Router) — Server Components for reads, Client Components for writes
- **@arkiv-network/sdk v0.6.0** — Kaolin testnet client
- **wagmi v3 + viem** — wallet connection and EIP-1193 transport bridge
- **Tailwind CSS** — styling
- **@uiw/react-md-editor** — live markdown editor
- **next-mdx-remote** — server-side MDX rendering

---

## Routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page — public spaces listing with Suspense streaming |
| `/dashboard` | Client | Wallet-gated spaces list for the connected address |
| `/dashboard/[spaceSlug]` | Dynamic | Space management — docs list, edit links |
| `/dashboard/[spaceSlug]/[docSlug]/edit` | Dynamic | Markdown editor — creates new Arkiv entity on save |
| `/dashboard/[spaceSlug]/collaborators` | Dynamic | Invite wallets as editors; 90-day Arkiv TTL |
| `/docs/[spaceSlug]` | Dynamic | Public space overview — doc index |
| `/docs/[spaceSlug]/[docSlug]` | Dynamic | Doc viewer — supports `?atBlock=N` snapshots |
| `/docs/[spaceSlug]/[docSlug]/history` | Dynamic | Immutable version list — all on-chain versions |
| `/_not-found` | Static | 404 page |
