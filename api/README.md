# api/ — Python FastAPI Backend

**Tracks:** Let the Agent Cook (Protocol Labs) | Mechanism Design (Octant) | Agents for Data Collection (Octant) | Open Track

## What This Does

FastAPI backend powering the StakeHumanSignal marketplace. Handles review submission, scoring, leaderboard computation, session management for blind A/B comparisons, and the autonomous buyer agent loop. Every review is stored on Filecoin (via filecoin-bridge) and scored with a 5-dimension rubric.

## Live API

**URL:** https://stakesignal-api-production.up.railway.app

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/reviews` | GET | List all reviews | Public |
| `/reviews/top` | GET | Ranked reviews by score + stake | x402 (0.001 USDC) |
| `/reviews` | POST | Submit review + stake proof | Public |
| `/jobs` | GET | List ERC-8183 jobs | Public |
| `/outcomes` | GET/POST | Job outcomes + scoring | Public |
| `/leaderboard` | GET | Top reviewers by win rate + score | Public |
| `/agent/log` | GET | Agent decision log (123+ entries) | Public |
| `/sessions` | GET/POST | Blind A/B compare sessions | Public |
| `/sessions/{id}/settle` | POST | Human picks winner, settlement | Public |
| `/health` | GET | Health check | Public |

## How to Run

```bash
# From repo root
pip install -r requirements.txt
uvicorn api.main:app --port 8000 --reload
```

## How to Test

```bash
python -m pytest test/ -v
```

## Autonomous Buyer Agent

The buyer agent runs a full decision loop autonomously:

```
fetch reviews via x402 → heuristic score → independence check → complete job → mint receipt → distribute yield
```

```bash
# Single cycle
python -m api.agent.buyer_agent --once

# Continuous loop
python -m api.agent.buyer_agent --loop
```

Produces structured logs in `agent_log.json` (123+ entries showing real decisions, errors, retries).

## Scoring System

5-dimension rubric scoring:
- **Correctness** (30%) — factual accuracy
- **Relevance** (20%) — task alignment
- **Completeness** (15%) — coverage
- **Efficiency** (25%) — solution quality
- **Reasoning** (10%) — explanation clarity

Combined with conviction-weighted staking: `boost = sqrt(stake_size) * reputation_score`

## Key Files

- `main.py` — FastAPI app, route mounting, CORS
- `routes/reviews.py` — Review CRUD + Filecoin storage
- `routes/sessions.py` — Blind A/B compare flow
- `routes/leaderboard.py` — Win rate + score aggregation
- `routes/agent.py` — Agent log endpoint
- `services/scorer.py` — 5-dimension rubric scorer
- `services/web3_client.py` — On-chain contract interactions (Sepolia)
- `services/filecoin.py` — Filecoin bridge client
- `agent/buyer_agent.py` — Autonomous decision loop
