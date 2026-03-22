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
          ? `${API}/reviews/top?task_intent=${encodeURIComponent(args.task_intent)}`
          : `${API}/reviews/top`;
        const r = await fetch(url, {
          headers: { "x-402-payment": "mcp-stakesignal-agent" }
        });
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
        const r = await fetch(`${API}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewer_address: args.reviewer_address || "0xMCPAgent",
            api_url: "https://stakesignal-mcp",
            review_text: args.reasoning,
            stake_amount: args.amount_usdc,
            stake_tx_hash: "0xmcp-intent-" + Date.now().toString(16),
            task_intent: "stake on review " + args.review_id,
            task_type: "analysis",
            winner: "policy_a",
            reasoning: args.reasoning,
            rubric_scores: { correctness: 0.8, relevance: 0.8, completeness: 0.8, efficiency: 0.8, reasoning_quality: 0.8 },
          })
        });
        const data = await r.json();
        return JSON.stringify({
          status: "stake_submitted",
          review_id: args.review_id,
          amount_usdc: args.amount_usdc,
          created_review_id: data.id,
          filecoin_cid: data.filecoin_cid,
          note: "Stake intent recorded via API. Review stored on Filecoin.",
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
console.error("[StakeHumanSignal MCP] Server running with 5 tools — all hitting live API");
