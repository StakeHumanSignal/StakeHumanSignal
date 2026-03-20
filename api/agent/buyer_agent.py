"""StakeHumanSignal Buyer Agent — autonomous loop.

Queries reviews via x402, scores privately with Venice,
completes ERC-8183 jobs, distributes yield, mints receipts.
"""

import asyncio
import json
import os
import time
from pathlib import Path

import httpx

LOG_FILE = Path("agent_log.json")
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")


def log(msg: str, **kwargs):
    entry = {"timestamp": time.time(), "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "message": msg, **kwargs}
    existing = json.loads(LOG_FILE.read_text()) if LOG_FILE.exists() else []
    existing.append(entry)
    LOG_FILE.write_text(json.dumps(existing, indent=2))
    print(f"[AGENT] {msg}")


async def fetch_top_reviews() -> list[dict]:
    """Fetch ranked reviews via x402 payment."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{API_BASE}/reviews/top")
            data = resp.json()
            return data.get("reviews", [])
    except Exception as e:
        log(f"Fetch error: {e}", action="error")
        return []


async def score_with_venice(reviews: list[dict]) -> list[dict]:
    """Score each review privately using Venice LLM."""
    from api.services.venice import score_review_privately

    scored = []
    for review in reviews:
        result = await score_review_privately(
            review.get("review_text", ""),
            review.get("api_url", ""),
        )
        review["score"] = result.get("score", 50)
        review["reasoning"] = result.get("reasoning", "")
        scored.append(review)

    scored.sort(key=lambda r: r.get("score", 0), reverse=True)
    return scored


async def complete_and_reward(winner: dict):
    """Complete the ERC-8183 job and signal outcome."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{API_BASE}/outcomes",
                json={
                    "job_id": winner.get("job_id", 0),
                    "winner_address": winner["reviewer_address"],
                    "review_id": winner["id"],
                    "score": winner["score"],
                    "reasoning": winner.get("reasoning", ""),
                },
            )
            return resp.json()
    except Exception as e:
        log(f"Complete error: {e}", action="error")
        return {}


async def run():
    """Main autonomous agent loop."""
    log("Agent starting autonomous loop", action="start")

    cycle = 0
    while True:
        cycle += 1
        log(f"Cycle {cycle} starting", action="cycle_start")

        try:
            # 1. Fetch top reviews (via x402 in production)
            reviews = await fetch_top_reviews()
            log(f"Fetched {len(reviews)} reviews", action="fetch", count=len(reviews))

            if not reviews:
                log("No reviews available, waiting...", action="wait")
                await asyncio.sleep(60)
                continue

            # 2. Score privately with Venice LLM
            scored = await score_with_venice(reviews)
            log(f"Scored {len(scored)} reviews with Venice", action="score")

            # 3. Pick winner (highest score)
            winner = scored[0]
            log(
                f"Selected winner: {winner['reviewer_address']}, "
                f"score={winner['score']}, stake={winner.get('stake_amount', 0)}",
                action="select",
                winner=winner["reviewer_address"],
                score=winner["score"],
            )

            # 4. Complete job on-chain + mint receipt + store on Filecoin
            result = await complete_and_reward(winner)
            log(
                f"Completed job, tx={result.get('complete_tx')}, "
                f"receipt={result.get('receipt_token_id')}, "
                f"cid={result.get('filecoin_cid')}",
                action="complete",
                tx=result.get("complete_tx"),
                receipt_id=result.get("receipt_token_id"),
                cid=result.get("filecoin_cid"),
            )

        except Exception as e:
            log(f"Error in cycle {cycle}: {str(e)}", action="error")

        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(run())
