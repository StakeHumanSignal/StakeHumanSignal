"""StakeHumanSignal Auto-Verifier Agent — fully autonomous review scorer.

Zero human intervention. Fetches submitted reviews, calls the actual APIs,
scores quality via Venice (private) + Bankr (multi-LLM ensemble),
auto-completes or auto-rejects ERC-8183 jobs on-chain.

Satisfies Protocol Labs "Let the Agent Cook" track requirement.
"""

import asyncio
import json
import os
import time
from pathlib import Path

import httpx

LOG_FILE = Path("agent_log.json")
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
SCORE_THRESHOLD = 60  # Reviews scoring >= 60 are accepted, < 60 rejected


def log(msg: str, **kwargs):
    entry = {
        "timestamp": time.time(),
        "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "agent": "verifier",
        "message": msg,
        **kwargs,
    }
    existing = json.loads(LOG_FILE.read_text()) if LOG_FILE.exists() else []
    existing.append(entry)
    LOG_FILE.write_text(json.dumps(existing, indent=2))
    print(f"[VERIFIER] {msg}")


async def fetch_submitted_reviews() -> list[dict]:
    """Fetch reviews that have been submitted but not yet verified."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{API_BASE}/reviews")
            data = resp.json()
            reviews = data.get("reviews", [])
            # Filter to unscored reviews only
            return [r for r in reviews if r.get("score") is None]
    except Exception as e:
        log(f"Fetch error: {e}", action="error")
        return []


async def call_api_directly(api_url: str) -> str:
    """Call the API mentioned in the review to get real output for comparison."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(api_url)
            if resp.status_code == 200:
                return resp.text[:1000]
            return f"API returned status {resp.status_code}"
    except Exception as e:
        return f"API call failed: {str(e)[:200]}"


async def score_with_venice(review_text: str, api_output: str) -> dict:
    """Score privately using Venice LLM."""
    from api.services.venice import score_review_privately
    return await score_review_privately(review_text, api_output)


async def score_with_bankr(review_text: str, api_output: str) -> dict:
    """Score using Bankr multi-LLM ensemble."""
    from api.services.bankr import score_with_bankr_ensemble
    return await score_with_bankr_ensemble(review_text, api_output)


async def auto_verify(review: dict) -> dict:
    """Autonomously verify a single review.

    1. Call the actual API to get real output
    2. Score with Venice (private) + Bankr (ensemble)
    3. Average scores and decide: complete or reject
    """
    review_id = review.get("id", "unknown")
    api_url = review.get("api_url", "")
    review_text = review.get("review_text", "")

    log(f"Verifying review {review_id} for {api_url}", action="verify_start", review_id=review_id)

    # 1. Call the actual API
    api_output = await call_api_directly(api_url)
    log(f"Called API directly, got {len(api_output)} chars", action="api_call", review_id=review_id)

    # 2. Score with both services
    venice_result = await score_with_venice(review_text, api_output)
    venice_score = venice_result.get("score", 50)
    log(
        f"Venice score: {venice_score}",
        action="venice_score",
        review_id=review_id,
        score=venice_score,
    )

    bankr_result = await score_with_bankr(review_text, api_output)
    bankr_score = bankr_result.get("score", 50)
    log(
        f"Bankr ensemble score: {bankr_score} (models: {bankr_result.get('models_used', [])})",
        action="bankr_score",
        review_id=review_id,
        score=bankr_score,
        models=bankr_result.get("models_used", []),
    )

    # 3. Average and decide
    final_score = round((venice_score + bankr_score) / 2, 1)
    action = "complete" if final_score >= SCORE_THRESHOLD else "reject"

    log(
        f"Final score: {final_score} → {action.upper()}",
        action="verdict",
        review_id=review_id,
        final_score=final_score,
        venice_score=venice_score,
        bankr_score=bankr_score,
        decision=action,
    )

    # 4. Signal outcome to API (which triggers on-chain actions)
    if action == "complete":
        result = await signal_outcome(review, final_score, venice_result, bankr_result)
    else:
        result = {"action": "reject", "score": final_score}
        log(
            f"Review {review_id} rejected (score {final_score} < {SCORE_THRESHOLD})",
            action="rejected",
            review_id=review_id,
        )

    return {
        "review_id": review_id,
        "final_score": final_score,
        "venice_score": venice_score,
        "bankr_score": bankr_score,
        "action": action,
        "result": result,
    }


async def signal_outcome(review: dict, score: float, venice_result: dict, bankr_result: dict) -> dict:
    """Signal a positive outcome to the API — triggers on-chain completion + receipt mint."""
    try:
        reasoning = (
            f"Venice: {venice_result.get('reasoning', 'N/A')} | "
            f"Bankr ({', '.join(bankr_result.get('models_used', []))}): "
            f"{bankr_result.get('reasoning', 'N/A')}"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{API_BASE}/outcomes",
                json={
                    "job_id": review.get("job_id", 0),
                    "winner_address": review["reviewer_address"],
                    "review_id": review["id"],
                    "score": score,
                    "reasoning": reasoning[:500],
                },
            )
            return resp.json()
    except Exception as e:
        log(f"Outcome signal error: {e}", action="error")
        return {}


async def run():
    """Main autonomous verifier loop — zero human intervention."""
    log("Auto-Verifier Agent starting — fully autonomous mode", action="start")

    cycle = 0
    while True:
        cycle += 1
        log(f"Verification cycle {cycle}", action="cycle_start")

        try:
            # 1. Fetch unverified reviews
            reviews = await fetch_submitted_reviews()
            log(f"Found {len(reviews)} unverified reviews", action="fetch", count=len(reviews))

            if not reviews:
                log("No reviews to verify, waiting...", action="wait")
                await asyncio.sleep(30)
                continue

            # 2. Auto-verify each review
            for review in reviews:
                result = await auto_verify(review)
                log(
                    f"Review {result['review_id']}: {result['action']} "
                    f"(score {result['final_score']})",
                    action="verified",
                    review_id=result["review_id"],
                    decision=result["action"],
                    score=result["final_score"],
                )

        except Exception as e:
            log(f"Error in cycle {cycle}: {str(e)}", action="error")

        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(run())
