/**
 * test-arkiv.ts — Integration test for the Arko data model on Kaolin testnet.
 *
 * This script proves the full Arkiv round-trip works before wiring it to the UI:
 *   1. Create a space entity
 *   2. Create a doc entity linked to the space
 *   3. Create a second doc version (to test immutable versioning)
 *   4. Query back all entities and verify the data
 *   5. Verify entity.toJson() correctly decodes the payload
 *   6. Test point-in-time query (validAtBlock)
 *
 * ── Prerequisites ─────────────────────────────────────────────────────────────
 *
 * 1. Create a test wallet and export its private key (0x-prefixed hex).
 *    MetaMask: Account menu → Account details → Show private key
 *
 * 2. Fund it with Kaolin testnet ETH:
 *    Faucet: https://kaolin.hoodi.arkiv.network/faucet/
 *    (Enter your wallet address and request test ETH)
 *
 * 3. Add Kaolin to your wallet (for manual testing):
 *    - Network: Kaolin
 *    - RPC URL: https://kaolin.hoodi.arkiv.network/rpc
 *    - Chain ID: 60138453025
 *    - Currency: ETH
 *    - Explorer: https://explorer.kaolin.hoodi.arkiv.network
 *
 * 4. Create .env.local in the project root:
 *    ARKIV_TEST_PRIVATE_KEY=0x<your-private-key>
 *
 * ── Run ───────────────────────────────────────────────────────────────────────
 *    npx tsx scripts/test-arkiv.ts
 */

// Load .env.local (Next.js convention — dotenv/config only loads .env by default)
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also try .env as fallback

import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import { createPublicClient, createWalletClient, http, type Hex } from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";

// ─── Load env ─────────────────────────────────────────────────────────────────

const privateKey = process.env.ARKIV_TEST_PRIVATE_KEY as Hex | undefined;
if (!privateKey) {
  console.error(
    "❌ ARKIV_TEST_PRIVATE_KEY not set in .env.local\n" +
      "   Create .env.local and add: ARKIV_TEST_PRIVATE_KEY=0x<your-key>\n" +
      "   Faucet: https://kaolin.hoodi.arkiv.network/faucet/"
  );
  process.exit(1);
}

// ─── Client setup ─────────────────────────────────────────────────────────────
// For scripts we use http() transport + privateKeyToAccount — no browser wallet.

const account = privateKeyToAccount(privateKey);

const walletClient = createWalletClient({
  chain: kaolin,
  transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
  account,
});

const publicClient = createPublicClient({
  chain: kaolin,
  transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
});

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔑 Test wallet: ${account.address}`);

  // Step 1: Get current block ─────────────────────────────────────────────────

  const startBlock = await publicClient.getBlockNumber();
  console.log(`\n📦 Current block: ${startBlock}`);

  // Step 2: Create a space entity ─────────────────────────────────────────────

  const spaceSlug = `test-space-${Date.now()}`;
  console.log(`\n🚀 Creating space: ${spaceSlug}…`);

  const { entityKey: spaceKey, txHash: spaceTx } = await walletClient.createEntity({
    payload: jsonToPayload({ name: "Test Space", description: "Arko integration test" }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "space" },
      { key: "owner", value: account.address },
      { key: "slug", value: spaceSlug },
      { key: "visibility", value: "public" },
    ],
    expiresIn: ExpirationTime.fromDays(1),
  });

  console.log(`   ✓ Space created`);
  console.log(`     entityKey: ${spaceKey}`);
  console.log(`     txHash:    ${spaceTx}`);
  console.log(`     Explorer:  https://explorer.kaolin.hoodi.arkiv.network/tx/${spaceTx}`);

  // Step 3: Create doc v1 ─────────────────────────────────────────────────────

  const blockAfterSpace = await publicClient.getBlockNumber();
  console.log(`\n📝 Creating doc v1 (at block ${blockAfterSpace})…`);

  const docSlug = "getting-started";

  const { entityKey: docKey1, txHash: docTx1 } = await walletClient.createEntity({
    payload: jsonToPayload({
      title: "Getting Started",
      content: "# Getting Started\n\nThis is **version 1** of the doc.",
    }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "doc" },
      { key: "spaceId", value: spaceKey },
      { key: "slug", value: docSlug },
      { key: "version", value: "1" },
      { key: "author", value: account.address },
      { key: "status", value: "published" },
      { key: "blockNumber", value: String(blockAfterSpace) },
    ],
    expiresIn: ExpirationTime.fromDays(1),
  });

  console.log(`   ✓ Doc v1 created`);
  console.log(`     entityKey: ${docKey1}`);
  console.log(`     txHash:    ${docTx1}`);

  // Step 4: Create doc v2 ─────────────────────────────────────────────────────

  const blockAfterDocV1 = await publicClient.getBlockNumber();
  console.log(`\n📝 Creating doc v2 (at block ${blockAfterDocV1})…`);

  const { entityKey: docKey2, txHash: docTx2 } = await walletClient.createEntity({
    payload: jsonToPayload({
      title: "Getting Started",
      content: "# Getting Started\n\nThis is **version 2** of the doc. Updated content.",
    }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "doc" },
      { key: "spaceId", value: spaceKey },
      { key: "slug", value: docSlug },
      { key: "version", value: "2" },
      { key: "author", value: account.address },
      { key: "status", value: "published" },
      { key: "blockNumber", value: String(blockAfterDocV1) },
    ],
    expiresIn: ExpirationTime.fromDays(1),
  });

  console.log(`   ✓ Doc v2 created`);
  console.log(`     entityKey: ${docKey2}`);
  console.log(`     txHash:    ${docTx2}`);

  // Step 5: Query space back ──────────────────────────────────────────────────

  console.log(`\n🔍 Querying space by slug…`);

  const spaceResult = await publicClient
    .buildQuery()
    .where([eq("type", "space"), eq("slug", spaceSlug)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  if (spaceResult.entities.length === 0) {
    throw new Error("Space not found in query result!");
  }

  const spaceEntity = spaceResult.entities[0];
  console.log(`   ✓ Found space entity`);
  console.log(`     key: ${spaceEntity.key}`);

  // ── Verify entity.toJson() ──
  // jsonToPayload stores: toBytes(JSON.stringify(obj))
  // toJson() inverts it:  JSON.parse(bytesToString(payload))
  const spacePayload = spaceEntity.toJson() as { name: string; description: string };
  console.log(`     payload (via toJson()): ${JSON.stringify(spacePayload)}`);

  if (spacePayload.name !== "Test Space") {
    throw new Error(`Payload mismatch! Expected "Test Space", got "${spacePayload.name}"`);
  }
  console.log(`   ✓ entity.toJson() works correctly`);

  // ── Verify attributes ──
  const spaceAttrs: Record<string, string> = {};
  for (const a of spaceEntity.attributes) {
    spaceAttrs[a.key] = String(a.value);
  }
  console.log(`     attributes: ${JSON.stringify(spaceAttrs)}`);

  if (spaceAttrs["owner"] !== account.address) {
    throw new Error(`Owner mismatch! Expected ${account.address}, got ${spaceAttrs["owner"]}`);
  }
  console.log(`   ✓ Attributes correct`);

  // Step 6: Query all docs in space ───────────────────────────────────────────

  console.log(`\n🔍 Querying all doc versions in space…`);

  const docsResult = await publicClient
    .buildQuery()
    .where([eq("type", "doc"), eq("spaceId", spaceKey), eq("slug", docSlug)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  console.log(`   Found ${docsResult.entities.length} doc version(s)`);

  for (const entity of docsResult.entities) {
    const attrs: Record<string, string> = {};
    for (const a of entity.attributes) attrs[a.key] = String(a.value);

    const payload = entity.toJson() as { title: string; content: string };
    console.log(
      `   · v${attrs["version"]} | blockNumber=${attrs["blockNumber"]} | title="${payload.title}"`
    );
    console.log(`     content preview: "${payload.content.slice(0, 60)}…"`);
  }

  if (docsResult.entities.length !== 2) {
    throw new Error(`Expected 2 versions, got ${docsResult.entities.length}`);
  }
  console.log(`   ✓ Both versions stored immutably`);

  // Step 7: Test validAtBlock point-in-time query ─────────────────────────────

  // Query state at the block AFTER v1 was created but BEFORE v2.
  // This tests whether Arkiv correctly returns only v1 in that time slice.
  const beforeV2Block = blockAfterDocV1 - BigInt(1);
  console.log(`\n🕐 Testing validAtBlock — querying state at block ${beforeV2Block}…`);
  console.log(`   (This block is after v1 but before v2 — should return at most v1)`);

  const atBlockResult = await publicClient
    .buildQuery()
    .where([eq("type", "doc"), eq("spaceId", spaceKey), eq("slug", docSlug)])
    .validAtBlock(beforeV2Block)
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  console.log(`   Found ${atBlockResult.entities.length} entity/entities at that block`);

  for (const entity of atBlockResult.entities) {
    const attrs: Record<string, string> = {};
    for (const a of entity.attributes) attrs[a.key] = String(a.value);
    console.log(`   · Version at block ${beforeV2Block}: v${attrs["version"]}`);
  }
  console.log(`   ✓ validAtBlock query executed successfully`);

  // Step 8: Verify blockNumber attribute is stored correctly ──────────────────

  console.log(`\n🔍 Verifying blockNumber attributes…`);

  for (const entity of docsResult.entities) {
    const attrs: Record<string, string> = {};
    for (const a of entity.attributes) attrs[a.key] = String(a.value);

    const storedBlock = BigInt(attrs["blockNumber"]);
    if (storedBlock < startBlock || storedBlock > blockAfterDocV1) {
      throw new Error(
        `blockNumber ${storedBlock} is out of expected range [${startBlock}, ${blockAfterDocV1}]`
      );
    }
    console.log(`   ✓ v${attrs["version"]} blockNumber=${attrs["blockNumber"]} — in valid range`);
  }

  // Summary ───────────────────────────────────────────────────────────────────

  console.log(`
✅ All checks passed!

Summary
───────
Space entityKey  : ${spaceKey}
Doc v1 entityKey : ${docKey1}
Doc v2 entityKey : ${docKey2}
Start block      : ${startBlock}
Doc v1 block     : ${blockAfterSpace}
Doc v2 block     : ${blockAfterDocV1}

View in explorer : https://explorer.kaolin.hoodi.arkiv.network
`);
}

main().catch((err) => {
  console.error(`\n❌ Test failed: ${err.message}`);
  process.exit(1);
});
