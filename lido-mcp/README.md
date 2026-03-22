# lido-mcp/ — Lido MCP Server

**Tracks:** Lido MCP Server ($5,000) | stETH Agent Treasury ($3,000)

## What This Does

Model Context Protocol (MCP) server exposing 9 tools for interacting with Lido stETH/wstETH operations and the StakeHumanSignal treasury. All write operations default to `dry_run: true` (simulation against real Sepolia contracts, no state changes). Agents connect via MCP to manage staking, yield distribution, and vault monitoring.

## Tools

| Tool | Type | Description |
|------|------|-------------|
| `stake_eth` | Write | Stake ETH → receive stETH via Lido |
| `unstake_steth` | Write | Request stETH withdrawal |
| `wrap_steth` | Write | Wrap stETH → wstETH |
| `unwrap_wsteth` | Write | Unwrap wstETH → stETH |
| `get_yield_info` | Read | Treasury yield stats (principal, available, APY) |
| `distribute_yield` | Write | Distribute available wstETH yield to winner |
| `vault_health` | Read | Treasury health check (TVL, utilization, alerts) |
| `list_jobs` | Read | Active ERC-8183 jobs with status |
| `vote_on_proposal` | Write | Vote on Lido DAO governance proposals |

## Deployed Contracts (Base Sepolia)

```
LidoTreasury:       0x8E29D161477D9BB00351eA2f69702451443d7bf5
StakeHumanSignalJob: 0xE99027DDdF153Ac6305950cD3D58C25D17E39902
```

RPC defaults to `https://sepolia.base.org`.

## How to Run

```bash
cd lido-mcp
bun install
node index.js
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "lido": {
      "command": "node",
      "args": ["/absolute/path/to/lido-mcp/index.js"]
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_RPC_URL` | `https://sepolia.base.org` | RPC endpoint |
| `PRIVATE_KEY` | — | Signing key (falls back to `BASE_SEPOLIA_PRIVATE_KEY`) |
| `LIDO_TREASURY_ADDRESS` | `0x8E29D...` | Treasury contract |
| `STAKE_SIGNAL_JOB_ADDRESS` | `0xE9902...` | Job contract |

## Key Files

- `index.js` — MCP server with 9 tool definitions, dry_run support, Sepolia defaults
- `contracts.js` — Contract addresses and ABI definitions
- `vault-monitor.js` — APY monitoring and alert thresholds
- `lido.skill.md` — Skill doc for agent consumption
