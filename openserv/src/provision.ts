/**
 * StakeHumanSignal OpenServ Provisioning
 *
 * Two provisioning modes:
 *
 * Mode 1 (default): Individual agent provisioning
 *   - Scorer: webhook trigger (free, for internal use)
 *   - Coordinator: x402 trigger (paid, real monetization)
 *   Each agent gets its own workspace + workflow + trigger.
 *
 * Mode 2 (--multi-agent): Single-workspace multi-agent pipeline
 *   - Both agents in one workspace with task edges
 *   - x402 trigger → score_reviews → evaluate_and_signal
 *   - Agents can delegate to each other via createTask
 *
 * Usage:
 *   npx tsx src/provision.ts                # Mode 1: individual agents
 *   npx tsx src/provision.ts --multi-agent  # Mode 2: multi-agent pipeline
 */

import "dotenv/config";
import { provision, triggers } from "@openserv-labs/client";
import { createScorerAgent } from "./scorer-agent.js";
import { createCoordinatorAgent } from "./coordinator-agent.js";

const RECEIVER_ADDRESS =
  process.env.RECEIVER_ADDRESS ?? "0x557E1E07652B75ABaA667223B11704165fC94d09";

const X402_PRICE = "0.001"; // USD per request

// ---------------------------------------------------------------------------
// Mode 1: Individual agent provisioning (each in its own workspace)
// ---------------------------------------------------------------------------

export async function provisionIndividual() {
  console.log("=== Mode 1: Individual Agent Provisioning ===\n");

  // 1. Provision Scorer Agent — webhook (free, internal)
  console.log("[1/2] Provisioning Scorer Agent (webhook trigger)...");
  const scorerAgent = createScorerAgent();

  const scorerResult = await provision({
    agent: {
      instance: scorerAgent,
      name: "StakeHumanSignal Scorer",
      description:
        "Scores human-submitted AI reviews using a weighted 5-dimension rubric (correctness, relevance, completeness, efficiency, reasoning_quality). Part of the StakeHumanSignal multi-agent evaluation pipeline.",
    },
    workflow: {
      name: "StakeHumanSignal Review Scoring",
      goal: "Score individual reviews or batches using the 5-dimension weighted rubric and return structured results with verdicts",
      trigger: triggers.webhook({
        waitForCompletion: true,
        timeout: 120,
        name: "Score Reviews",
        description:
          "Submit reviews for scoring via the StakeHumanSignal rubric",
      }),
      task: {
        description:
          "Score the submitted review(s) using the 5-dimension rubric and return structured results with scores, verdict (validated/rejected), and confidence level",
      },
    },
  });

  console.log(`  Agent ID: ${scorerResult.agentId}`);
  console.log(`  Workflow ID: ${scorerResult.workflowId}`);
  console.log(`  Trigger ID: ${scorerResult.triggerId}`);
  console.log(`  API Endpoint: ${scorerResult.apiEndpoint ?? "N/A"}`);
  console.log();

  // 2. Provision Coordinator Agent — x402 (paid, monetized)
  console.log("[2/2] Provisioning Coordinator Agent (x402 trigger)...");
  const coordinatorAgent = createCoordinatorAgent();

  const coordinatorResult = await provision({
    agent: {
      instance: coordinatorAgent,
      name: "StakeHumanSignal Buyer Coordinator",
      description:
        "Autonomous buyer agent that orchestrates the StakeHumanSignal evaluation pipeline: fetches ranked reviews via x402, delegates scoring to the Scorer Agent, makes validate/reject decisions, and signals outcomes on-chain (ERC-8183 completion, ERC-8004 receipts, Lido yield distribution, Filecoin pinning).",
    },
    workflow: {
      name: "StakeHumanSignal Buyer Pipeline",
      goal: "Run the full autonomous evaluation pipeline: fetch reviews -> score -> decide -> signal on-chain outcomes",
      trigger: triggers.x402({
        price: X402_PRICE,
        walletAddress: RECEIVER_ADDRESS,
        name: "Evaluate Reviews (x402)",
        description:
          "Pay-per-request evaluation pipeline. Caller pays via x402 HTTP 402 protocol. Fetches top reviews, scores them, validates/rejects, and signals on-chain.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Max reviews to evaluate (default 10)",
            },
            confidence_threshold: {
              type: "number",
              description: "Min confidence to validate (default 0.6)",
            },
          },
        },
      }),
      task: {
        description:
          "Run the full evaluation pipeline: fetch top reviews from StakeHumanSignal API, score each with 5-dimension rubric, validate or reject based on confidence threshold, and signal outcomes to trigger on-chain settlement",
      },
    },
  });

  console.log(`  Agent ID: ${coordinatorResult.agentId}`);
  console.log(`  Workflow ID: ${coordinatorResult.workflowId}`);
  console.log(`  Trigger ID: ${coordinatorResult.triggerId}`);
  console.log(`  API Endpoint: ${coordinatorResult.apiEndpoint ?? "N/A"}`);
  if (coordinatorResult.paywallUrl) {
    console.log(`  Paywall URL: ${coordinatorResult.paywallUrl}`);
  }

  console.log("\n=== Individual Provisioning Complete ===");
  console.log("Results saved to .openserv.json (idempotent — safe to re-run)");
  console.log(`\nScorer webhook:    ${scorerResult.apiEndpoint}`);
  console.log(`Coordinator x402:  ${coordinatorResult.apiEndpoint}`);

  return { scorerResult, coordinatorResult };
}

// ---------------------------------------------------------------------------
// Mode 2: Multi-agent pipeline (single workspace, task edges)
// ---------------------------------------------------------------------------

export async function provisionMultiAgent() {
  console.log("=== Mode 2: Multi-Agent Pipeline Provisioning ===\n");

  // First, provision the scorer so we get its agentId
  console.log("[1/2] Provisioning Scorer Agent (for multi-agent workspace)...");
  const scorerAgent = createScorerAgent();

  const scorerResult = await provision({
    agent: {
      instance: scorerAgent,
      name: "StakeHumanSignal Scorer",
      description:
        "Scores human-submitted AI reviews using a weighted 5-dimension rubric (correctness, relevance, completeness, efficiency, reasoning_quality).",
    },
    workflow: {
      name: "StakeHumanSignal Scorer (standalone)",
      goal: "Score reviews with the 5-dimension rubric",
      trigger: triggers.webhook({
        waitForCompletion: true,
        timeout: 120,
        name: "Score Reviews (standalone)",
        description: "Direct scoring endpoint for internal use",
      }),
      task: {
        description: "Score submitted reviews and return structured results",
      },
    },
  });

  console.log(`  Scorer Agent ID: ${scorerResult.agentId}`);
  console.log();

  // Now provision the coordinator with both agents in the same workflow
  console.log("[2/2] Provisioning Multi-Agent Workflow...");
  const coordinatorAgent = createCoordinatorAgent();

  const multiAgentResult = await provision({
    agent: {
      instance: coordinatorAgent,
      name: "StakeHumanSignal Buyer Coordinator",
      description:
        "Orchestrates the full evaluation pipeline: delegates scoring to the Scorer Agent, makes validate/reject decisions, and signals outcomes on-chain.",
    },
    workflow: {
      name: "StakeHumanSignal Multi-Agent Pipeline",
      goal: "Evaluate reviews via multi-agent scoring and on-chain settlement",
      trigger: triggers.x402({
        price: X402_PRICE,
        walletAddress: RECEIVER_ADDRESS,
        name: "StakeHumanSignal Pipeline (x402)",
        description:
          "Pay-per-request multi-agent evaluation. Scorer agent scores reviews, coordinator evaluates and signals on-chain.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Max reviews to evaluate (default 10)",
            },
            confidence_threshold: {
              type: "number",
              description: "Min confidence to validate (default 0.6)",
            },
          },
        },
      }),
      tasks: [
        {
          name: "score_reviews",
          description:
            "Score all submitted reviews using the 5-dimension rubric (correctness, relevance, completeness, efficiency, reasoning_quality). Return structured JSON with scores, verdict, and confidence for each review.",
          agentId: scorerResult.agentId,
        },
        {
          name: "evaluate_and_signal",
          description:
            "Evaluate scored reviews against confidence threshold, make validate/reject decisions, and signal outcomes for on-chain settlement (ERC-8183 completion, ERC-8004 receipts, Lido yield distribution, Filecoin pinning).",
        },
      ],
      edges: [
        { from: "trigger:x402", to: "task:score_reviews" },
        { from: "task:score_reviews", to: "task:evaluate_and_signal" },
      ],
    },
  });

  console.log(`  Coordinator Agent ID: ${multiAgentResult.agentId}`);
  console.log(`  Workflow ID: ${multiAgentResult.workflowId}`);
  console.log(`  Trigger ID: ${multiAgentResult.triggerId}`);
  console.log(`  API Endpoint: ${multiAgentResult.apiEndpoint ?? "N/A"}`);
  if (multiAgentResult.paywallUrl) {
    console.log(`  Paywall URL: ${multiAgentResult.paywallUrl}`);
  }

  console.log("\n=== Multi-Agent Provisioning Complete ===");
  console.log("Both agents share a workspace — createTask delegation works.");
  console.log("Results saved to .openserv.json (idempotent — safe to re-run)");
  console.log(`\nScorer Agent ID:     ${scorerResult.agentId}`);
  console.log(`Coordinator Agent ID: ${multiAgentResult.agentId}`);
  console.log(`Pipeline endpoint:    ${multiAgentResult.apiEndpoint}`);
  console.log(`x402 price:           $${X402_PRICE} per request`);
  console.log(`Receiver wallet:      ${RECEIVER_ADDRESS}`);

  return { scorerResult, multiAgentResult };
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

const isMain =
  process.argv[1]?.endsWith("provision.ts") ||
  process.argv[1]?.endsWith("provision.js");

if (isMain) {
  const multiAgent = process.argv.includes("--multi-agent");

  const run = multiAgent ? provisionMultiAgent : provisionIndividual;

  run().catch((err) => {
    console.error("Provisioning failed:", err);
    process.exit(1);
  });
}
