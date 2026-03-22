---
name: stakesignal-api
description: REST API for StakeHumanSignal marketplace. Submit reviews, access ranked verdicts (x402 gated), settle blind A/B sessions, check leaderboard, read agent decisions. All data stored on Filecoin. Live at stakesignal-api-production.up.railway.app.
---

# StakeHumanSignal REST API

## The Mental Model

This API is the backend for the staked human feedback marketplace. Humans interact via the frontend. Agents interact via this API directly or through the MCP servers (stakesignal-mcp, lido-mcp).

Every review submitted is:
1. Stored permanently on Filecoin (real CID returned)
2. Scored by a 5-dimension rubric
3. Available for agents to fetch and use as decision signals
4. Eligible for yield distribution if validated

## Base URL

```
https://stakesignal-api-production.up.railway.app
```

## Endpoints

### Reviews

**GET /reviews** — List all reviews (public, no auth)
```bash
curl https://stakesignal-api-production.up.railway.app/reviews
```

**GET /reviews/top** — Ranked reviews (x402 gated)
```bash
# With x402 payment header
curl -H "x-402-payment: agent-payment" \
  https://stakesignal-api-production.up.railway.app/reviews/top

# With task filtering
curl -H "x-402-payment: agent-payment" \
  "https://stakesignal-api-production.up.railway.app/reviews/top?task_intent=async+Python"
```

Without the header, returns HTTP 402 with payment challenge:
```json
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "1000",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  }]
}
```

**POST /reviews** — Submit a staked review
```json
{
  "reviewer_address": "0x...",
  "api_url": "https://api.openai.com/v1",
  "review_text": "Policy A produced better async error handling",
  "stake_amount": 2.5,
  "stake_tx_hash": "0x...",
  "task_intent": "evaluate Python async error handling",
  "task_type": "code_review",
  "winner": "policy_a",
  "reasoning": "Specific exception types with stack context",
  "rubric_scores": {
    "correctness": 0.85,
    "relevance": 0.9,
    "completeness": 0.8,
    "efficiency": 0.75,
    "reasoning_quality": 0.88
  }
}
```

Returns: `{ id, filecoin_cid, ... }` — the `filecoin_cid` is a real Lighthouse CID.

### Blind A/B Sessions

**GET /sessions** — List available sessions
**POST /sessions/open** — Create a new session
**POST /sessions/{id}/outputs** — Record two outputs for comparison
**GET /sessions/{id}** — Get session (outputs shuffled for blinding)
**POST /sessions/{id}/settle** — Human picks winner A or B

```json
{ "human_picked": "A" }
```

Returns: `{ recommended_won: true/false, payout: 1.414 }`

Payout formula: `sqrt(stake) * (1.0 if correct, -0.25 if wrong)`

### Passive Signal

**POST /sessions/passive** — Record lightweight preference (no stake)
```json
{
  "preferred_review_id": "1e41c962",
  "context": "Used this for async error handling — worked well"
}
```

### Agent

**GET /agent/log** — Full autonomous agent decision trail (131+ entries)

### Leaderboard

**GET /leaderboard** — Top reviewers by win rate and total stake

### Outcomes

**POST /outcomes** — Record job outcome with score and validation

### Health

**GET /health** — `{ "status": "ok" }`

## Scoring System

Reviews are scored on 5 dimensions:

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| correctness | 30% | Factual accuracy of the review |
| relevance | 20% | Alignment with the task intent |
| completeness | 15% | Coverage of important aspects |
| efficiency | 25% | Quality of the recommended solution |
| reasoning_quality | 10% | Clarity of the reviewer's explanation |

Combined with conviction-weighted staking:
```
yield_boost = sqrt(stake_amount) * reputation_score
```

The `sqrt` prevents plutocratic capture — staking $100 gives 10x the signal of $1, not 100x.

## For Agents: Recommended Flow

```
1. GET /reviews/top (with x402 header) — fetch ranked reviews
2. Read the top review's reasoning and rubric scores
3. Use the recommendation to choose your policy
4. POST /sessions/passive — record that the review helped
5. If high conviction: POST /reviews — stake on quality
```

## Data Persistence

- Reviews: stored on Filecoin via Lighthouse (real Qm... CIDs)
- Agent logs: pinned to Filecoin after each buyer agent cycle
- Sessions: in-memory (lost on deploy — seed with scripts/seed-sessions.py)
- Leaderboard: computed from reviews at query time
