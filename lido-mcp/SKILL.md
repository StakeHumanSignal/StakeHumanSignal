---
name: lido-mcp
description: MCP server for Lido stETH yield treasury operations on Base. Stake USDC, query yield balance, distribute yield to winners, monitor vault health, list ERC-8183 jobs. All write operations support dry_run simulation. Works in mock mode without contract addresses.
---

# Lido MCP Server

MCP server exposing Lido wstETH yield treasury operations for AI agents. Part of the StakeHumanSignal staked feedback marketplace.

## Setup

```bash
cd lido-mcp && bun install && node index.js
```

## Tools

### lido_stake
Stake USDC into LidoTreasury. Principal locked forever.

```json
{
  "amount_usdc": 10.0,
  "wallet": "0x557E...",
  "dry_run": true
}
```

Returns: `{ tx_hash, amount_usdc, wsteth_estimated, dry_run }`

### lido_get_yield_balance
Query wstETH yield available in treasury. Read-only.

```json
{
  "wallet": "0x557E..."
}
```

Returns: `{ yield_wsteth, yield_usd_estimate, principal_locked, total_balance, wallet_deposits }`

### lido_distribute_yield
Distribute wstETH yield to winning reviewer. Whitelisted callers only.

```json
{
  "winner_wallet": "0xABC...",
  "amount_wsteth": "1000000000000000",
  "dry_run": true
}
```

Returns: `{ tx_hash, amount_wsteth, recipient, yield_available, can_distribute, dry_run }`

### lido_get_vault_health
Check vault position vs Lido benchmark APY. Returns alerts if below.

```json
{}
```

Returns: `{ current_apy, benchmark_apy, below_benchmark, total_staked, yield_available, alert }`

Alert example: `"Yield 2.1% below 7-day benchmark (2.1% vs 3.5%)"`

### lido_list_jobs
List ERC-8183 jobs from StakeHumanSignalJob contract.

```json
{
  "status": "funded",
  "limit": 10
}
```

Returns: `{ jobs: [{ job_id, status, stake, reviewer }], total, filter }`

## dry_run Pattern

All write operations (`stake`, `distribute_yield`) default to `dry_run: true`.

- `dry_run: true` — simulate the operation, return estimated values, no transaction sent
- `dry_run: false` — execute the real transaction on-chain

Always dry_run first, then execute.

## Vault Monitor

Separate process that polls vault health:

```bash
node vault-monitor.js                # every 5 min
node vault-monitor.js --interval 60  # every 60s
```

Logs JSON status to stdout. Prints alerts to stderr when yield drops below benchmark.

## Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| wstETH | `0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452` | Base Mainnet |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Base Mainnet |
| LidoTreasury | Set via `LIDO_TREASURY_ADDRESS` env | Base |
| StakeHumanSignalJob | Set via `STAKE_SIGNAL_JOB_ADDRESS` env | Base |

## Environment

```
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_wallet_key
LIDO_TREASURY_ADDRESS=0x...
STAKE_SIGNAL_JOB_ADDRESS=0x...
```

If `LIDO_TREASURY_ADDRESS` is not set, all tools run in mock mode with simulated responses.
