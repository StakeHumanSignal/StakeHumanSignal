# Demo Script — 2 minutes hard cap

## Pre-record setup
- API running on Railway (live)
- Frontend on Vercel (live)
- Terminal ready for buyer agent command
- Basescan tab open

## Flow

```
0:00 — Open stakehumansignal.vercel.app
       "Staked human feedback marketplace for AI agents"
       Show hero + stats

0:15 — Click Marketplace
       Show 10 review cards with confidence bars + x402 gate
       "Each review is a structured A/B claim with rubric scores"

0:30 — Click Submit Review
       Connect wallet (MetaMask popup)
       "Reviewer connects wallet, submits claim, stakes USDC"
       Drag rubric sliders, show live score

0:45 — Open terminal, run:
       python -m api.agent.buyer_agent --once
       "Agent fetches reviews, scores them, makes decisions"

1:00 — Click Agent Feed
       Show real log entries updating live
       "Every decision logged — x402 payments, scoring, validation"

1:15 — Open Basescan tab
       Show ReceiptRegistry contract
       Show receipt mint TX
       "Real ERC-8004 receipt on Base Sepolia"

1:30 — Show deployments/sepolia.json
       "4 contracts deployed: Job, Treasury, Registry, Escrow"

1:40 — Click Validate page
       "Human B does blind A/B compare — settlement pays yield"

1:50 — Show Filecoin CID in browser
       Open gateway.lighthouse.storage/ipfs/{CID}
       "Every review stored permanently on Filecoin"

1:55 — End: "Humans stake skin. Agents buy truth. Yield flows forever."
```

## What NOT to show
- Don't demo the form for 30 seconds
- Don't show terminal scrolling — pre-run agent
- Don't explain code — show PRODUCT
- Don't promise mainnet — we're on Sepolia (honest)
