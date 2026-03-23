# StakeHumanSignal × OpenServ

Multi-agent evaluation pipeline for the StakeHumanSignal marketplace, built on [OpenServ](https://openserv.ai).

## Agents

### 1. Scorer Agent (ID: 4043)
Scores reviews using a weighted 5-dimension rubric:
- **Correctness** (30%) — factual accuracy
- **Relevance** (25%) — alignment with task intent
- **Completeness** (20%) — thoroughness of coverage
- **Efficiency** (15%) — conciseness
- **Reasoning Quality** (10%) — logical coherence

Capabilities: `score_review`, `score_batch`

### 2. Buyer Coordinator Agent (ID: 4044)
Orchestrates the full evaluation pipeline:
1. **Fetch** reviews from StakeHumanSignal API (x402-gated)
2. **Score** each review with 5-dimension rubric
3. **Decide** validate (>60% confidence) or reject
4. **Signal** outcomes → on-chain settlement (ERC-8183 jobs, ERC-8004 receipts, Lido yield, Filecoin)

Capabilities: `fetch_reviews`, `signal_outcome`, `evaluate_pipeline`

## Quick Start

```bash
cd openserv
npm install

# Run tests (36 tests — local + live API)
node --import tsx src/test.ts

# Provision agents on OpenServ (idempotent)
node --import tsx src/provision.ts

# Start agents with tunnel
node --import tsx src/index.ts

# Register on ERC-8004 (requires ETH on Base mainnet)
node --import tsx src/register-erc8004.ts
```

## Webhooks

```bash
# Score a review
curl -X POST "https://api.openserv.ai/webhooks/trigger/$SCORER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-openserv-key: $USER_KEY" \
  -d '{"input": "Score this review: ..."}'

# Run full pipeline
curl -X POST "https://api.openserv.ai/webhooks/trigger/$COORD_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-openserv-key: $USER_KEY" \
  -d '{"limit": 5, "confidence_threshold": 0.6}'
```

## Architecture

```
Webhook Request
      ↓
Coordinator Agent (OpenServ workspace 13063)
      ├── fetch_reviews → StakeHumanSignal API (/reviews/top)
      ├── score (5-dim rubric) → validate/reject
      └── signal_outcome → /outcomes API
            ├── Complete ERC-8183 job
            ├── Mint ERC-8004 receipt
            ├── Distribute Lido wstETH yield
            └── Pin log to Filecoin

Scorer Agent (OpenServ workspace 13062)
      ├── score_review → single review scoring
      └── score_batch → ranked batch scoring
```

## Tests

36 tests covering:
- OpenServ SDK/Client import verification
- Scorer agent: rubric scoring, heuristic fallback, batch ranking
- Coordinator agent: capability registration, live API fetch, full pipeline
- Live webhook fire via OpenServ platform

## Proof

See `deployments/openserv-proof.json` for verified live execution results.
