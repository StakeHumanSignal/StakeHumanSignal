# Skill: OpenServ Multi-Agent
## Track: Ship Something Real — $4,500 pool

## What the judge wants
- Use OpenServ platform for multi-agent behavior
- Meaningful agentic economy product
- x402-native or ERC-8004 integration (bonus — we have both)

## SDK (verified)
```bash
npm install @openserv-labs/sdk
```

## Agent registration
1. Go to https://platform.openserv.ai
2. Login with Google → Developer → Add Agent
3. Get OPENSERV_API_KEY

## Pattern (TypeScript)
```typescript
import { Agent } from '@openserv-labs/sdk'

const agent = new Agent({
  systemPrompt: 'You are StakeHumanSignal buyer agent...',
  apiKey: process.env.OPENSERV_API_KEY
})

agent.addCapability({
  name: 'score_review',
  description: 'Score a staked review claim using heuristic rubric',
  schema: { type: 'object', properties: { review_id: { type: 'string' } } },
  async run({ args }) {
    const response = await fetch(`${API}/reviews/${args.review_id}`)
    // ... score logic
    return { score: 85, verdict: 'validated' }
  }
})

agent.start()
```

## Our integration point
- Expose buyer_agent capabilities as OpenServ worker
- Expose review scoring as callable capability
- Create openserv-worker/ directory with TypeScript agent

## Do NOT
- Don't rewrite buyer_agent.py — wrap it as OpenServ capability
- Don't move existing API routes

## Verify
```bash
node openserv-worker/index.js  # should start and register
```

## Env var
OPENSERV_API_KEY= (add to .env.example)
