# Skill: Lido MCP Server
## Track: Lido MCP — $5,000 pool (1st $3k / 2nd $2k)

## Status: ALL REQUIREMENTS MET — REAL MAINNET READS

- [x] Integrate stETH or wstETH on-chain
- [x] stake
- [x] unstake (Ethereum withdrawal queue)
- [x] wrap stETH → wstETH (Ethereum mainnet rate from contract)
- [x] unwrap wstETH → stETH (Ethereum mainnet rate from contract)
- [x] balance/rewards queries (on-chain reads)
- [x] At least 1 governance action (lido_vote — reads real DAO proposals)
- [x] All write ops support dry_run
- [x] No mocks — Ethereum mainnet contracts via separate provider
- [x] lido.skill.md with rebasing explainer, wstETH vs stETH tradeoffs, safe patterns
- [x] Dual network: Ethereum mainnet/Holesky for Lido + Base Sepolia for treasury

## Verified on Ethereum Mainnet

```
1 stETH = 0.813 wstETH (live rate from wstETH.getWstETHByStETH())
Total DAO votes: 199 (from lidoDAO.votesLength())
Last finalized withdrawal: #118573 (from withdrawalQueue.getLastFinalizedRequestId())
```

## Network Architecture

- **Ethereum mainnet provider** → stETH staking, wstETH wrap/unwrap, DAO voting, withdrawal queue
- **Base Sepolia provider** → StakeHumanSignal treasury, job contracts
- Each network has its own `ethers.JsonRpcProvider` — no cross-network calls

Previous bug: ALL contracts used Base Sepolia provider. Fixed: mainnet contracts now use `ETH_RPC_URL`.

## Key Files
- `lido-mcp/index.js` — 9 tools, dual-provider architecture
- `lido-mcp/contracts.js` — ETH_MAINNET + ETH_HOLESKY + BASE addresses, verified from docs.lido.fi
- `lido-mcp/lido.skill.md` — full Lido mental model (rebasing, wstETH vs stETH, safe patterns)
- `lido-mcp/vault-monitor.js` — APY monitoring + alerts
- `lido-mcp/lido-mcp.test.js` — 7 tests passing

## Contract Sources
- Mainnet: https://docs.lido.fi/deployed-contracts
- Holesky: https://docs.lido.fi/deployed-contracts/holesky
- DAO Aragon Voting: `0x2e59A20f205bB85a89C53f1936454680651E618e` (was wrong, fixed)

## Verify
```bash
cd lido-mcp && npm test                  # 7 tests pass
# Live mainnet read test:
node -e "import {ethers} from 'ethers'; import {ETH_MAINNET,WSTETH_ABI} from './contracts.js'; const p=new ethers.JsonRpcProvider(ETH_MAINNET.rpc); const c=new ethers.Contract(ETH_MAINNET.wstETH,WSTETH_ABI,p); console.log('1 stETH =',ethers.formatEther(await c.getWstETHByStETH(ethers.parseEther('1'))),'wstETH')" --input-type=module
```
