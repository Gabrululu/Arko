# Arko — Architecture

## No external database

Every read in Arko is a `publicClient.buildQuery().fetch()` call that issues an `arkiv_query` JSON-RPC request to the Kaolin node. Every write is a `walletClient.createEntity()` call that sends a signed transaction to the on-chain Arkiv contract. There is no Postgres, no Redis, no Supabase, no S3, and no custom backend service of any kind. The Kaolin node is the only infrastructure the app depends on, and it is public — anyone can query it without authentication or an API key. Server Components call `publicClient` directly at render time; Client Components call `createSigningClient` after the user connects their wallet.

---

## Entity schemas

Three entity types. All queryable fields live in attributes; content blobs live in the payload.

### `space` — top-level container

```ts
// lib/arkiv/spaces.ts — createSpace()
await walletClient.createEntity({
  payload: jsonToPayload({ name: string, description: string }),
  contentType: "application/json",
  attributes: [
    { key: "type",       value: "space" },
    { key: "owner",      value: "0x…"   },  // wallet address of creator
    { key: "slug",       value: "my-protocol" }, // URL segment: /docs/my-protocol
    { key: "visibility", value: "public" },  // "public" | "private"
  ],
  expiresIn: ExpirationTime.fromDays(365),
});
```

### `doc` — immutable version

```ts
// lib/arkiv/docs.ts — saveDoc()
await walletClient.createEntity({
  payload: jsonToPayload({ title: string, content: string }), // content = full Markdown
  contentType: "application/json",
  attributes: [
    { key: "type",        value: "doc" },
    { key: "spaceId",     value: "<space entityKey>" }, // foreign key
    { key: "slug",        value: "getting-started" },
    { key: "version",     value: "3" },         // monotonically increasing integer
    { key: "author",      value: "0x…" },        // wallet address of the saver
    { key: "status",      value: "published" },  // "published" | "draft"
    { key: "blockNumber", value: "21504823" },   // Kaolin block at save time
  ],
  expiresIn: ExpirationTime.fromDays(365),
});
```

### `collaborator` — time-limited access grant

```ts
// lib/arkiv/collaborators.ts — addCollaborator()
await walletClient.createEntity({
  payload: new Uint8Array(0), // intentionally empty — all data is in attributes
  contentType: "application/json",
  attributes: [
    { key: "type",    value: "collaborator" },
    { key: "spaceId", value: "<space entityKey>" },
    { key: "wallet",  value: "0x…" },    // grantee address (lowercased)
    { key: "role",    value: "editor" }, // "editor" | "viewer"
  ],
  expiresIn: ExpirationTime.fromDays(90), // TTL enforced by Arkiv
});
```

The empty collaborator payload is intentional: Arkiv queries filter on attributes, not payload content. Every field that needs to be queried lives in attributes.

---

## Immutable versioning

`updateEntity` is never called on a doc. Every save — draft or publish — goes through `saveDoc()`, which always calls `createEntity`. The version number is managed by the app:

```
getNextVersion(spaceId, slug)
  └─ getDocVersions(spaceId, slug)   // queries all doc entities for this slug
       └─ returns max(version) + 1   // or 1 if no versions exist yet

saveDoc(walletClient, { ..., version: nextVersion, ... })
  └─ walletClient.createEntity(...)  // NEW entity, version N+1
```

Old versions are never deleted — they accumulate on-chain permanently. `getLatestDoc` picks the highest-versioned published entity for a given `spaceId + slug` pair by fetching all matches and reducing client-side on `version`. This design uses Arkiv as an append-only log, not a key-value store.

---

## Point-in-time snapshots (`validAtBlock`)

When a user visits `/docs/my-space/getting-started?atBlock=21504823`, the page calls `getDocAtBlock()` instead of `getLatestDoc()`:

```ts
// lib/arkiv/docs.ts — getDocAtBlock()
const result = await publicClient
  .buildQuery()
  .where([
    eq("type", "doc"),
    eq("spaceId", spaceId),
    eq("slug", slug),
    eq("status", "published"),
  ])
  .validAtBlock(BigInt(atBlock))  // SDK-native point-in-time query
  .withAttributes(true)
  .withPayload(true)
  .fetch();
```

`validAtBlock(N)` is a `QueryBuilder` method that instructs the Arkiv node to answer as of block N — entities created after that block are excluded, and entities that had already expired by then are also excluded. This is a server-side operation on the Arkiv node, not client-side filtering. The result is reduced to the highest-versioned doc visible at that block, giving the canonical answer to "what did this doc say at block 21504823?"

This is impossible to fake on a centralized platform. A traditional documentation service can silently edit or delete any historical version. Arko's versions are on-chain transactions — the existence and content of every version is cryptographically committed to the Kaolin chain. `validAtBlock()` is not a feature; it is a proof.

---

## Transport bridge

`createSigningClient` wraps the wagmi `WalletClient` using `custom(viemWalletClient.transport)` rather than `http(rpcUrl)`. The distinction matters because browser wallets use "json-rpc" accounts: they sign by routing `eth_sendTransaction` through the wallet's own EIP-1193 provider (`window.ethereum`), not through an HTTP endpoint. If we passed `http(rpcUrl)`, viem would send the raw unsigned transaction directly to the Arkiv RPC node, which cannot sign on the user's behalf — the MetaMask popup would never appear.

By passing `custom(viemWalletClient.transport)`, every RPC call is proxied through the wagmi transport that wraps `window.ethereum`. This means `sendTransaction` triggers the MetaMask confirmation popup, and `waitForTransactionReceipt` resolves through `window.ethereum` as well. The read side (`publicClient`) continues to use a plain `http()` transport, because Arkiv-specific methods like `arkiv_query` are available on the Kaolin node but not through MetaMask.

---

## Data flow diagram

```
                        ┌─────────────────────────────┐
                        │     Browser (MetaMask)       │
                        │  window.ethereum (EIP-1193)  │
                        └────────────┬────────────────┘
                                     │ useWalletClient() [wagmi]
                                     ▼
                        ┌─────────────────────────────┐
                        │     createSigningClient()    │
                        │  custom(wagmiWallet.transport)│
                        └────────────┬────────────────┘
                                     │ walletClient.createEntity()
                                     │ → eth_sendTransaction
                                     │ → MetaMask popup → user signs
                                     ▼
                        ┌─────────────────────────────┐
                        │        Kaolin testnet        │
                        │      (Arkiv contract)        │
                        │   entities stored on-chain   │
                        └────────────┬────────────────┘
                                     │
               ┌─────────────────────┘
               │ publicClient.buildQuery().fetch()
               │ http("https://kaolin.hoodi.arkiv.network/rpc")
               │ → arkiv_query JSON-RPC
               ▼
  ┌────────────────────────────┐
  │  Next.js Server Component  │
  │  (spaces, docs, history)   │
  │  → rendered HTML to browser│
  └────────────────────────────┘
```
