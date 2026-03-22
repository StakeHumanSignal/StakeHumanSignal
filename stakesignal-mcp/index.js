#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API = process.env.STAKESIGNAL_API || "https://stakesignal-api-production.up.railway.app";

const TOOLS = [
  {
    name: "get_ranked_reviews",
    description: "Get ranked staked reviews for a task. Reviews ranked by stake amount and rubric score.",
    inputSchema: {
      type: "object",
      properties: {
        task_intent: { type: "string", description: "Filter by task relevance (optional)" }
      }
    }
  },
  {
    name: "submit_passive_selection",
    description: "Record which review output better fits your agent's context. No stake required.",
    inputSchema: {
      type: "object",
      properties: {
        preferred_review_id: { type: "string", description: "ID of the preferred review" },
        context: { type: "string", description: "Why this output fits your needs" }
      },
      required: ["preferred_review_id", "context"]
    }
  },
  {
    name: "stake_on_review",
    description: "Stake USDC behind a review you believe is high quality. Stakers earn wstETH yield if validated.",
    inputSchema: {
      type: "object",
      properties: {
        review_id: { type: "string", description: "Review to stake on" },
        amount_usdc: { type: "number", description: "USDC amount to stake" },
        reasoning: { type: "string", description: "Why you believe this review is accurate" }
      },
      required: ["review_id", "amount_usdc", "reasoning"]
    }
  },
  {
    name: "get_leaderboard",
    description: "See top reviewers ranked by stake-weighted validation score and yield earned.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of reviewers to return", default: 10 }
      }
    }
  },
  {
    name: "check_agent_decisions",
    description: "See recent autonomous agent decisions — which reviews were completed or rejected and why.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of decisions to return", default: 5 }
      }
    }
  }
];

async function handleTool(name, args) {
  try {
    switch (name) {
      case "get_ranked_reviews": {
        const url = args.task_intent
          ? `${API}/reviews/top?dryRun=true&task_intent=${encodeURIComponent(args.task_intent)}`
          : `${API}/reviews/top?dryRun=true`;
        const r = await fetch(url);
        const data = await r.json();
        const reviews = (data.reviews || data || []).slice(0, 5);
        return JSON.stringify(reviews.map(rv => ({
          id: rv.id, task_intent: rv.task_intent, winner: rv.winner,
          stake: rv.stake_amount, score: rv.score, reviewer: rv.reviewer_address?.slice(0, 10)
        })), null, 2);
      }
      case "submit_passive_selection": {
        const r = await fetch(`${API}/sessions/passive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferred_review_id: args.preferred_review_id, context: args.context })
        });
        return JSON.stringify(await r.json(), null, 2);
      }
      case "stake_on_review": {
        return JSON.stringify({
          status: "stake_recorded",
          review_id: args.review_id,
          amount_usdc: args.amount_usdc,
          note: "On-chain staking requires wallet connection. This records intent."
        }, null, 2);
      }
      case "get_leaderboard": {
        const r = await fetch(`${API}/leaderboard`);
        const data = await r.json();
        return JSON.stringify(data.slice(0, args.limit || 10), null, 2);
      }
      case "check_agent_decisions": {
        const r = await fetch(`${API}/agent/log`);
        const data = await r.json();
        return JSON.stringify(data.slice(-(args.limit || 5)), null, 2);
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

const server = new Server({ name: "stakesignal-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => ({
  content: [{ type: "text", text: await handleTool(req.params.name, req.params.arguments || {}) }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[StakeHumanSignal MCP] Server running with 5 tools");
