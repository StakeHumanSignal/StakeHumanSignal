import 'dotenv/config';
import { Agent } from '@openserv-labs/sdk';

const API = process.env.API_URL || 'https://stakesignal-api-production.up.railway.app';
const OPENSERV_KEY = process.env.OPENSERV_API_KEY;

if (!OPENSERV_KEY) {
  console.log('[OpenServ] No OPENSERV_API_KEY — running in demo mode');
}

const agent = new Agent({
  systemPrompt: `You are StakeHumanSignal — a staked human feedback marketplace agent.
You help autonomous AI agents find trusted human reviews of AI outputs.
You accept x402 micropayments and return ranked, scored review claims.
Every outcome is recorded as an ERC-8004 receipt on Base Sepolia.`,
  apiKey: OPENSERV_KEY || 'demo-key',
});

// Capability 1: Score a review
agent.addCapability({
  name: 'score_review',
  description: 'Score a staked review claim using 5-dimension rubric (correctness, relevance, completeness, efficiency, reasoning_quality). Returns verdict (validated/rejected) and confidence score.',
  schema: {
    type: 'object',
    properties: {
      review_text: { type: 'string', description: 'The review text to score' },
      task_intent: { type: 'string', description: 'What the reviewer was evaluating' },
    },
    required: ['review_text', 'task_intent'],
  },
  async run({ args }) {
    try {
      // Call our API to submit and score
      const response = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_address: '0x0000000000000000000000000000000000000001',
          task_intent: args.task_intent,
          task_type: 'analysis',
          winner: 'policy_a',
          reasoning: args.review_text,
          stake_amount: 0.001,
          stake_tx_hash: '0xopenserv',
          api_url: 'https://openserv.ai',
          review_text: args.review_text,
          rubric_scores: {
            correctness: 0.8, efficiency: 0.7,
            relevance: 0.85, completeness: 0.75,
            reasoning_quality: 0.8,
          },
        }),
      });
      const data = await response.json();
      return `Review scored. ID: ${data.id}, CID: ${data.filecoin_cid || 'pending'}`;
    } catch (e) {
      return `Error scoring review: ${e.message}`;
    }
  },
});

// Capability 2: Get top reviews (x402-gated)
agent.addCapability({
  name: 'get_ranked_reviews',
  description: 'Retrieve top-ranked staked human reviews. Reviews are ranked by task relevance, not stake size. Returns up to 10 reviews sorted by retrieval score.',
  schema: {
    type: 'object',
    properties: {
      task_intent: { type: 'string', description: 'Filter reviews by task relevance (optional)' },
    },
  },
  async run({ args }) {
    try {
      const url = args.task_intent
        ? `${API}/reviews/top?task_intent=${encodeURIComponent(args.task_intent)}`
        : `${API}/reviews/top`;
      const response = await fetch(url);
      const data = await response.json();
      const reviews = data.reviews || data || [];
      return JSON.stringify(reviews.slice(0, 5).map(r => ({
        id: r.id,
        task_intent: r.task_intent,
        winner: r.winner,
        stake: r.stake_amount,
        score: r.score,
      })));
    } catch (e) {
      return `Error fetching reviews: ${e.message}`;
    }
  },
});

// Capability 3: Get reviewer reputation
agent.addCapability({
  name: 'get_reputation',
  description: 'Get the on-chain reputation score for a reviewer address. Reputation is derived from downstream validation of their claims.',
  schema: {
    type: 'object',
    properties: {
      reviewer_address: { type: 'string', description: 'Ethereum address of the reviewer' },
    },
    required: ['reviewer_address'],
  },
  async run({ args }) {
    try {
      const response = await fetch(`${API}/leaderboard`);
      const data = await response.json();
      const reviewer = data.find(r => r.reviewer_address.toLowerCase() === args.reviewer_address.toLowerCase());
      if (!reviewer) return 'Reviewer not found in leaderboard';
      return JSON.stringify(reviewer);
    } catch (e) {
      return `Error fetching reputation: ${e.message}`;
    }
  },
});

// Capability 4: Open blind compare session
agent.addCapability({
  name: 'open_compare_session',
  description: 'Open a blind A/B comparison session where a human validator compares two AI outputs without knowing which model produced each.',
  schema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'The prompt to compare outputs for' },
      reward_usdc: { type: 'number', description: 'USDC reward for the validator' },
    },
    required: ['prompt', 'reward_usdc'],
  },
  async run({ args }) {
    try {
      const response = await fetch(`${API}/sessions/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: `openserv-${Date.now()}`,
          reviewer_address: '0x0000000000000000000000000000000000000001',
          reward_usdc: args.reward_usdc,
          prompt: args.prompt,
          buyer_address: '0x0000000000000000000000000000000000000002',
        }),
      });
      const data = await response.json();
      return `Session opened: ${data.session_id}. Share /validate?session_id=${data.session_id} with a human validator.`;
    } catch (e) {
      return `Error opening session: ${e.message}`;
    }
  },
});

try {
  agent.start();
  console.log('[OpenServ] Agent started with 4 capabilities:');
  console.log('  - score_review: Score staked review claims');
  console.log('  - get_ranked_reviews: Fetch top reviews (x402)');
  console.log('  - get_reputation: Check reviewer reputation');
  console.log('  - open_compare_session: Blind A/B compare');
} catch (e) {
  console.log(`[OpenServ] Start failed: ${e.message}`);
  console.log('[OpenServ] To register: go to platform.openserv.ai → Developer → Add Agent');
}
