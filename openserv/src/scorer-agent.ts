/**
 * StakeHumanSignal Review Scorer Agent — OpenServ
 *
 * Scores reviews using the same 5-dimension weighted rubric as our Python scorer.
 * Capabilities:
 *   - score_review: Score a single review with heuristic rubric
 *   - score_batch:  Score multiple reviews, return ranked results
 */

import { Agent } from "@openserv-labs/sdk";
import { z } from "zod";

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

/**
 * Heuristic scoring — mirrors api/services/scorer_local.py exactly.
 */
function scoreOutput(
  claim: { reasoning?: string; rubric_scores?: Record<string, number> },
  output: string,
  taskIntent: string,
): {
  correctness: number;
  efficiency: number;
  relevance: number;
  completeness: number;
  reasoning_quality: number;
  verdict: "validated" | "rejected";
  confidence: number;
  summary: string;
} {
  // If claim already has validated rubric scores, use them directly
  const existing = claim.rubric_scores;
  if (existing && typeof existing === "object" && Object.keys(existing).length > 0) {
    const correctness = existing.correctness ?? 0.75;
    const efficiency = existing.efficiency ?? 0.75;
    const relevance = existing.relevance ?? 0.75;
    const completeness = existing.completeness ?? 0.75;
    const reasoning_quality = existing.reasoning_quality ?? 0.75;

    const avg =
      correctness * RUBRIC_WEIGHTS.correctness +
      relevance * RUBRIC_WEIGHTS.relevance +
      completeness * RUBRIC_WEIGHTS.completeness +
      efficiency * RUBRIC_WEIGHTS.efficiency +
      reasoning_quality * RUBRIC_WEIGHTS.reasoning_quality;

    return {
      correctness: round(correctness),
      efficiency: round(efficiency),
      relevance: round(relevance),
      completeness: round(completeness),
      reasoning_quality: round(reasoning_quality),
      verdict: avg > 0.6 ? "validated" : "rejected",
      confidence: round(avg),
      summary: `Rubric-validated score ${Math.round(avg * 100)}%: using claim's own rubric scores`,
    };
  }

  // Heuristic scoring from reasoning text
  const reasoningTerms = (claim.reasoning ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => !STOP_WORDS.has(t) && t.length > 2);

  const outputLower = output.toLowerCase();

  // Relevance: reasoning terms found in output
  const relevance = reasoningTerms.length > 0
    ? reasoningTerms.filter((t) => outputLower.includes(t)).length / reasoningTerms.length
    : 0.5;

  // Completeness: output length proxy (~200 words = complete)
  const wordCount = output.split(/\s+/).length;
  const completeness = Math.min(wordCount / 200, 1.0);

  // Efficiency: penalise very long outputs (>500 words = bloated)
  const efficiency = Math.max(0.5, 1.0 - Math.max(0, wordCount - 200) / 600);

  // Correctness: assume well-formed output is baseline correct
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
    correctness: round(correctness),
    efficiency: round(efficiency),
    relevance: round(relevance),
    completeness: round(completeness),
    reasoning_quality: round(reasoning_quality),
    verdict: avg > 0.6 ? "validated" : "rejected",
    confidence: round(avg),
    summary: `Heuristic score ${Math.round(avg * 100)}%: ${matched}/${reasoningTerms.length} reasoning terms matched`,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// --- Input schemas ---

const ScoreReviewInput = z.object({
  review_text: z.string().describe("The review text to score"),
  task_intent: z.string().describe("What the reviewer was evaluating"),
  reasoning: z.string().optional().describe("Reviewer's reasoning/justification"),
  rubric_scores: z.record(z.number()).optional().describe("Pre-existing rubric scores (0-1 per dimension)"),
});

const ScoreBatchInput = z.object({
  reviews: z.array(
    z.object({
      id: z.string(),
      review_text: z.string(),
      task_intent: z.string(),
      reasoning: z.string().optional(),
      rubric_scores: z.record(z.number()).optional(),
      reviewer_address: z.string().optional(),
      stake_amount: z.number().optional(),
    }),
  ).describe("Array of reviews to score and rank"),
});

// --- Agent creation ---

export function createScorerAgent(): Agent {
  const agent = new Agent({
    systemPrompt: `You are the StakeHumanSignal Review Scorer Agent. You evaluate human-submitted AI reviews using a 5-dimension weighted rubric:

- Correctness (30%): factual accuracy of the review
- Relevance (25%): how well the review addresses the task intent
- Completeness (20%): thoroughness of coverage
- Efficiency (15%): conciseness without losing substance
- Reasoning Quality (10%): logical coherence

Reviews scoring above 60% confidence are VALIDATED. Below 60% are REJECTED.
You are part of a multi-agent system where a coordinator dispatches scoring tasks to you.
Always return structured JSON results.`,
  });

  // Capability 1: Score a single review
  agent.addCapability({
    name: "score_review",
    description:
      "Score a single review using the 5-dimension weighted rubric (correctness, relevance, completeness, efficiency, reasoning_quality). Returns verdict (validated/rejected), confidence, and per-dimension scores.",
    inputSchema: ScoreReviewInput,
    async run({ args }) {
      const claim = {
        reasoning: args.reasoning ?? args.review_text,
        rubric_scores: args.rubric_scores,
      };

      const result = scoreOutput(claim, args.review_text, args.task_intent);

      return JSON.stringify({
        scores: {
          correctness: result.correctness,
          efficiency: result.efficiency,
          relevance: result.relevance,
          completeness: result.completeness,
          reasoning_quality: result.reasoning_quality,
        },
        verdict: result.verdict,
        confidence: result.confidence,
        summary: result.summary,
        task_intent: args.task_intent,
      });
    },
  });

  // Capability 2: Score and rank a batch of reviews
  agent.addCapability({
    name: "score_batch",
    description:
      "Score multiple reviews and return them ranked by confidence score. Each review gets the full 5-dimension rubric treatment. Returns sorted array with scores, verdicts, and rankings.",
    inputSchema: ScoreBatchInput,
    async run({ args }) {
      const scored = args.reviews.map((review) => {
        const claim = {
          reasoning: review.reasoning ?? review.review_text,
          rubric_scores: review.rubric_scores,
        };
        const result = scoreOutput(claim, review.review_text, review.task_intent);

        return {
          id: review.id,
          reviewer_address: review.reviewer_address ?? "unknown",
          stake_amount: review.stake_amount ?? 0,
          scores: {
            correctness: result.correctness,
            efficiency: result.efficiency,
            relevance: result.relevance,
            completeness: result.completeness,
            reasoning_quality: result.reasoning_quality,
          },
          verdict: result.verdict,
          confidence: result.confidence,
          summary: result.summary,
        };
      });

      // Sort by confidence descending
      scored.sort((a, b) => b.confidence - a.confidence);

      const validated = scored.filter((r) => r.verdict === "validated").length;
      const rejected = scored.filter((r) => r.verdict === "rejected").length;

      return JSON.stringify({
        total: scored.length,
        validated,
        rejected,
        ranked_reviews: scored,
        top_review: scored[0] ?? null,
      });
    },
  });

  return agent;
}
