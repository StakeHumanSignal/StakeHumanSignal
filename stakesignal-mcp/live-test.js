/**
 * StakeHumanSignal MCP — Live Integration Test
 * Calls every tool handler against the real Railway API.
 * No mocks. Real responses.
 */

const API = process.env.STAKESIGNAL_API || "https://stakesignal-api-production.up.railway.app";

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`\n✓ ${name}`);
    console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
    passed++;
  } catch (e) {
    console.log(`\n✗ ${name} — FAILED`);
    console.log(`  Error: ${e.message?.slice(0, 200)}`);
    failed++;
  }
}

console.log("=== STAKESIGNAL MCP LIVE TEST ===");
console.log(`API: ${API}\n`);

// Tool 1: get_ranked_reviews
await test("get_ranked_reviews (with x402 header)", async () => {
  const r = await fetch(`${API}/reviews/top`, {
    headers: { "x-402-payment": "mcp-stakesignal-agent" }
  });
  if (r.status === 402) throw new Error("Got 402 — x402 header not accepted");
  const data = await r.json();
  const reviews = (data.reviews || data || []).slice(0, 3);
  if (reviews.length === 0) throw new Error("No reviews returned");
  return reviews.map(rv => ({
    id: rv.id,
    task_intent: rv.task_intent?.slice(0, 50),
    stake: rv.stake_amount,
    score: rv.score,
  }));
});

// Tool 2: submit_passive_selection
await test("submit_passive_selection", async () => {
  const r = await fetch(`${API}/sessions/passive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preferred_review_id: "test-live-mcp",
      context: "Live test from stakesignal-mcp — testing passive signal recording"
    })
  });
  const data = await r.json();
  if (!data.recorded) throw new Error("Passive selection not recorded: " + JSON.stringify(data));
  return data;
});

// Tool 3: stake_on_review (NOW REAL — posts to /reviews)
await test("stake_on_review (posts to live API)", async () => {
  const r = await fetch(`${API}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reviewer_address: "0xMCPLiveTest000000000000000000000000000000",
      api_url: "https://stakesignal-mcp/live-test",
      review_text: "Live test stake from stakesignal-mcp",
      stake_amount: 1.0,
      stake_tx_hash: "0xmcp-live-test-" + Date.now().toString(16),
      task_intent: "mcp live integration test",
      task_type: "analysis",
      winner: "policy_a",
      reasoning: "Testing that stake_on_review actually hits the API",
      rubric_scores: { correctness: 0.8, relevance: 0.8, completeness: 0.8, efficiency: 0.8, reasoning_quality: 0.8 },
    })
  });
  const data = await r.json();
  if (!data.id) throw new Error("No review ID returned: " + JSON.stringify(data));
  return {
    review_id: data.id,
    filecoin_cid: data.filecoin_cid,
    stake_amount: data.stake_amount,
    stored: data.filecoin_cid?.startsWith("Qm") ? "REAL Lighthouse CID" : data.filecoin_cid?.startsWith("bafk") ? "REAL FOC CID" : "local fallback",
  };
});

// Tool 4: get_leaderboard
await test("get_leaderboard", async () => {
  const r = await fetch(`${API}/leaderboard`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error("Leaderboard not an array: " + typeof data);
  return data.slice(0, 3).map(rv => ({
    reviewer: rv.reviewer_address?.slice(0, 10) + "...",
    wins: rv.wins,
    total_jobs: rv.total_jobs,
    win_rate: rv.win_rate,
  }));
});

// Tool 5: check_agent_decisions
await test("check_agent_decisions (last 3)", async () => {
  const r = await fetch(`${API}/agent/log`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error("Agent log not an array");
  const last3 = data.slice(-3);
  return last3.map(entry => ({
    action: entry.action,
    message: entry.message?.slice(0, 60),
    timestamp: entry.iso,
  }));
});

console.log("\n" + "=".repeat(50));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tools`);
if (failed > 0) {
  console.log("SOME TOOLS FAILED");
  process.exit(1);
} else {
  console.log("ALL TOOLS WORKING");
}
