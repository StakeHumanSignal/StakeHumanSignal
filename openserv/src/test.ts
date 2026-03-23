/**
 * StakeHumanSignal OpenServ Integration Tests
 *
 * Tests agent capabilities locally without requiring OpenServ platform connection.
 * Validates scoring logic, API fetching, and pipeline orchestration.
 *
 * Usage:
 *   npx tsx src/test.ts
 */

import "dotenv/config";

const API_BASE = process.env.API_BASE_URL ?? "https://stakesignal-api-production.up.railway.app";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// --- Test 1: Scorer Agent capabilities ---

async function testScorerAgent() {
  console.log("\n=== Test: Scorer Agent ===\n");

  const { createScorerAgent } = await import("./scorer-agent.js");
  const agent = createScorerAgent();

  // Check agent was created
  assert(agent !== null, "Scorer agent created");

  // Test score_review capability directly
  // We need to invoke the capability's run function
  const scoreReviewCap = (agent as any).tools?.find(
    (c: any) => c.name === "score_review",
  );
  assert(scoreReviewCap !== undefined, "score_review capability registered");

  const scoreBatchCap = (agent as any).tools?.find(
    (c: any) => c.name === "score_batch",
  );
  assert(scoreBatchCap !== undefined, "score_batch capability registered");

  // Test scoring logic with rubric scores
  if (scoreReviewCap) {
    const mockAction = { workspace: { id: 1 }, task: { id: 1 } };
    const result = await scoreReviewCap.run.call(agent, {
      args: {
        review_text: "Python async error handling is significantly better with policy A due to proper exception chaining",
        task_intent: "code_review",
        reasoning: "async error handling exception chaining Python",
        rubric_scores: {
          correctness: 0.88,
          efficiency: 0.75,
          relevance: 0.92,
          completeness: 0.85,
          reasoning_quality: 0.90,
        },
      },
      action: mockAction,
    }, []);

    const parsed = JSON.parse(result);
    assert(parsed.verdict === "validated", `Rubric review validated (confidence=${parsed.confidence})`);
    assert(parsed.confidence > 0.6, `Confidence above threshold: ${parsed.confidence}`);
    assert(parsed.scores.correctness === 0.88, `Correctness score preserved: ${parsed.scores.correctness}`);
    assert(parsed.scores.relevance === 0.92, `Relevance score preserved: ${parsed.scores.relevance}`);
  }

  // Test scoring with heuristic (no rubric)
  if (scoreReviewCap) {
    const result = await scoreReviewCap.run.call(agent, {
      args: {
        review_text: "This review has some content about the topic and covers main points adequately with reasonable depth and analysis of the key factors involved in the decision making process for selecting the better model output based on several criteria including accuracy completeness and reasoning quality which are all important factors",
        task_intent: "analysis",
        reasoning: "model output accuracy completeness reasoning quality",
      },
      action: { workspace: { id: 1 }, task: { id: 1 } },
    }, []);

    const parsed = JSON.parse(result);
    assert(
      parsed.verdict === "validated" || parsed.verdict === "rejected",
      `Heuristic verdict returned: ${parsed.verdict}`,
    );
    assert(typeof parsed.confidence === "number", `Confidence is a number: ${parsed.confidence}`);
    assert(parsed.summary.includes("Heuristic"), `Summary mentions heuristic: ${parsed.summary.slice(0, 50)}`);
  }

  // Test batch scoring
  if (scoreBatchCap) {
    const result = await scoreBatchCap.run.call(agent, {
      args: {
        reviews: [
          {
            id: "r1",
            review_text: "Excellent async patterns with proper error handling",
            task_intent: "code_review",
            rubric_scores: { correctness: 0.9, efficiency: 0.85, relevance: 0.88, completeness: 0.92, reasoning_quality: 0.87 },
          },
          {
            id: "r2",
            review_text: "Bad review",
            task_intent: "code_review",
            rubric_scores: { correctness: 0.3, efficiency: 0.2, relevance: 0.1, completeness: 0.15, reasoning_quality: 0.1 },
          },
        ],
      },
      action: { workspace: { id: 1 }, task: { id: 1 } },
    }, []);

    const parsed = JSON.parse(result);
    assert(parsed.total === 2, `Batch scored 2 reviews`);
    assert(parsed.validated === 1, `1 validated`);
    assert(parsed.rejected === 1, `1 rejected`);
    assert(parsed.ranked_reviews[0].id === "r1", `Higher scoring review ranked first`);
  }
}

// --- Test 2: Coordinator Agent capabilities ---

async function testCoordinatorAgent() {
  console.log("\n=== Test: Coordinator Agent ===\n");

  const { createCoordinatorAgent } = await import("./coordinator-agent.js");
  const agent = createCoordinatorAgent();

  assert(agent !== null, "Coordinator agent created");

  const fetchCap = (agent as any).tools?.find(
    (c: any) => c.name === "fetch_reviews",
  );
  assert(fetchCap !== undefined, "fetch_reviews capability registered");

  const signalCap = (agent as any).tools?.find(
    (c: any) => c.name === "signal_outcome",
  );
  assert(signalCap !== undefined, "signal_outcome capability registered");

  const pipelineCap = (agent as any).tools?.find(
    (c: any) => c.name === "evaluate_pipeline",
  );
  assert(pipelineCap !== undefined, "evaluate_pipeline capability registered");
}

// --- Test 3: Live API fetch ---

async function testLiveAPIFetch() {
  console.log("\n=== Test: Live API Fetch ===\n");

  try {
    const resp = await fetch(`${API_BASE}/reviews/top`, {
      headers: { "x-402-payment": "openserv-test" },
    });

    assert(resp.ok || resp.status === 402, `API responded: ${resp.status}`);

    if (resp.ok) {
      const data = (await resp.json()) as { reviews?: unknown[] };
      const reviews = data.reviews ?? [];
      assert(reviews.length > 0, `Got ${reviews.length} reviews from live API`);

      const first = reviews[0] as Record<string, unknown>;
      assert(typeof first.id === "string", `Review has id: ${first.id}`);
      assert(typeof first.task_intent === "string", `Review has task_intent: ${first.task_intent}`);
    }
  } catch (err) {
    assert(false, `API reachable`, `Error: ${err}`);
  }
}

// --- Test 4: Full pipeline (live) ---

async function testLivePipeline() {
  console.log("\n=== Test: Live Pipeline ===\n");

  const { createCoordinatorAgent } = await import("./coordinator-agent.js");
  const agent = createCoordinatorAgent();

  const pipelineCap = (agent as any).tools?.find(
    (c: any) => c.name === "evaluate_pipeline",
  );

  if (pipelineCap) {
    const result = await pipelineCap.run.call(agent, {
      args: { limit: 5, confidence_threshold: 0.6 },
      action: { workspace: { id: 1 }, task: { id: 1 } },
    }, []);

    const parsed = JSON.parse(result);
    assert(parsed.log.length > 0, `Pipeline produced ${parsed.log.length} log entries`);
    assert(parsed.decisions.length > 0, `Pipeline made ${parsed.decisions.length} decisions`);
    assert(typeof parsed.summary === "string", `Pipeline summary: ${parsed.summary}`);

    // Verify decisions have required fields
    if (parsed.decisions.length > 0) {
      const d = parsed.decisions[0];
      assert(typeof d.review_id === "string", `Decision has review_id`);
      assert(typeof d.verdict === "string", `Decision has verdict: ${d.verdict}`);
      assert(typeof d.confidence === "number", `Decision has confidence: ${d.confidence}`);
      assert(typeof d.scores === "object", `Decision has scores object`);
    }
  }
}

// --- Test 5: OpenServ SDK import ---

async function testOpenServSDK() {
  console.log("\n=== Test: OpenServ SDK Import ===\n");

  try {
    const { Agent } = await import("@openserv-labs/sdk");
    assert(typeof Agent === "function", "Agent class imported from @openserv-labs/sdk");

    const agent = new Agent({ systemPrompt: "test" });
    assert(agent !== null, "Agent instance created");
  } catch (err) {
    assert(false, "SDK import", `Error: ${err}`);
  }

  try {
    const { provision, triggers } = await import("@openserv-labs/client");
    assert(typeof provision === "function", "provision() imported from @openserv-labs/client");
    assert(typeof triggers === "object", "triggers imported from @openserv-labs/client");
    assert(typeof triggers.webhook === "function", "triggers.webhook() available");
    assert(typeof triggers.x402 === "function", "triggers.x402() available");
    assert(typeof triggers.cron === "function", "triggers.cron() available");
  } catch (err) {
    assert(false, "Client import", `Error: ${err}`);
  }
}

// --- Run all tests ---

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  StakeHumanSignal × OpenServ Integration Tests  ║");
  console.log("╚══════════════════════════════════════════════╝");

  await testOpenServSDK();
  await testScorerAgent();
  await testCoordinatorAgent();
  await testLiveAPIFetch();
  await testLivePipeline();

  console.log(`\n${"═".repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
