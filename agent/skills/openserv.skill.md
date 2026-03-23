# OpenServ Integration — Skill Reference

## Official Resources
- **Platform**: https://platform.openserv.ai
- **Docs**: https://docs.openserv.ai
- **SDK (npm)**: `@openserv-labs/sdk` v2.4.1 — https://github.com/openserv-labs/sdk
- **Client (npm)**: `@openserv-labs/client` v2.5.3 — https://github.com/openserv-labs/client
- **Agent Tutorial**: https://github.com/openserv-labs/agent-tutorial
- **ERC-8004 Scanner**: https://www.8004scan.io

## Mental Model

OpenServ is a platform for building multi-agent AI systems. Two packages:

| Package | Purpose |
|---------|---------|
| `@openserv-labs/sdk` | Agent runtime — define capabilities, handle tasks, run HTTP server with auto-tunnel |
| `@openserv-labs/client` | Platform management — `provision()`, `triggers`, `erc8004`, `payments` |

**Key concepts:**
- **Agent** = Express server with capabilities (tools). Created via `new Agent({ systemPrompt })`.
- **Capability** = A named tool. Two types: **Runnable** (has `run()` function + `inputSchema`) or **Run-less** (platform LLM handles it).
- **Workspace** = Execution environment where agents collaborate on tasks.
- **Trigger** = How workflows are started: `webhook`, `x402` (paid), `cron`, `manual`.
- **BRAID** = OpenServ's proprietary reasoning framework powering shadow agents.

## Architecture

```
Client code
  → provision() — registers agent + workflow + trigger on platform
  → run(agent) — starts Express server + WebSocket tunnel to OpenServ proxy

Platform receives request (webhook/x402/cron)
  → Creates workspace execution
  → Dispatches action to agent via tunnel: { type: "do-task", task, workspace }
  → Agent runs capability → returns result
  → Platform marks execution complete
```

## Agent Creation (SDK)

```typescript
import { Agent, run } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are a helpful assistant.',
  // Optional: port, apiKey, openaiApiKey, mcpServers, onError
})

// Runnable capability (your code runs)
agent.addCapability({
  name: 'score_review',
  description: 'Score a review with 5-dim rubric',
  inputSchema: z.object({ review_text: z.string(), task_intent: z.string() }),
  async run({ args, action }) {
    // `this` = Agent instance. Use this.generate(), this.createTask(), etc.
    return JSON.stringify({ score: 0.85, verdict: 'validated' })
  }
})

// Run-less capability (platform LLM handles it — no run function)
agent.addCapability({
  name: 'summarize',
  description: 'Summarize the input text in 2-3 sentences.'
  // No inputSchema needed (defaults to { input: z.string() })
})
```

## Agent API Methods (available as `this.X()` inside run functions)

**Task management (inter-agent communication):**
- `createTask({ workspaceId, assignee, description, body, input, expectedOutput })`
- `getTaskDetail({ workspaceId, taskId })` → status + output
- `getTasks({ workspaceId })` → list all tasks
- `completeTask({ workspaceId, taskId, output })`
- `updateTaskStatus({ workspaceId, taskId, status })` — 'to-do'|'in-progress'|'done'|'error'
- `addLogToTask({ workspaceId, taskId, severity, type, body })`

**LLM generation:**
- `generate({ prompt, action, messages?, outputSchema? })` — uses OpenServ runtime (no OpenAI key needed)
- `process({ messages })` — direct OpenAI calls (needs OPENAI_API_KEY)

**Discovery:**
- `getAgents({ workspaceId })` → agent names + capabilities
- `getSecrets({ workspaceId })` / `getSecretValue({ workspaceId, secretId })`

**Files:** `getFiles()`, `uploadFile()`, `deleteFile()`
**Chat:** `sendChatMessage()`, `getChatMessages()`
**Human:** `requestHumanAssistance({ workspaceId, taskId, type, question })`
**Integrations:** `callIntegration({ workspaceId, integrationId, details })`

## Provisioning (Client)

```typescript
import { provision, triggers } from '@openserv-labs/client'

const result = await provision({
  agent: { instance: agent, name: 'My Agent', description: '...' },
  workflow: {
    name: 'My Workflow',
    goal: 'Process requests',
    trigger: triggers.x402({ price: '0.01', walletAddress: '0x...', name: 'Paid Service' }),
    task: { description: 'Handle the request' },
    // Multi-task:
    // tasks: [{ name: 'step1', agentId: 123 }, { name: 'step2' }],
    // edges: [{ from: 'trigger:x402', to: 'task:step1' }, { from: 'task:step1', to: 'task:step2' }],
  },
})
// result: { agentId, workflowId, triggerId, triggerToken, apiEndpoint, paywallUrl }
```

State saved to `.openserv.json` (idempotent — safe to re-run).

## Trigger Types

| Type | Usage | URL Pattern |
|------|-------|-------------|
| `triggers.webhook()` | Free API access | `POST /webhooks/trigger/{token}` |
| `triggers.x402()` | Paid (USDC on Base) | `POST /webhooks/x402/trigger/{token}` |
| `triggers.cron()` | Scheduled | N/A (platform fires automatically) |
| `triggers.manual()` | Testing | Triggered from platform UI |

## x402 Protocol (Real Crypto Payments)

HTTP 402 Payment Required protocol. USDC on Base blockchain.
1. Client → GET endpoint → 402 response with payment requirements
2. Client signs EIP-3009 TransferWithAuthorization (off-chain USDC approval)
3. Client → retry with `X-PAYMENT` header → 200 with result

**Key**: `triggers.x402({ price, walletAddress })` — price in USD (e.g., "0.001")
**Paywall (human)**: `https://platform.openserv.ai/workspace/paywall/{token}`
**API (machine)**: `https://api.openserv.ai/webhooks/x402/trigger/{token}`

## ERC-8004 On-Chain Agent Identity

```typescript
const { PlatformClient } = require('@openserv-labs/client')
const client = new PlatformClient()
await client.authenticate('0xPRIVATE_KEY')

const result = await client.erc8004.registerOnChain({
  workflowId: 123,
  privateKey: '0x...',
  name: 'My Agent',
  description: '...',
  chainId: 8453,  // Base mainnet (default)
})
// result: { agentId: "8453:42", ipfsCid, txHash, agentCardUrl, blockExplorerUrl, scanUrl }
```

Mints NFT on Base, uploads Agent Card to IPFS, discoverable at 8004scan.io.

## Inter-Agent Communication Patterns

**Same workspace**: Use `createTask({ assignee: otherAgentId })`
**Cross-workspace**: Call other agent's webhook via `fetch()`:
```typescript
const resp = await fetch('https://api.openserv.ai/webhooks/trigger/{token}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: '...' }),
})
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENSERV_API_KEY` | Yes | Agent API key |
| `OPENAI_API_KEY` | No | Only for `process()` |
| `PORT` | No (7378) | Agent server port |
| `DISABLE_TUNNEL` | No | Set `true` for production |
| `OPENSERV_AUTH_TOKEN` | No | Set by `provision()` |

## Our Integration (StakeHumanSignal)

**Agents:**
- Scorer (ID 4045, workspace 13064) — scores reviews with 5-dim rubric
- Coordinator (ID 4046, workspace 13065) — orchestrates pipeline, x402 monetized

**Flow:**
```
x402 payment → Coordinator Agent
  → fetch /reviews/top from StakeHumanSignal API
  → delegate scoring to Scorer Agent (webhook call)
  → validate/reject based on confidence threshold
  → signal outcomes → on-chain settlement (ERC-8183 + ERC-8004 + Lido + Filecoin)
```

**Backend integration:** `GET /openserv/agents`, `GET /openserv/status`, `POST /openserv/evaluate`
**Frontend integration:** Agent feed page has OpenServ Multi-Agent panel

## Key Gotchas

1. `generate()` delegates to OpenServ runtime — no OpenAI key needed. `process()` needs your own key.
2. `action` parameter MUST be passed to `generate()` for billing context.
3. `this` inside `run()` refers to the Agent instance — use it for API calls.
4. `.openserv.json` stores state. Add to `.gitignore`. Contains API keys.
5. x402 wallets need USDC on Base. ERC-8004 needs ETH on Base for gas.
6. Capabilities are stored as `.tools[]` on the Agent instance (not `.capabilities[]`).
7. Tunnel auto-reconnects with exponential backoff (max 10 retries).
8. Webhook fire endpoint is `POST /webhooks/trigger/{token}` (not `/fire`).

## Files

```
openserv/
├── src/
│   ├── scorer-agent.ts       # Scorer: score_review, score_batch
│   ├── coordinator-agent.ts  # Coordinator: fetch, score (via scorer webhook), decide, signal
│   ├── index.ts              # Starts both agents with tunnels
│   ├── provision.ts          # Registers agents + workflows (Mode 1: individual, Mode 2: multi-agent)
│   ├── register-erc8004.ts   # Mints ERC-8004 identity NFT on Base
│   └── test.ts               # 36 tests
├── package.json
├── tsconfig.json
└── .openserv.json            # State (gitignored, contains keys)
```
