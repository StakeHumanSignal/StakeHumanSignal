/**
 * Register StakeHumanSignal Buyer Agent on ERC-8004 via OpenServ
 *
 * Mints an Agent Identity NFT on Base mainnet with:
 *   - Agent Card on IPFS (name, description, services/endpoints)
 *   - On-chain binding (tokenURI → IPFS CID)
 *   - Discoverable at 8004scan.io
 *
 * Usage:
 *   npx tsx src/register-erc8004.ts
 *
 * Requirements:
 *   - PRIVATE_KEY with ETH on Base mainnet for gas
 *   - .openserv.json from provision step (has workflowId)
 */

import "dotenv/config";
import { PlatformClient } from "@openserv-labs/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

async function registerOnERC8004() {
  console.log("=== ERC-8004 Agent Identity Registration ===\n");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("ERROR: PRIVATE_KEY not set. Needed for gas on Base mainnet.");
    process.exit(1);
  }

  // Read .openserv.json for workflow ID
  const statePath = resolve(process.cwd(), ".openserv.json");
  if (!existsSync(statePath)) {
    console.error("ERROR: .openserv.json not found. Run `npx tsx src/provision.ts` first.");
    process.exit(1);
  }

  const state = JSON.parse(readFileSync(statePath, "utf-8"));

  // Find the coordinator workflow ID
  const workflows = Object.values(state.workflows ?? {}) as Array<Record<string, unknown>>;
  const coordinatorWorkflow = workflows.find(
    (w) => typeof w.name === "string" && w.name.includes("Buyer"),
  );

  if (!coordinatorWorkflow) {
    console.error("ERROR: Coordinator workflow not found in .openserv.json");
    process.exit(1);
  }

  const workflowId = coordinatorWorkflow.id as number;
  console.log(`Found Coordinator Workflow ID: ${workflowId}`);

  // Create authenticated client
  const client = new PlatformClient();
  await client.authenticate(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);

  console.log("Authenticated with wallet\n");

  // Register on ERC-8004
  console.log("Registering agent on ERC-8004 (Base mainnet)...");
  console.log("This mints an NFT and uploads Agent Card to IPFS.\n");

  try {
    const result = await client.erc8004.registerOnChain({
      workflowId,
      privateKey: privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
      name: "StakeHumanSignal Buyer Agent",
      description:
        "Autonomous multi-agent buyer that evaluates staked human reviews via 5-dimension rubric scoring, coordinates with scorer agents, and settles outcomes on-chain with ERC-8183 jobs, ERC-8004 receipts, Lido wstETH yield, and Filecoin storage.",
      chainId: 8453,
      rpcUrl: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    });

    console.log("=== Registration Successful ===\n");
    console.log(`Agent ID:       ${result.agentId}`);
    console.log(`IPFS CID:       ${result.ipfsCid}`);
    console.log(`TX Hash:        ${result.txHash}`);
    console.log(`Agent Card:     ${result.agentCardUrl}`);
    console.log(`Block Explorer: ${result.blockExplorerUrl}`);
    console.log(`8004scan:       ${result.scanUrl}`);

    return result;
  } catch (err) {
    console.error("ERC-8004 registration failed:", err);
    console.log("\nThis is expected if:");
    console.log("  1. Wallet has insufficient ETH on Base mainnet for gas");
    console.log("  2. Network connectivity issues");
    console.log("  3. Already registered (check .openserv.json)");
    process.exit(1);
  }
}

// Run directly
registerOnERC8004().catch(console.error);
