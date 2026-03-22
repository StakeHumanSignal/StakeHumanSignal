# Skill: Octant — Public Goods Evaluation
## Tracks: Mechanism Design ($1,000) + Data Collection ($1,000)

## What Octant Is

Octant is a Golem Foundation project for participatory public goods funding. Users lock GLM tokens,
yield accrues, and the community allocates that yield to public goods projects through epoch-based
funding rounds. The core challenge: **how do you evaluate which projects deserve funding?**

Their tracks ask:
- **Mechanism Design:** "What innovations could make evaluation faster, fairer, or more transparent?"
- **Data Collection:** "How can agents surface richer, more reliable signals about a project's impact?"

These are conceptual/design tracks — they don't require integrating Octant's SDK or calling their API.
Our system IS the answer to their question.

## Status: CONCEPTUAL FIT — NO SDK INTEGRATION NEEDED

- [x] Novel mechanism design (conviction-weighted staking)
- [x] Two-layer evaluation model (passive + active)
- [x] On-chain independence check prevents gaming
- [x] Agent autonomously collects and scores structured human signals
- [x] Permanent storage on Filecoin (Lighthouse + FOC)
- [ ] NOT integrated with Octant's platform (not required by track)
- [ ] NOT using GLM token (not required by track)

## Why We Fit: Mechanism Design Track

The track asks: "What adjacent innovations in DPI capital issuance could make evaluation
faster, fairer, or more transparent?"

**Our answer: conviction-weighted blind evaluation with economic accountability.**

| Octant's Problem | Our Solution | Implementation |
|------------------|-------------|----------------|
| Evaluation speed | Passive layer — users just pick the better output, no form to fill | `POST /sessions/{id}/settle` with `human_picked: "A"` or `"B"` |
| Evaluation fairness | sqrt scaling prevents whale dominance | `scorer.py`: `boost = sqrt(stake_size) * reputation_score` |
| Evaluation transparency | Every decision on-chain + Filecoin | ERC-8004 receipts + FOC PieceCIDs |
| Sybil resistance | Independence check cross-references agent→owner mapping | `ReceiptRegistry.getIndependenceScore(reviewer, agentOwner)` |
| Low participation | Two-layer model: no stake needed to contribute signal | Passive (0.3x yield) vs Active (0.7x yield, sqrt-scaled) |

**Key insight for Octant judges:** Most evaluation systems force users to choose between
low-friction-but-noisy (clicks, likes) and high-quality-but-high-friction (structured reviews).
We separate these into two explicit layers, letting the system benefit from BOTH simultaneously.

### The Math

```python
# Passive layer — anyone can contribute (no stake)
passive_signal = 0.3 * binary_preference  # just pick A or B

# Active layer — conviction users stake USDC
active_signal = 0.7 * sqrt(stake_amount) * reputation_score

# Combined payout to evaluator
yield_multiplier = passive_signal + active_signal
```

The `sqrt` prevents plutocratic capture — staking $100 only gives you 10x the signal of $1,
not 100x. This is directly applicable to Octant's capital allocation problem.

## Why We Fit: Data Collection Track

The track asks: "How can agents surface richer, more reliable signals about a project's
impact or legitimacy?"

**Our answer: autonomous agent collection of structured human evaluation signals.**

| What Agent Collects | How | Storage |
|--------------------|-----|---------|
| 5-dimension rubric scores | Heuristic scorer + optional LLM ensemble | In-memory + API |
| Human A/B preferences | Blind comparison via `/validate` page | On-chain (SessionEscrow) |
| Stake-weighted conviction | USDC stakes on review quality | On-chain (StakeHumanSignalJob) |
| Agent decision trail | 131+ structured log entries | Filecoin (Lighthouse + FOC) |
| Independence verification | Cross-registry check in ReceiptRegistry | On-chain |

**Key insight for Octant judges:** The agent doesn't just collect data — it collects
*economically accountable* data. Every signal comes with a cost (stake) or at minimum
a decision (A/B pick). This filters noise better than surveys or sentiment analysis.

### Rubric Dimensions

```python
RUBRIC = {
    "correctness": 0.30,    # factual accuracy
    "relevance": 0.20,      # task alignment
    "completeness": 0.15,   # coverage
    "efficiency": 0.25,     # solution quality
    "reasoning_quality": 0.10  # explanation clarity
}
```

These structured scores are stored permanently on Filecoin, making them queryable
and auditable by any future evaluation system — including Octant's.

## Octant Public API (Reference)

Octant has a public API we verified is live:
- `https://backend.mainnet.octant.app/info/version` → `{"id":"v0.30.0","env":"prod","chain":"Mainnet"}`
- `https://backend.mainnet.octant.app/projects/epoch/5` → list of project addresses
- `https://backend.mainnet.octant.app/allocations/epoch/5` → donor→project allocation amounts

We don't call this API — but it validates that Octant's evaluation challenge is real
and that our mechanism could plug into their allocation system.

## Key Files

- `api/services/scorer.py` — conviction-weighted scoring with sqrt scaling
- `api/services/scorer_local.py` — 5-dimension rubric scorer
- `api/routes/sessions.py` — blind A/B comparison flow (passive layer)
- `api/routes/reviews.py` — staked review submission (active layer)
- `api/agent/buyer_agent.py` — autonomous collection + scoring loop
- `contracts/ReceiptRegistry.sol` — ERC-8004 with independence check
- `contracts/StakeHumanSignalJob.sol` — ERC-8183 with stake tracking

## How to Frame for Submission

**Mechanism Design description:**
"StakeHumanSignal introduces conviction-weighted blind evaluation — a two-layer mechanism
where passive preference signals and active staked validation compound into a trustworthy
policy-ranking layer. The sqrt-scaled staking prevents plutocratic capture while the passive
layer ensures broad participation. Applied to Octant's public goods evaluation, this could
replace binary voting with economically accountable signal aggregation."

**Data Collection description:**
"An autonomous buyer agent collects structured human evaluation signals — 5-dimension rubric
scores, blind A/B preferences, and stake-weighted conviction — and stores them permanently
on Filecoin Onchain Cloud with PDP proofs. Every signal is economically accountable (staked
or preference-recorded), making the collected data inherently higher quality than surveys
or sentiment analysis."

## Verify

```bash
# Mechanism design math
python3 -c "from api.services.scorer import compute_payout_score; print(compute_payout_score(1.0, 0.8, 0.8))"

# Data collection — agent runs and collects
python -m api.agent.buyer_agent --once

# Independence check exists
grep "getIndependenceScore" contracts/ReceiptRegistry.sol
```
