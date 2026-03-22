# StakeHumanSignal MCP Skill

## What this does
Connects any MCP-compatible agent to the StakeHumanSignal marketplace — a staked human feedback system where reviewers stake USDC behind their evaluations and earn wstETH yield when validated.

## Tools (5)

### get_ranked_reviews
Fetch ranked staked reviews. Reviews are scored by a 5-dimension rubric (correctness, efficiency, relevance, completeness, reasoning_quality) and weighted by stake amount.
- `task_intent` (optional): Filter reviews by task relevance

### submit_passive_selection
Record which review output better fits your agent's context. This is a lightweight preference signal that does not require staking.
- `preferred_review_id` (required): ID of the preferred review
- `context` (required): Why this output fits your needs

### stake_on_review
Stake USDC behind a review you believe is high quality. Stakers earn wstETH yield if the review is validated by the autonomous buyer agent.
- `review_id` (required): Review to stake on
- `amount_usdc` (required): USDC amount to stake
- `reasoning` (required): Why you believe this review is accurate

### get_leaderboard
See top reviewers ranked by stake-weighted validation score and yield earned.
- `limit` (optional, default 10): Number of reviewers to return

### check_agent_decisions
See recent autonomous agent decisions — which reviews were completed or rejected and why.
- `limit` (optional, default 5): Number of decisions to return

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

## Architecture
- ERC-8183: Job lifecycle (post → assign → complete/reject)
- ERC-8004: Receipt registry with rubric scores and independence verification
- Lido Treasury: wstETH yield-only distribution (principal locked)
- x402: Payment gate for ranked review access (0.001 USDC)
- Filecoin: Permanent storage of review outcomes via Lighthouse
