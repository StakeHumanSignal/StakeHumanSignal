# Skill: Lido MCP Server
## Track: Lido MCP — $5,000 pool (1st $3k / 2nd $2k)

## Status: ALL REQUIREMENTS MET

- [x] Integrate stETH or wstETH on-chain
- [x] stake
- [x] unstake
- [x] wrap (stETH → wstETH)
- [x] unwrap (wstETH → stETH)
- [x] balance/rewards queries
- [x] At least 1 governance action (lido_vote)
- [x] All write ops support dry_run
- [x] No mocks (real contract calls on Base Sepolia)
- [x] lido.skill.md present for agent discovery

## All 9 tools

1. lido_stake — stake ETH → receive stETH
2. lido_unstake — request stETH withdrawal
3. lido_wrap — stETH → wstETH
4. lido_unwrap — wstETH → stETH
5. lido_get_yield_balance — read yield/principal from treasury
6. lido_distribute_yield — send yield to winner
7. lido_get_vault_health — APY, TVL, alerts
8. lido_list_jobs — list ERC-8183 jobs
9. lido_vote — vote on Lido DAO governance proposal

## Key files
- `lido-mcp/index.js` — 9 tools with dry_run support
- `lido-mcp/contracts.js` — Sepolia contract addresses + ABIs
- `lido-mcp/lido.skill.md` — agent-consumable skill doc
- `lido-mcp/vault-monitor.js` — APY monitoring + alerts

## Verify
```bash
grep -c "name.*lido" lido-mcp/index.js  # should be 9
cd lido-mcp && npm test                  # 7 tests pass
```
