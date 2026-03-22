"""Seed the /validate page with 3 blind A/B comparison sessions."""

import httpx
import json
import asyncio

API = "https://stakesignal-api-production.up.railway.app"

SESSIONS = [
    {
        "open": {
            "claim_id": "claim-json-extraction",
            "reviewer_address": "0x557E1E07652B75ABaA667223B11704165fC94d09",
            "reward_usdc": 5.0,
            "prompt": "Generate structured JSON from unstructured customer feedback: 'Your product is great but pricing could be clearer. Support response time was excellent though.'",
            "buyer_address": "0xBuyerAgent0000000000000000000000000000001",
        },
        "outputs": {
            "output_a": "{'sentiment': 'positive', 'topics': ['pricing', 'support'], 'score': 8.5, 'summary': 'Customer satisfied overall, minor pricing concern'}",
            "output_b": "{'sentiment': 'positive', 'themes': ['pricing clarity', 'support quality'], 'nps_estimate': 8, 'key_quote': 'Support response time was excellent', 'action_items': ['clarify pricing page', 'maintain support SLA'], 'confidence': 0.91}",
            "model_a": "gpt-4o",
            "model_b": "claude-3.5-sonnet",
            "shuffled": False,
        },
    },
    {
        "open": {
            "claim_id": "claim-tech-summary",
            "reviewer_address": "0x742d35Cc6634C0532925a3b8D4C9b8F1e2A3B4C5",
            "reward_usdc": 3.0,
            "prompt": "Summarize this technical architecture for non-technical stakeholders: 'The system uses event-driven microservices with Kafka message queues, PostgreSQL for persistence, and Redis for caching. Services communicate asynchronously via CQRS pattern.'",
            "buyer_address": "0xBuyerAgent0000000000000000000000000000002",
        },
        "outputs": {
            "output_a": "The system uses microservices connected by message queues. Each service handles one business domain. Data is stored in PostgreSQL and frequently accessed data is cached in Redis for speed.",
            "output_b": "Think of the system as a team of specialists. Each person (service) handles one job and passes notes (messages) to colleagues when something changes. There is a shared filing cabinet (database) and a quick-access whiteboard (cache) so nobody has to wait. If one specialist is busy, the others keep working independently.",
            "model_a": "gpt-4o",
            "model_b": "claude-3.5-sonnet",
            "shuffled": True,
        },
    },
    {
        "open": {
            "claim_id": "claim-cold-email",
            "reviewer_address": "0x9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B",
            "reward_usdc": 2.5,
            "prompt": "Write a cold outreach email for a B2B data pipeline SaaS targeting engineering teams that recently scaled past 50 engineers.",
            "buyer_address": "0xBuyerAgent0000000000000000000000000000003",
        },
        "outputs": {
            "output_a": "Hi [Name],\n\nI wanted to reach out about our platform that helps companies like yours save time on data processing. Our tool automates pipeline management so your engineers can focus on building features. Would you be open to a 15-minute call this week?\n\nBest,\n[Sender]",
            "output_b": "Hi [Name],\n\nNoticed [Company] recently scaled past 50 engineers — congrats. At that size, data pipeline bottlenecks usually cost 2-3 eng hours per week per team. We cut that to 20 minutes for teams like Notion and Linear.\n\nWorth a 15-min look? Happy to share the case study.\n\n[Sender]",
            "model_a": "gpt-4o",
            "model_b": "claude-3.5-sonnet",
            "shuffled": False,
        },
    },
]


async def seed():
    async with httpx.AsyncClient(timeout=30) as client:
        for i, session in enumerate(SESSIONS):
            # Step 1: Open session
            r1 = await client.post(f"{API}/sessions/open", json=session["open"])
            if r1.status_code not in [200, 201]:
                print(f"Session {i+1}: OPEN FAILED — {r1.status_code} {r1.text[:100]}")
                continue
            data = r1.json()
            sid = data.get("session_id", "?")
            print(f"Session {i+1}: OPENED — id={sid}")

            # Step 2: Record outputs
            r2 = await client.post(f"{API}/sessions/{sid}/outputs", json=session["outputs"])
            if r2.status_code not in [200, 201]:
                print(f"Session {i+1}: OUTPUTS FAILED — {r2.status_code} {r2.text[:100]}")
                continue
            print(f"Session {i+1}: READY — outputs recorded, status=generated")

        # Verify
        r3 = await client.get(f"{API}/sessions")
        data = r3.json()
        count = data.get("count", 0)
        print(f"\nTotal sessions on API: {count}")


asyncio.run(seed())
