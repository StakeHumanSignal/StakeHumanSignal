---
name: lido-mcp
description: Reference MCP server for Lido — 9 tools for stETH staking, wstETH wrap/unwrap, yield management, withdrawal queue, and DAO governance. Reads real Ethereum mainnet Lido contracts. All write ops support dry_run. Pairs with StakeHumanSignal yield treasury on Base.
---

# Lido MCP Server

Reference MCP server that makes stETH staking, position management, and governance natively callable by any AI agent. Built for the Synthesis Hackathon Lido MCP track ($5,000).

## The Lido Mental Model — Read This First

### stETH vs wstETH

**stETH** (rebasing): When you stake ETH with Lido, you get stETH. Your stETH balance increases daily as staking rewards accrue. This is called "rebasing" — the token supply grows to reflect earned yield. However, many DeFi protocols and L2 bridges don't handle rebasing tokens well.

**wstETH** (non-rebasing wrapper): wstETH wraps stETH at a fixed exchange rate. Your wstETH balance stays constant, but each wstETH becomes worth more stETH over time. This is the preferred format for DeFi, bridges, and agent treasuries because the balance doesn't unexpectedly change.

**Current rate (live from Ethereum mainnet):** 1 stETH ≈ 0.813 wstETH (or 1 wstETH ≈ 1.23 stETH)

### Safe Staking Patterns for Agents

1. **Always use wstETH for storage** — stETH rebasing can cause rounding drift in accounting
2. **Always dry_run first** — simulate before sending real transactions
3. **Check withdrawal queue** before requesting unstake — finalization takes 1-5 days
4. **Never assume 1:1 ETH:stETH** — there's a slight discount on the open market
5. **Governance votes are irreversible** — verify vote ID and direction in dry_run

### Rebasing Drift (Critical for Integration)

If your contract holds stETH directly, the balance will change between transactions due to rebasing. This can cause:
- Accounting mismatches in `balanceOf` checks
- Unexpected reverts if you try to transfer the "full balance" (it may have increased by 1 wei since you last checked)
- Share rounding issues on transfers

**Solution:** Hold wstETH. The StakeHumanSignal LidoTreasury does this correctly — it locks wstETH principal and distributes wstETH yield.

## Setup

```bash
cd lido-mcp && npm install && node index.js
```

Claude Desktop config:
```json
{
  "mcpServers": {
    "lido": {
      "command": "node",
      "args": ["/path/to/lido-mcp/index.js"]
    }
  }
}
```

## All 9 Tools

### lido_stake
Deposit into StakeHumanSignal LidoTreasury. Principal locked forever — only yield is distributable.

```json
{ "amount_usdc": 10.0, "wallet": "0x...", "dry_run": true }
```

Returns: estimated wstETH from on-chain `getWstETHByStETH()` rate (not hardcoded).

### lido_unstake
Request stETH withdrawal from Lido. Uses the Ethereum mainnet withdrawal queue (ERC-721).

```json
{ "amount_steth": "1.0", "dry_run": true }
```

Returns: estimated wait time, queue position. Finalization takes 1-5 days.

### lido_wrap
Wrap stETH → wstETH on Ethereum mainnet. Rate fetched live from `wstETH.getWstETHByStETH()`.

```json
{ "amount_steth": "1.0", "dry_run": true }
```

Returns: exact wstETH amount from on-chain contract call.

### lido_unwrap
Unwrap wstETH → stETH on Ethereum mainnet. Rate fetched live from `wstETH.getStETHByWstETH()`.

```json
{ "amount_wsteth": "1.0", "dry_run": true }
```

Returns: exact stETH amount from on-chain contract call.

### lido_get_yield_balance
Query wstETH yield available in StakeHumanSignal treasury. Read-only, hits Base Sepolia.

```json
{ "wallet": "0x..." }
```

Returns: `{ yield_wsteth, principal_locked, total_balance, total_yield_distributed }` — all from real contract reads.

### lido_distribute_yield
Distribute wstETH yield to winning reviewer. Whitelisted callers only. Hits Base Sepolia.

```json
{ "winner_wallet": "0x...", "amount_wsteth": "1000000000000000", "dry_run": true }
```

### lido_get_vault_health
Check vault position vs Lido benchmark APY. Current APY computed from on-chain `availableYield / totalPrincipal`. Benchmark configurable via `LIDO_BENCHMARK_APY` env var (default: Lido historical ~3.5%).

```json
{}
```

Returns: `{ current_apy, benchmark_apy, below_benchmark, alert }` with `current_apy_source: "on-chain"`.

### lido_list_jobs
List ERC-8183 jobs from StakeHumanSignalJob contract on Base Sepolia.

```json
{ "status": "funded", "limit": 10 }
```

### lido_vote
Vote on Lido DAO governance proposal via Aragon Voting on Ethereum mainnet.

```json
{ "vote_id": 199, "supports": true, "dry_run": true }
```

dry_run fetches real vote data (open/executed, yea/nay counts, quorum) from mainnet.

## Network Architecture

```
┌─ Ethereum Mainnet ─────────────────────────┐
│  stETH  → stake, balance                   │
│  wstETH → wrap, unwrap, rate queries       │
│  Aragon → governance votes                 │
│  Withdrawal Queue → unstake requests       │
└────────────────────────────────────────────┘
          ↕ separate RPC provider
┌─ Base Sepolia ─────────────────────────────┐
│  LidoTreasury → yield balance, distribute  │
│  StakeHumanSignalJob → list jobs           │
│  wstETH (Base) → balance reads             │
└────────────────────────────────────────────┘
```

Each network has its own `ethers.JsonRpcProvider`. Mainnet contracts are NOT called through the Sepolia provider.

## dry_run Pattern

All write operations default to `dry_run: true`.

- `dry_run: true` — reads real chain state, computes estimates, no transaction sent
- `dry_run: false` — executes real on-chain transaction, returns TX hash + receipt

The dry_run path for wrap/unwrap calls the real `wstETH.getWstETHByStETH()` contract on Ethereum mainnet — not a hardcoded ratio.

## Environment Variables

```
# Base (StakeHumanSignal contracts)
BASE_RPC_URL=https://sepolia.base.org
LIDO_TREASURY_ADDRESS=0x8E29D161477D9BB00351eA2f69702451443d7bf5
STAKE_SIGNAL_JOB_ADDRESS=0xE99027DDdF153Ac6305950cD3D58C25D17E39902

# Ethereum (Lido protocol)
ETH_RPC_URL=https://eth.llamarpc.com
LIDO_NETWORK=mainnet  # or "holesky" for testnet

# Signing (required for dry_run=false)
PRIVATE_KEY=0x...

# Vault health
LIDO_BENCHMARK_APY=3.5
```

## Contract Addresses

### Ethereum Mainnet (source: docs.lido.fi/deployed-contracts)

| Contract | Address |
|----------|---------|
| stETH | `0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84` |
| wstETH | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` |
| Aragon Voting (DAO) | `0x2e59A20f205bB85a89C53f1936454680651E618e` |
| Withdrawal Queue | `0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1` |

### Holesky Testnet (source: docs.lido.fi/deployed-contracts/holesky)

| Contract | Address |
|----------|---------|
| stETH | `0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034` |
| wstETH | `0x8d09a4502Cc8Cf1547aD300E066060D043f6982D` |
| Aragon Voting (DAO) | `0xdA7d2573Df555002503F29aA4003e398d28cc00f` |
| Withdrawal Queue | `0xc7cc160b58F8Bb0baC94b80847E2CF2800565C50` |

### Base (wstETH bridged)

| Contract | Address |
|----------|---------|
| wstETH | `0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452` |
