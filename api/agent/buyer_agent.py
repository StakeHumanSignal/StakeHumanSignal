"""StakeHumanSignal Buyer Agent — autonomous loop.

Queries reviews via x402, scores with local heuristic scorer,
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


def score_reviews_heuristic(reviews: list[dict]) -> list[dict]:
    """Score each review using local heuristic scorer."""
    from api.services.venice import score_output

    scored = []
    for review in reviews:
        claim = {"reasoning": review.get("reasoning", review.get("review_text", ""))}
        task_intent = review.get("task_intent", "general review")
        result = score_output(claim, review.get("api_url", ""), task_intent)

        review["score"] = round(result["confidence"] * 100)
        review["reasoning"] = result.get("summary", "")
        review["verdict"] = result["verdict"]
        review["rubric_scores"] = {
            k: result[k] for k in ["correctness", "efficiency", "relevance", "completeness", "reasoning_quality"]
        }
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


async def pin_agent_log():
    """Pin current agent_log.json to Filecoin for immutable decision trail."""
    try:
        if not LOG_FILE.exists():
            return
        entries = json.loads(LOG_FILE.read_text())
        from api.services.filecoin import store_agent_log
        cid = await store_agent_log(entries)
        if cid:
            log(f"Agent log pinned to Filecoin: {cid}", action="pin", logCID=cid)
    except Exception as e:
        log(f"Failed to pin agent log: {e}", action="pin_error")


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

            # 2. Score with local heuristic scorer
            scored = score_reviews_heuristic(reviews)
            log(f"Scored {len(scored)} reviews with heuristic scorer", action="score")

            # 3. Process each scored review: complete or reject
            for review in scored:
                verdict = review.get("verdict", "rejected")
                confidence = review.get("score", 0) / 100

                log(
                    f"Heuristic: {review.get('id', '?')} verdict={verdict} "
                    f"confidence={confidence:.2f}",
                    action="heuristic_score",
                    claim_id=review.get("id"),
                    task_intent=review.get("task_intent", ""),
                    verdict=verdict,
                    confidence=confidence,
                )

                if verdict == "validated" and confidence > 0.6:
                    result = await complete_and_reward(review)
                    log(
                        f"Completed job, tx={result.get('complete_tx')}, "
                        f"receipt={result.get('receipt_token_id')}",
                        action="complete",
                        tx=result.get("complete_tx"),
                        receipt_id=result.get("receipt_token_id"),
                        cid=result.get("filecoin_cid"),
                    )
                else:
                    log(
                        f"Rejected review {review.get('id', '?')}: "
                        f"verdict={verdict}, confidence={confidence:.2f}",
                        action="reject",
                        claim_id=review.get("id"),
                    )

            # 5. Pin agent_log.json to Filecoin for immutable decision trail
            await pin_agent_log()

        except Exception as e:
            log(f"Error in cycle {cycle}: {str(e)}", action="error")

        await asyncio.sleep(60)


if __name__ == "__main__":
    asyncio.run(run())
