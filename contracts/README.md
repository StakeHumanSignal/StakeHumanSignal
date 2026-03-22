# contracts/ — Solidity Smart Contracts

**Tracks:** ERC-8183 Open Build (Virtuals) | Agents With Receipts ERC-8004 (Protocol Labs) | stETH Agent Treasury (Lido)

## What This Does

Four Solidity contracts that implement the on-chain backbone of StakeHumanSignal: job lifecycle (ERC-8183), receipt minting (ERC-8004), yield-bearing treasury (Lido wstETH), and blind A/B comparison escrow.

## Contracts

| Contract | Standard | Purpose |
|----------|----------|---------|
| `StakeHumanSignalJob.sol` | ERC-8183 | Job lifecycle: createJob → fund → submit → complete → reject. Independence check via ReceiptRegistry. |
| `ReceiptRegistry.sol` | ERC-8004 | ERC-721 receipt NFTs. 3 registries: identity (`agentToOwner`), reputation (`getHumanReputationScore`), validation (per-receipt). |
| `LidoTreasury.sol` | — | wstETH principal locked forever. `distributeYield()` pays only accrued yield to winners. `onlyWhitelisted`, `nonReentrant`. |
| `SessionEscrow.sol` | — | Blind A/B compare escrow. Buyer locks USDC, human picks winner, settlement pays or refunds. |

## Deployed (Base Sepolia)

| Contract | Address |
|----------|---------|
| StakeHumanSignalJob | [`0xE99027DDdF153Ac6305950cD3D58C25D17E39902`](https://sepolia.basescan.org/address/0xE99027DDdF153Ac6305950cD3D58C25D17E39902) |
| LidoTreasury | [`0x8E29D161477D9BB00351eA2f69702451443d7bf5`](https://sepolia.basescan.org/address/0x8E29D161477D9BB00351eA2f69702451443d7bf5) |
| ReceiptRegistry | [`0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332`](https://sepolia.basescan.org/address/0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332) |
| SessionEscrow | [`0xe817C338aD7612184CFB59AeA7962905b920e2e9`](https://sepolia.basescan.org/address/0xe817C338aD7612184CFB59AeA7962905b920e2e9) |

Network: Base Sepolia (chainId 84532) | Deployer: `0x557E1E07652B75ABaA667223B11704165fC94d09`

## How to Test

```bash
# From repo root
npx hardhat test
```

Runs 91 Solidity tests covering job lifecycle, receipt minting, independence checks, yield distribution, and session escrow flows.

## Key Design Decisions

- **Independence check:** `StakeHumanSignalJob.complete()` calls `ReceiptRegistry.getIndependenceScore()` to prevent self-review (reviewer === agent owner).
- **Yield-only treasury:** `LidoTreasury.totalPrincipal` is locked forever. Only `balance - principal` is distributable. This means the yield pool grows as stETH accrues rebasing rewards.
- **ERC-8004 triple registry:** One contract serves identity (agent→owner mapping), reputation (avg win rate across owned agents), and validation (per-receipt metadata).

## Key Files

- `StakeHumanSignalJob.sol` — ERC-8183 job lifecycle + independence check
- `LidoTreasury.sol` — wstETH yield-only treasury
- `ReceiptRegistry.sol` — ERC-8004 receipts + ownership + reputation
- `SessionEscrow.sol` — Blind A/B compare escrow
- `interfaces/IERC8183.sol` — ERC-8183 interface definition
