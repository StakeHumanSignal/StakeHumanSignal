# Skill: Lido MCP Server Fix
## Track: Lido MCP — $5,000 pool (1st $3k / 2nd $2k)

## What the judge wants (MINIMUM requirements)
- [x] Integrate stETH or wstETH on-chain
- [x] stake
- [ ] unstake ← MISSING
- [ ] wrap (stETH → wstETH) ← MISSING
- [ ] unwrap (wstETH → stETH) ← MISSING
- [x] balance/rewards queries
- [ ] At least 1 governance action ← MISSING
- [x] All write ops support dry_run
- [x] No mocks (real contract calls when configured)
- [ ] lido.skill.md (bonus) ← have SKILL.md, rename

## What we have (5 tools)
1. lido_stake — stake USDC (dry_run)
2. lido_get_yield_balance — read yield/principal
3. lido_distribute_yield — send yield to winner (dry_run)
4. lido_get_vault_health — APY vs benchmark
5. lido_list_jobs — list ERC-8183 jobs

## What we need to add (4 tools)
6. lido_unstake — withdraw stETH (dry_run)
7. lido_wrap — stETH → wstETH (dry_run)
8. lido_unwrap — wstETH → stETH (dry_run)
9. lido_vote — vote on Lido DAO proposal (dry_run)

## Contract addresses needed
- wstETH on Base: 0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452
- stETH on Ethereum: 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
- Lido DAO on Ethereum: 0xb8FFC3Cd6e7Cf5a098A1c92F48009765B24088Dc
- Withdrawal queue: https://docs.lido.fi/contracts/withdrawal-queue-erc721

## ABIs needed
wstETH: wrap(uint256) returns(uint256), unwrap(uint256) returns(uint256)
stETH: submit(address) payable (for staking ETH)
DAO: vote(uint256 voteId, bool supports, bool executesIfDecided)

## File to modify
lido-mcp/index.js — add 4 new tool handlers
lido-mcp/contracts.js — add withdrawal queue ABI

## Rename
mv lido-mcp/SKILL.md lido-mcp/lido.skill.md

## Do NOT
- Don't touch contracts/ directory
- Don't change existing 5 tools
- Don't remove mock mode fallback

## Verify
```bash
timeout 3 node lido-mcp/index.js 2>&1  # should show 9 tools
grep -c "name.*lido" lido-mcp/index.js  # should be 9
```
