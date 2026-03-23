/**
 * StakeHumanSignal Buyer Coordinator Agent — OpenServ
 *
 * Orchestrates the full review evaluation pipeline:
 *   1. Fetch top reviews from StakeHumanSignal API (x402-gated)
 *   2. Delegate scoring to Scorer Agent via webhook (inter-agent communication)
 *   3. Signal outcomes (complete/reject ERC-8183 jobs)
 *   4. Log decisions for transparency
 *
 * The Scorer Agent lives in its own workspace and is invoked via its webhook
 * endpoint. This is real OpenServ inter-agent communication — the coordinator
 * invokes the scorer's workflow through the platform API.
 *
 * Capabilities:
 *   - fetch_reviews:    Fetch ranked reviews from StakeHumanSignal API
 *   - signal_outcome:   Signal winner to outcomes API (triggers on-chain settlement)
 *   - evaluate_pipeline: Full pipeline — fetch → score (via Scorer Agent) → decide → signal
 */

import { Agent } from "@openserv-labs/sdk";
import { z } from "zod";

const API_BASE = process.env.API_BASE_URL ?? "https://stakesignal-api-production.up.railway.app";

// Scorer Agent webhook — triggers the scorer's workflow via OpenServ platform.
// Reads token from .openserv.json at startup, or falls back to env/hardcoded.
function getScorerWebhookUrl(): string {
  try {
    const fs = require("fs");
    const path = require("path");
    const statePath = path.resolve(process.cwd(), ".openserv.json");
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
      const scorerWf = state.workflows?.["StakeHumanSignal Scorer"];
      if (scorerWf) {
        const wf = Object.values(scorerWf)[0] as { triggerToken?: string } | undefined;
        if (wf?.triggerToken) {
          return `https://api.openserv.ai/webhooks/trigger/${wf.triggerToken}`;
        }
      }
    }
  } catch { /* fallback below */ }
  return process.env.SCORER_WEBHOOK_URL ?? "https://api.openserv.ai/webhooks/trigger/d809ae3b4e1f4e85a933e66763f3313d";
}

const SCORER_WEBHOOK_URL = getScorerWebhookUrl();

// Timeout for scorer agent calls (30s)
const SCORER_TIMEOUT_MS = 30_000;

// --- Stop words for heuristic fallback scoring ---
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "to", "and", "or", "of", "in",
  "for", "on", "at", "by", "with", "was", "are", "be", "has", "had",
  "not", "but", "from", "this", "that",
]);

const RUBRIC_WEIGHTS = {
  correctness: 0.30,
  relevance: 0.25,
  completeness: 0.20,
  efficiency: 0.15,
  reasoning_quality: 0.10,
} as const;

// --- Input schemas ---

const FetchReviewsInput = z.object({
  limit: z.number().optional().default(10).describe("Max reviews to fetch"),
});

const SignalOutcomeInput = z.object({
  job_id: z.number().describe("ERC-8183 job ID"),
  winner_address: z.string().describe("Ethereum address of the winning reviewer"),
  review_id: z.string().describe("Review UUID"),
  score: z.number().describe("Final score (0-100)"),
  reasoning: z.string().describe("Why this review won"),
  rubric_scores: z.record(z.number()).optional().describe("5-dimension rubric scores"),
  outcome_validated: z.boolean().describe("Whether the outcome passed validation"),
});

const EvaluatePipelineInput = z.object({
  limit: z.number().optional().default(10).describe("Max reviews to evaluate"),
  confidence_threshold: z.number().optional().default(0.6).describe("Minimum confidence to validate (0-1)"),
});

// --- Types ---

interface ScoredReview {
  id: string;
  reviewer_address: string;
  scores: Record<string, number>;
  confidence: number;
  verdict: "validated" | "rejected";
  summary: string;
}

interface ScorerWebhookResponse {
  total?: number;
  validated?: number;
  rejected?: number;
  ranked_reviews?: Array<{
    id: string;
    reviewer_address?: string;
    scores: Record<string, number>;
    confidence: number;
    verdict: "validated" | "rejected";
    summary: string;
  }>;
}

// --- Heuristic fallback scoring (only used when Scorer Agent is unreachable) ---

function heuristicScoreReview(review: Record<string, unknown>): ScoredReview {
  const reviewText = String(review.review_text ?? review.output ?? review.reasoning ?? "");
  const taskIntent = String(review.task_intent ?? "");
  const reasoning = String(review.reasoning ?? reviewText);
  const existingRubric = review.rubric_scores as Record<string, number> | undefined;

  // If the review already carries rubric scores, use them
  if (existingRubric && typeof existingRubric === "object" && Object.keys(existingRubric).length > 0) {
    const correctness = existingRubric.correctness ?? 0.75;
    const efficiency = existingRubric.efficiency ?? 0.75;
    const relevance = existingRubric.relevance ?? 0.75;
    const completeness = existingRubric.completeness ?? 0.75;
    const reasoning_quality = existingRubric.reasoning_quality ?? 0.75;

    const avg =
      correctness * RUBRIC_WEIGHTS.correctness +
      relevance * RUBRIC_WEIGHTS.relevance +
      completeness * RUBRIC_WEIGHTS.completeness +
      efficiency * RUBRIC_WEIGHTS.efficiency +
      reasoning_quality * RUBRIC_WEIGHTS.reasoning_quality;

    return {
      id: String(review.id ?? "unknown"),
      reviewer_address: String(review.reviewer_address ?? "unknown"),
      scores: { correctness: r(correctness), efficiency: r(efficiency), relevance: r(relevance), completeness: r(completeness), reasoning_quality: r(reasoning_quality) },
      confidence: r(avg),
      verdict: avg > 0.6 ? "validated" : "rejected",
      summary: `Fallback rubric score ${Math.round(avg * 100)}%: used review's own rubric_scores`,
    };
  }

  // Heuristic term-matching scoring (mirrors scorer-agent.ts / scorer_local.py)
  const reasoningTerms = reasoning
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => !STOP_WORDS.has(t) && t.length > 2);

  const outputLower = reviewText.toLowerCase();

  // Relevance: reasoning terms found in output
  const relevance = reasoningTerms.length > 0
    ? reasoningTerms.filter((t) => outputLower.includes(t)).length / reasoningTerms.length
    : 0.5;

  // Completeness: output length proxy (~200 words = complete)
  const wordCount = reviewText.split(/\s+/).length;
  const completeness = Math.min(wordCount / 200, 1.0);

  // Efficiency: penalise very long outputs (>500 words = bloated)
  const efficiency = Math.max(0.5, 1.0 - Math.max(0, wordCount - 200) / 600);

  // Correctness: baseline assumption for well-formed output
  const correctness = 0.75;

  // Reasoning quality: blend of relevance + completeness
  const reasoning_quality = relevance * 0.7 + completeness * 0.3;

  // Weighted average
  const avg =
    correctness * RUBRIC_WEIGHTS.correctness +
    relevance * RUBRIC_WEIGHTS.relevance +
    completeness * RUBRIC_WEIGHTS.completeness +
    efficiency * RUBRIC_WEIGHTS.efficiency +
    reasoning_quality * RUBRIC_WEIGHTS.reasoning_quality;

  const matched = reasoningTerms.filter((t) => outputLower.includes(t)).length;

  return {
    id: String(review.id ?? "unknown"),
    reviewer_address: String(review.reviewer_address ?? "unknown"),
    scores: { correctness: r(correctness), efficiency: r(efficiency), relevance: r(relevance), completeness: r(completeness), reasoning_quality: r(reasoning_quality) },
    confidence: r(avg),
    verdict: avg > 0.6 ? "validated" : "rejected",
    summary: `Fallback heuristic ${Math.round(avg * 100)}%: ${matched}/${reasoningTerms.length} terms matched`,
  };
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Scorer Agent webhook caller ---

async function callScorerAgent(
  reviews: Array<Record<string, unknown>>,
): Promise<{ scored: ScoredReview[]; source: "scorer_agent" | "fallback"; error?: string }> {
  try {
    const payload = {
      reviews: reviews.map((rev) => ({
        id: String(rev.id ?? "unknown"),
        review_text: String(rev.review_text ?? rev.output ?? rev.reasoning ?? ""),
        task_intent: String(rev.task_intent ?? ""),
        reasoning: String(rev.reasoning ?? ""),
        rubric_scores: rev.rubric_scores ?? undefined,
        reviewer_address: String(rev.reviewer_address ?? "unknown"),
        stake_amount: typeof rev.stake_amount === "number" ? rev.stake_amount : 0,
      })),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCORER_TIMEOUT_MS);

    const resp = await fetch(SCORER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Scorer webhook returned ${resp.status}: ${body}`);
    }

    const data = (await resp.json()) as ScorerWebhookResponse;

    if (data.ranked_reviews && data.ranked_reviews.length > 0) {
      const scored: ScoredReview[] = data.ranked_reviews.map((r) => ({
        id: r.id,
        reviewer_address: r.reviewer_address ?? "unknown",
        scores: r.scores,
        confidence: r.confidence,
        verdict: r.verdict,
        summary: r.summary,
      }));
      return { scored, source: "scorer_agent" };
    }

    // Scorer returned but no ranked_reviews — fall back
    throw new Error("Scorer agent returned empty ranked_reviews");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Fallback: score locally using heuristic
    const scored = reviews.map((rev) => heuristicScoreReview(rev));
    return { scored, source: "fallback", error: errorMsg };
  }
}

// --- Agent creation ---

export function createCoordinatorAgent(): Agent {
  const agent = new Agent({
    systemPrompt: `You are the StakeHumanSignal Buyer Coordinator Agent. You orchestrate a multi-agent review evaluation pipeline:

1. FETCH: Pull ranked reviews from the StakeHumanSignal marketplace API
2. SCORE: Delegate scoring to the Scorer Agent via webhook (inter-agent communication)
3. DECIDE: Validate or reject based on confidence threshold (default >60%)
4. SIGNAL: Submit outcomes on-chain via the outcomes API, which:
   - Completes ERC-8183 jobs
   - Mints ERC-8004 receipt NFTs
   - Distributes Lido wstETH yield
   - Pins decision log to Filecoin

You are the decision maker. You delegate scoring to the Scorer Agent (ID 4043, workspace 13062) and make the final call based on the scorer's output.
API: ${API_BASE}
Network: Base Sepolia (chain 84532)`,
  });

  // Capability 1: Fetch reviews from API
  agent.addCapability({
    name: "fetch_reviews",
    description:
      "Fetch top-ranked reviews from the StakeHumanSignal marketplace API. Returns reviews sorted by retrieval score with task intents, rubric scores, stakes, and Filecoin CIDs.",
    inputSchema: FetchReviewsInput,
    async run({ args }) {
      try {
        const resp = await fetch(`${API_BASE}/reviews/top`, {
          headers: {
            "x-402-payment": "openserv-coordinator-agent",
            "Content-Type": "application/json",
          },
        });

        if (!resp.ok) {
          return JSON.stringify({
            error: `API returned ${resp.status}`,
            reviews: [],
          });
        }

        const data = (await resp.json()) as { reviews?: unknown[] };
        const reviews = (data.reviews ?? []).slice(0, args.limit);

        return JSON.stringify({
          total: reviews.length,
          source: API_BASE,
          reviews,
        });
      } catch (err) {
        return JSON.stringify({
          error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          reviews: [],
        });
      }
    },
  });

  // Capability 2: Signal outcome to API (triggers on-chain settlement)
  agent.addCapability({
    name: "signal_outcome",
    description:
      "Signal a review winner to the StakeHumanSignal outcomes API. Triggers on-chain ERC-8183 job completion, ERC-8004 receipt minting, Lido wstETH yield distribution, and Filecoin log pinning.",
    inputSchema: SignalOutcomeInput,
    async run({ args }) {
      try {
        const resp = await fetch(`${API_BASE}/outcomes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: args.job_id,
            winner_address: args.winner_address,
            review_id: args.review_id,
            score: args.score,
            reasoning: args.reasoning,
            rubric_scores: args.rubric_scores,
            source_claim_id: args.review_id,
            outcome_validated: args.outcome_validated,
          }),
        });

        const result = await resp.json();

        return JSON.stringify({
          status: resp.ok ? "success" : "error",
          http_status: resp.status,
          outcome: result,
        });
      } catch (err) {
        return JSON.stringify({
          status: "error",
          error: `Signal failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
  });

  // Capability 3: Full evaluation pipeline — delegates scoring to Scorer Agent
  agent.addCapability({
    name: "evaluate_pipeline",
    description:
      "Run the full evaluation pipeline: fetch reviews -> delegate scoring to Scorer Agent (via webhook) -> decide (validate/reject) -> signal outcomes. This is the main autonomous operation that coordinates the entire StakeHumanSignal buyer agent workflow. Scoring is performed by the Scorer Agent (ID 4043) with fallback to local heuristic scoring if the scorer is unreachable.",
    inputSchema: EvaluatePipelineInput,
    async run({ args, action }) {
      const log: Array<Record<string, unknown>> = [];
      const timestamp = new Date().toISOString();
      const workspaceId = action?.workspace?.id;
      const taskId = (action as any)?.task?.id;

      log.push({ action: "pipeline_start", timestamp, source: "openserv", workspace_id: workspaceId });

      // Log to OpenServ task if available
      const logToTask = async (message: string) => {
        if (workspaceId && taskId) {
          try {
            await (agent as any).addLogToTask?.({
              workspaceId,
              taskId,
              severity: "info" as const,
              type: "text" as const,
              body: message,
            });
          } catch {
            // Non-critical — silently ignore logging errors
          }
        }
      };

      await logToTask("Pipeline started: fetching reviews...");

      // Step 1: Fetch reviews
      let reviews: Array<Record<string, unknown>> = [];
      try {
        const resp = await fetch(`${API_BASE}/reviews/top`, {
          headers: { "x-402-payment": "openserv-coordinator-agent" },
        });
        if (resp.ok) {
          const data = (await resp.json()) as { reviews?: Array<Record<string, unknown>> };
          reviews = (data.reviews ?? []).slice(0, args.limit);
        }
      } catch (err) {
        log.push({ action: "fetch_error", error: String(err) });
      }

      log.push({ action: "fetch", count: reviews.length });

      if (reviews.length === 0) {
        log.push({ action: "pipeline_end", result: "no_reviews" });
        await logToTask("Pipeline ended: no reviews available");
        return JSON.stringify({ log, decisions: [], summary: "No reviews available" });
      }

      await logToTask(`Fetched ${reviews.length} reviews. Delegating scoring to Scorer Agent...`);

      // Step 2: Delegate scoring to Scorer Agent via webhook
      const scorerResult = await callScorerAgent(reviews);

      log.push({
        action: "scoring_complete",
        source: scorerResult.source,
        scorer_error: scorerResult.error ?? null,
        count: scorerResult.scored.length,
      });

      if (scorerResult.source === "scorer_agent") {
        await logToTask(`Scorer Agent returned ${scorerResult.scored.length} scored reviews`);
      } else {
        await logToTask(`Scorer Agent unavailable (${scorerResult.error}), using fallback heuristic scoring`);
      }

      // Step 3: Apply confidence threshold to make validate/reject decisions
      const decisions: Array<Record<string, unknown>> = [];

      for (const scored of scorerResult.scored) {
        // Re-apply the coordinator's threshold (scorer uses 0.6 default,
        // but coordinator may have a different threshold configured)
        const verdict = scored.confidence > args.confidence_threshold ? "validated" : "rejected";

        const decision = {
          review_id: scored.id,
          reviewer_address: scored.reviewer_address,
          scores: scored.scores,
          confidence: scored.confidence,
          verdict,
          score: Math.round(scored.confidence * 100),
          scoring_source: scorerResult.source,
          scorer_summary: scored.summary,
        };

        decisions.push(decision);

        log.push({
          action: "decision",
          review_id: scored.id,
          verdict,
          confidence: scored.confidence,
          scoring_source: scorerResult.source,
        });

        // Find the original review for job_id and task_intent
        const originalReview = reviews.find((rev) => String(rev.id) === scored.id);

        // Step 4: Signal outcome for validated reviews
        if (verdict === "validated") {
          try {
            const resp = await fetch(`${API_BASE}/outcomes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                job_id: originalReview?.job_id ?? 0,
                winner_address: scored.reviewer_address,
                review_id: scored.id,
                score: decision.score,
                reasoning: `OpenServ pipeline [${scorerResult.source}]: confidence=${scored.confidence} (${Object.entries(scored.scores).map(([k, v]) => `${k}=${v}`).join(", ")})`,
                rubric_scores: scored.scores,
                source_claim_id: scored.id,
                outcome_validated: true,
              }),
            });

            const result = await resp.json();
            log.push({
              action: "signal_outcome",
              review_id: scored.id,
              status: resp.ok ? "success" : "error",
              complete_tx: (result as Record<string, unknown>).complete_tx,
              receipt_token_id: (result as Record<string, unknown>).receipt_token_id,
            });
          } catch (err) {
            log.push({
              action: "signal_error",
              review_id: scored.id,
              error: String(err),
            });
          }
        } else {
          log.push({ action: "reject", review_id: scored.id, confidence: scored.confidence });
        }
      }

      const validated = decisions.filter((d) => d.verdict === "validated").length;
      const rejected = decisions.filter((d) => d.verdict === "rejected").length;

      log.push({
        action: "pipeline_end",
        total: decisions.length,
        validated,
        rejected,
        scoring_source: scorerResult.source,
      });

      const summary = `Evaluated ${decisions.length} reviews via ${scorerResult.source}: ${validated} validated, ${rejected} rejected`;
      await logToTask(summary);

      return JSON.stringify({
        summary,
        scoring_source: scorerResult.source,
        scorer_error: scorerResult.error ?? null,
        decisions,
        log,
        timestamp,
      });
    },
  });

  return agent;
}
