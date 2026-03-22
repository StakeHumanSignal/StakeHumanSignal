"""Run 10+ Olas mech requests for the Hire an Agent track."""

import asyncio
from api.services.olas import batch_query_olas

PROMPTS = [
    "Evaluate code review quality for Python async patterns",
    "Score trading strategy analysis for BTC/USD volatility",
    "Assess customer support response tone for fintech",
    "Rate data extraction accuracy from medical notes",
    "Compare creative marketing copy for Web3 tools",
    "Evaluate API response quality for code debugging",
    "Score model comparison for natural language reasoning",
    "Assess error handling quality in distributed systems",
    "Rate documentation quality for developer onboarding",
    "Compare LLM outputs for technical writing tasks",
    "Evaluate security audit quality for smart contracts",
    "Score performance analysis for database queries",
]


async def main():
    print(f"Sending {len(PROMPTS)} requests to Olas mech...")
    results = await batch_query_olas(PROMPTS)
    for i, r in enumerate(results):
        print(f"  [{i+1}] mode={r['mode']} tool={r['tool']}")
    print(f"\nCompleted {len(results)} Olas mech requests")


if __name__ == "__main__":
    asyncio.run(main())
