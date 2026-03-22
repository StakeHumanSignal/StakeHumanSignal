# stakesignal-mcp

MCP server for the StakeHumanSignal staked human feedback marketplace.

## Quick Start

```bash
cd stakesignal-mcp
bun install
node index.js
```

## Tools

| Tool | Description |
|------|-------------|
| `get_ranked_reviews` | Fetch ranked staked reviews by rubric score and stake |
| `submit_passive_selection` | Record preference signal (no stake required) |
| `stake_on_review` | Stake USDC behind a high-quality review |
| `get_leaderboard` | Top reviewers by validation score and yield |
| `check_agent_decisions` | Recent autonomous agent decisions |

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

| Variable | Default |
|----------|---------|
| `STAKESIGNAL_API` | `https://stakesignal-api-production.up.railway.app` |
