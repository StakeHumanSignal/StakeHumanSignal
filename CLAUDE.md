## SECURITY — READ THIS FIRST, EVERY SESSION

### Hard rules — never violate these:
- NEVER hardcode private keys, API keys, mnemonics, or secrets anywhere in code. Always use `os.getenv()` in Python, `process.env` in JS. If a value looks like a key, it goes in `.env`.
- NEVER log private keys, seeds, or secrets to console, files, or `agent_log.json` — even in error handlers.
- NEVER commit `.env` files. Check `.gitignore` before every commit.
- NEVER use `tx.origin` for authorization in Solidity — use `msg.sender`.
- NEVER send ETH/tokens before updating state (checks-effects-interactions).
- NEVER leave TODO or placeholder addresses (`0x000...000`) in deployed contracts.
- ALWAYS validate inputs: check for `address(0)`, zero amounts, empty strings before processing.
- ALWAYS use OpenZeppelin `ReentrancyGuard` on any function that transfers tokens or ETH.
- ALWAYS use OpenZeppelin `Ownable` or `AccessControl` for admin functions.
- BEFORE every git commit, run: `git diff --staged | grep -i "private\|secret\|key\|mnemonic\|0x[a-fA-F0-9]{64}"` and abort if anything matches.

### Python-specific:
- Load secrets with: `os.getenv("VAR_NAME")`
- Add None checks: `if not os.getenv("PRIVATE_KEY"): raise ValueError("PRIVATE_KEY not set")`
- `agent_log.json` must NEVER contain: private_key, seed, mnemonic, api_key, secret, bearer token values

### Solidity-specific:
- Every external function that moves funds needs: `nonReentrant` modifier
- Access control: owner → agent → public (nothing that moves funds is fully public)
- Use events for every state change
- Test with zero values before mainnet (`amount=0`, `address(0)`)

### Testnet-first rule:
- ALWAYS deploy to Base Sepolia first, verify it works, THEN deploy to Base Mainnet
- Never deploy directly to mainnet without a passing Sepolia deployment

---

## Project: StakeHumanSignal

Staked human feedback marketplace on Base Mainnet. ERC-8183 + ERC-8004 + x402.

### Package Management
- Use `bun add` for JS packages, `pip install` for Python
- Use `npx hardhat` for compile/deploy/verify (NOT bun — Hardhat native module issue)

### Key Commands
- Compile: `npx hardhat compile`
- Test: `npx hardhat test`
- Deploy Sepolia: `npx hardhat run scripts/deploy-sepolia.js --network base-sepolia`
- Deploy Mainnet: `npx hardhat run scripts/deploy.js --network base`
- API: `uvicorn api.main:app --reload --port 8000`
- x402: `bun run x402-server/index.js`
- Agent: `python -m api.agent.buyer_agent`

### Architecture
- `contracts/` — 3 Solidity contracts (ERC-8183, Lido Treasury, ERC-8004 Receipts)
- `api/` — Python FastAPI backend
- `x402-server/` — Node.js x402 payment gateway
- `scripts/` — Hardhat deploy scripts
- `test/` — Hardhat contract tests
- `agent/` — Project reference docs (commands, files, memory, tools)
- `docs/` — gitignored private specs and design docs
