# lido-mcp/ — Lido MCP Server

**Tracks:** Lido MCP Server ($5,000) | stETH Agent Treasury ($3,000)

## What This Does

Reference MCP server for Lido — 11 tools that make stETH staking, wstETH wrap/unwrap, yield management, and DAO governance natively callable by any AI agent. Dual-provider architecture: Ethereum mainnet for Lido protocol contracts, Base Sepolia for StakeHumanSignal treasury.

All write operations default to `dry_run: true`. Dry-run reads **real chain state** from Ethereum mainnet — not hardcoded ratios, not mocks.

## Tools (11)

| Tool | Network | Description |
|------|---------|-------------|
| `lido_stake_eth` | Ethereum | Stake ETH with Lido → receive stETH (calls `stETH.submit()`) |
| `lido_balance` | Ethereum | Read stETH + wstETH balances for any wallet |
| `lido_wrap` | Ethereum | Wrap stETH → wstETH (live rate from contract) |
| `lido_unwrap` | Ethereum | Unwrap wstETH → stETH (live rate from contract) |
| `lido_unstake` | Ethereum | Request stETH withdrawal (queries real queue state) |
| `lido_vote` | Ethereum | Vote on Lido DAO governance proposals |
| `lido_treasury_deposit` | Base Sepolia | Deposit into StakeHumanSignal yield treasury |
| `lido_get_yield_balance` | Base Sepolia | Query treasury yield/principal/balance |
| `lido_distribute_yield` | Base Sepolia | Distribute wstETH yield to review winner |
| `lido_get_vault_health` | Base Sepolia | Treasury health with configurable benchmark |
| `lido_list_jobs` | Base Sepolia | List ERC-8183 jobs |

## Verified on Ethereum Mainnet

```
1 stETH = 0.813 wstETH          (live from wstETH.getWstETHByStETH)
Total DAO votes: 199             (live from lidoDAO.votesLength)
Last finalized withdrawal: #118573 (live from withdrawalQueue)
```

## How to Run

```bash
cd lido-mcp
npm install
node index.js                    # Start MCP server
```

## How to Test

```bash
npm test                         # 12 unit + mainnet tests
node live-test.js                # 11/11 tools against real RPCs
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

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `ETH_RPC_URL` | `https://ethereum-rpc.publicnode.com` | Ethereum mainnet for Lido contracts |
| `BASE_RPC_URL` | `https://sepolia.base.org` | Base Sepolia for treasury |
| `LIDO_NETWORK` | `mainnet` | `mainnet` or `holesky` |
| `PRIVATE_KEY` | — | Required for `dry_run=false` transactions |
| `LIDO_BENCHMARK_APY` | `3.5` | Configurable vault health benchmark |

## Key Files

| File | Purpose |
|------|---------|
| `index.js` | MCP server — 11 tools, dual-provider architecture |
| `contracts.js` | ETH_MAINNET + ETH_HOLESKY + BASE addresses (from docs.lido.fi) |
| `lido.skill.md` | Agent skill — Lido mental model, rebasing, safe staking patterns |
| `vault-monitor.js` | Treasury health polling + alerts |
| `lido-mcp.test.js` | 12 tests including live Ethereum mainnet read |
| `live-test.js` | Full integration test — calls every tool with real RPCs |
