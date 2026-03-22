# stakesignal-mcp/ — StakeHumanSignal MCP Server

**Purpose:** Lets any AI agent access the StakeHumanSignal marketplace — fetch ranked human reviews, record preferences, stake on quality, check leaderboard.

## What This Does

MCP server with 5 tools that hit the **live production API**. This is how agents consume trusted human signal without knowing our API endpoints or data format. Every tool makes real HTTP calls to Railway — zero mock responses.

## Tools (5)

| Tool | What it does | Hits live API? |
|------|-------------|----------------|
| `get_ranked_reviews` | Fetch reviews ranked by rubric score + stake | YES — with x402 header |
| `submit_passive_selection` | Record "I preferred this review" (no stake) | YES |
| `stake_on_review` | Stake USDC behind a review + store on Filecoin | YES — creates real review with CID |
| `get_leaderboard` | Top reviewers by win rate and stake | YES |
| `check_agent_decisions` | Recent buyer agent decisions (131+ entries) | YES |

## How to Run

```bash
cd stakesignal-mcp
npm install
node index.js                    # Start MCP server
```

## How to Test

```bash
npm test                         # 6 unit tests
node live-test.js                # 5/5 tools against live Railway API
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "stakesignal": {
      "command": "node",
      "args": ["/absolute/path/to/stakesignal-mcp/index.js"]
    }
  }
}
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `STAKESIGNAL_API` | `https://stakesignal-api-production.up.railway.app` | No config needed — works out of the box |

## Key Files

| File | Purpose |
|------|---------|
| `index.js` | MCP server — 5 tools, all hit live API |
| `stakesignal.skill.md` | Agent skill — mental model, workflow guide, scoring dimensions |
| `stakesignal-mcp.test.js` | 6 unit tests |
| `live-test.js` | Full integration test against live Railway API |
