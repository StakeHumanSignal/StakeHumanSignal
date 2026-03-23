/**
 * StakeHumanSignal OpenServ Multi-Agent Entry Point
 *
 * Starts the Scorer Agent and Coordinator Agent on OpenServ.
 * Reads per-agent credentials from .openserv.json (created by provision step).
 *
 * Usage:
 *   npx tsx src/index.ts              # Start agents with tunnel
 *   npx tsx src/index.ts --provision  # Provision + start
 */

import "dotenv/config";
import { run } from "@openserv-labs/sdk";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createScorerAgent } from "./scorer-agent.js";
import { createCoordinatorAgent } from "./coordinator-agent.js";

interface OpenServState {
  agents: Record<string, { id: number; apiKey: string; authToken: string }>;
  workflows: Record<string, Record<string, { workspaceId: number; triggerId: string; triggerToken: string }>>;
  userApiKey: string;
}

function loadState(): OpenServState {
  const statePath = resolve(process.cwd(), ".openserv.json");
  if (!existsSync(statePath)) {
    console.error("ERROR: .openserv.json not found. Run provisioning first:");
    console.error("  node --import tsx src/provision.ts");
    process.exit(1);
  }
  return JSON.parse(readFileSync(statePath, "utf-8"));
}

async function main() {
  const mode = process.argv.includes("--provision") ? "provision" : "run";

  console.log("=== StakeHumanSignal × OpenServ ===");
  console.log(`Mode: ${mode}`);
  console.log();

  if (mode === "provision") {
    const { provisionAgents } = await import("./provision.js");
    await provisionAgents();
    console.log("\nProvisioning complete. Now starting agents...\n");
  }

  const state = loadState();

  // --- Scorer Agent ---
  const scorerCreds = state.agents["StakeHumanSignal Scorer"];
  if (!scorerCreds) {
    console.error("ERROR: Scorer agent not found in .openserv.json");
    process.exit(1);
  }

  const scorerAgent = createScorerAgent();
  // Bind provisioned credentials
  (scorerAgent as any).apiKey = scorerCreds.apiKey;
  (scorerAgent as any).authToken = scorerCreds.authToken;

  console.log(`[Scorer] Agent ID: ${scorerCreds.id}`);
  console.log(`[Scorer] API Key: ${scorerCreds.apiKey.slice(0, 8)}...`);
  console.log("[Scorer] Starting on port 7378...");

  try {
    const { stop: stopScorer } = await run(scorerAgent);
    console.log("[Scorer] Connected to OpenServ via tunnel\n");

    // --- Coordinator Agent ---
    const coordCreds = state.agents["StakeHumanSignal Buyer Coordinator"];
    if (!coordCreds) {
      console.error("ERROR: Coordinator agent not found in .openserv.json");
      process.exit(1);
    }

    const coordinatorAgent = createCoordinatorAgent();
    (coordinatorAgent as any).apiKey = coordCreds.apiKey;
    (coordinatorAgent as any).authToken = coordCreds.authToken;

    console.log(`[Coordinator] Agent ID: ${coordCreds.id}`);
    console.log(`[Coordinator] API Key: ${coordCreds.apiKey.slice(0, 8)}...`);
    console.log("[Coordinator] Starting on port 7379...");

    const { stop: stopCoord } = await run(coordinatorAgent, { port: 7379 });
    console.log("[Coordinator] Connected to OpenServ via tunnel");

    // Print summary
    const scorerWf = state.workflows["StakeHumanSignal Scorer"];
    const coordWf = state.workflows["StakeHumanSignal Buyer Coordinator"];

    console.log("\n=== Both agents running ===");
    console.log(`Scorer Agent:      ID ${scorerCreds.id}, port 7378`);
    console.log(`Coordinator Agent: ID ${coordCreds.id}, port 7379`);

    if (scorerWf) {
      const wf = Object.values(scorerWf)[0];
      console.log(`\nScorer webhook: https://api.openserv.ai/workspaces/${wf.workspaceId}/triggers/${wf.triggerId}/fire`);
    }
    if (coordWf) {
      const wf = Object.values(coordWf)[0];
      console.log(`Coordinator webhook: https://api.openserv.ai/workspaces/${wf.workspaceId}/triggers/${wf.triggerId}/fire`);
    }

    console.log("\nPress Ctrl+C to stop\n");

    const shutdown = async () => {
      console.log("\nShutting down agents...");
      await stopScorer();
      await stopCoord();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Keep alive
    await new Promise(() => {});
  } catch (err) {
    console.error("Failed to start agents:", err);
    process.exit(1);
  }
}

main().catch(console.error);
