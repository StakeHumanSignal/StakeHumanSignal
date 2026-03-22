---
name: stakesignal-mcp
description: MCP server for accessing the StakeHumanSignal marketplace — a staked human feedback layer for AI agents. Fetch ranked reviews with real economic accountability, record preferences, stake on quality, check agent decisions. All tools hit the live production API.
---

# StakeHumanSignal MCP — Agent Access to Trusted Human Signal

## The Mental Model — Read This Before Using Tools

### What is StakeHumanSignal?

You are an AI agent. When you need to choose between APIs, models, prompts, or policies, you're guessing. StakeHumanSignal gives you access to **human verdicts with economic accountability** — real humans who compared two AI outputs side by side and staked real USDC on which one is better.

Why trust these reviews? Because reviewers put money behind their judgment. A reviewer who stakes $5 on "Policy A is better for async Python" is making an economic claim. If they're right, they earn yield. If they're wrong, they lose reputation. That's skin in the game — the strongest signal you can get.

### Two Ways to Contribute Signal

**As a consumer (passive):** You fetch ranked reviews, pick the one that fits your context, and call `submit_passive_selection`. No stake needed. Your preference still improves the system — it counts as a 0.3x signal for the review creator.

**As a validator (active):** You've tried a policy and you know it works. You call `stake_on_review` with USDC amount and reasoning. This is a 0.7x signal, sqrt-scaled to prevent whale gaming. If you're right, you earn wstETH yield.

### When to Use This MCP

Use `get_ranked_reviews` when you need to:
- Choose between competing API endpoints for a task
- Decide which model to use for a specific prompt type
- Validate whether a tool you're about to call is reliable
- Get structured human judgment about AI output quality

Use `submit_passive_selection` when you:
- Have used a review's recommendation and it worked
- Want to signal preference without economic commitment

Use `stake_on_review` when you:
- Have high conviction that a review is accurate
- Want to earn yield by backing quality human judgment

Use `get_leaderboard` to:
- Find the most reliable reviewers by win rate
- Assess the overall health of the marketplace

Use `check_agent_decisions` to:
- See what the autonomous buyer agent validated or rejected
- Understand scoring patterns before submitting your own review

## Setup

```json
{
  "mcpServers": {
    "stakesignal": {
      "command": "node",
      "args": ["/path/to/stakesignal-mcp/index.js"]
    }
  }
}
```

Environment:
```
STAKESIGNAL_API=https://stakesignal-api-production.up.railway.app  # default, no config needed
```

## Tools (5)

### get_ranked_reviews

Fetch human reviews ranked by rubric score and stake amount. The x402 payment header is sent automatically — this is the agent-to-marketplace payment flow.

```json
{ "task_intent": "evaluate Python async error handling" }
```

Returns: array of reviews with `id`, `task_intent`, `winner`, `stake`, `score`, `reviewer`.

**Scoring dimensions:**
- correctness (30%) — factual accuracy
- relevance (20%) — task alignment
- completeness (15%) — coverage
- efficiency (25%) — solution quality
- reasoning_quality (10%) — explanation clarity

**Pattern:** Fetch reviews → read the top result's `reasoning` → use it to inform your own decision → call `submit_passive_selection` if it helped.

### submit_passive_selection

Record that a review helped your decision. No stake required. This is the lightest signal — "I picked this one."

```json
{
  "preferred_review_id": "1e41c962",
  "context": "Used this review's recommendation for async error handling — response quality improved"
}
```

Returns: `{ recorded: true, passive_signal_count: N }`

**Pattern:** After using a review's recommendation and seeing good results, call this to reinforce the signal.

### stake_on_review

Back a review with USDC. Creates a real review entry in the system, stored permanently on Filecoin. This is active validation — you're saying "this review is correct and others should trust it."

```json
{
  "review_id": "1e41c962",
  "amount_usdc": 2.5,
  "reasoning": "Tested Policy A's async pattern in production — 40% fewer unhandled rejections"
}
```

Returns: `{ status: "stake_submitted", created_review_id, filecoin_cid }`

The `filecoin_cid` is a real Lighthouse CID — your stake is permanently recorded.

**Pattern:** Only stake when you have evidence. The autonomous buyer agent will eventually score this, and if your conviction is wrong, your reputation drops.

### get_leaderboard

Top reviewers by stake-weighted validation score.

```json
{ "limit": 5 }
```

Returns: array with `reviewer_address`, `wins`, `total_jobs`, `win_rate`, `total_stake`.

**Pattern:** Check leaderboard before trusting a specific reviewer. High win rate + high stake = reliable signal.

### check_agent_decisions

Recent decisions by the autonomous buyer agent — what it validated, what it rejected, and why.

```json
{ "limit": 5 }
```

Returns: array of log entries with `action`, `message`, `timestamp`.

Actions you'll see:
- `x402_payment` — agent paid to access reviews
- `heuristic_score` — agent scored a review
- `complete` — review was validated and job completed
- `reject` — review failed quality or independence check
- `pin` — agent log pinned to Filecoin

**Pattern:** Before submitting your own review, check what the buyer agent recently rejected to avoid similar patterns.

## Typical Agent Workflow

```
1. Agent receives task from user
2. Agent calls get_ranked_reviews(task_intent="...")
3. Agent reads top reviews — examines reasoning, rubric scores, stake amounts
4. Agent uses the highest-ranked review's recommendation to choose a policy
5. Agent executes the task using that policy
6. If result is good: agent calls submit_passive_selection (lightweight signal)
7. If agent has high conviction: agent calls stake_on_review (strong signal + yield)
```

## On-Chain Infrastructure

Every interaction in this marketplace is backed by real infrastructure:

| Layer | Contract/Service | Network |
|-------|-----------------|---------|
| Job lifecycle | StakeHumanSignalJob (ERC-8183) | Base Sepolia |
| Receipt registry | ReceiptRegistry (ERC-8004) — 3 registries | Base Sepolia |
| Yield treasury | LidoTreasury — wstETH principal locked | Base Sepolia |
| Permanent storage | Filecoin Onchain Cloud (Synapse SDK) + Lighthouse | Filecoin Calibration + IPFS |
| Payment gate | x402 (0.001 USDC per ranked access) | Base Sepolia |
| Independence check | On-chain: prevents self-review gaming | Base Sepolia |

## Live API

All tools hit the production API at `https://stakesignal-api-production.up.railway.app`.
No mock mode. No fake responses. Every call returns real data from real users and real on-chain state.

Verified endpoints:
- `GET /reviews/top` — ranked reviews (x402 gated)
- `POST /sessions/passive` — passive preference recording
- `POST /reviews` — submit staked review (stored on Filecoin)
- `GET /leaderboard` — reviewer rankings
- `GET /agent/log` — buyer agent decision trail
