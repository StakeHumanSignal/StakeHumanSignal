"""StakeHumanSignal Buyer Agent — autonomous loop.

Queries reviews via x402 payment gateway, scores with local heuristic scorer,
completes ERC-8183 jobs, distributes yield, mints receipts.
Pins agent_log.json to Filecoin after each cycle.
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

import httpx

LOG_FILE = Path("agent_log.json")
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
X402_GATEWAY = os.getenv("X402_GATEWAY_URL", "")


def log(msg: str, **kwargs):
    entry = {"timestamp": time.time(), "iso": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "message": msg, **kwargs}
    existing = json.loads(LOG_FILE.read_text()) if LOG_FILE.exists() else []
    existing.append(entry)
    LOG_FILE.write_text(json.dumps(existing, indent=2))
    print(f"[AGENT] {msg}")


async def fetch_top_reviews_x402() -> list[dict]:
    """Fetch ranked reviews via x402 payment — real EIP-3009 signed payment.

    Uses x402 Python SDK to auto-handle 402 challenges:
    1. GET /reviews/top → receives 402 with payment challenge
    2. SDK signs EIP-3009 transferWithAuthorization using agent's private key
    3. Retries with PAYMENT-SIGNATURE header containing real signature
    4. Facilitator verifies signature + USDC balance
    5. Reviews returned
    """
    # Try real x402 client with EIP-3009 payment signing
    try:
        from x402 import x402Client, x402ClientConfig, SchemeRegistration
        from x402.mechanisms.evm import EthAccountSigner
        from x402.mechanisms.evm.exact import ExactEvmClientScheme
        from eth_account import Account

        pk = os.getenv("PRIVATE_KEY") or os.getenv("BASE_SEPOLIA_PRIVATE_KEY")
        if pk:
            account = Account.from_key(pk if pk.startswith("0x") else f"0x{pk}")
            signer = EthAccountSigner(account)
            scheme = ExactEvmClientScheme(signer)

            x402_client = x402Client(
                payment_requirements_selector=None,
            )
            x402_client.register(SchemeRegistration(
                scheme_id="exact",
                network_id="eip155:84532",
                client=scheme,
            ))

            # x402 client auto-handles 402 → sign → retry
            response = await x402_client.get(f"{API_BASE}/reviews/top")
            data = response.json() if hasattr(response, "json") else response
            log(
                f"Fetched reviews via x402 SDK (real EIP-3009 payment)",
                action="x402_payment",
                endpoint="/reviews/top",
                amount="0.001 USDC",
                mode="x402_sdk",
                wallet=account.address,
            )
            reviews = data.get("reviews", data if isinstance(data, list) else [])
            return reviews
    except Exception as e:
        log(f"x402 SDK payment failed: {str(e)[:100]}", action="x402_payment", mode="sdk_error")

    # Fallback: direct API with manual 402 handling
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{API_BASE}/reviews/top")

            if resp.status_code == 402:
                log(
                    "x402 gate returned 402 — payment required",
                    action="x402_payment",
                    endpoint="/reviews/top",
                    amount="0.001 USDC",
                    mode="402_received",
                    challenge=resp.text[:200],
                )
                # Cannot pay without x402 SDK — return empty
                return []

            data = resp.json()
            log(
                f"Fetched {len(data.get('reviews', data if isinstance(data, list) else []))} reviews",
                action="x402_payment",
                endpoint="/reviews/top",
                status=resp.status_code,
            )
            return data.get("reviews", data if isinstance(data, list) else [])
    except Exception as e:
        log(f"Fetch error: {e}", action="error")
        return []


def score_reviews_heuristic(reviews: list[dict]) -> list[dict]:
    """Score each review using local heuristic scorer."""
    from api.services.scorer_local import score_output

    scored = []
    for review in reviews:
        claim = {
            "reasoning": review.get("reasoning", review.get("review_text", "")),
            "rubric_scores": review.get("rubric_scores"),
        }
        task_intent = review.get("task_intent", "general review")
        result = score_output(claim, review.get("review_text", review.get("reasoning", "")), task_intent)

        review["score"] = round(result["confidence"] * 100)
        review["reasoning"] = result.get("summary", "")
        review["verdict"] = result["verdict"]
        review["rubric_scores"] = {
            k: result[k] for k in ["correctness", "efficiency", "relevance", "completeness", "reasoning_quality"]
        }
        scored.append(review)

    scored.sort(key=lambda r: r.get("score", 0), reverse=True)
    return scored


async def score_with_bankr_ensemble(reviews: list[dict]) -> list[dict]:
    """Additional scoring via Bankr LLM Gateway (if API key set)."""
    from api.services.bankr import score_with_bankr, BANKR_KEY

    if not BANKR_KEY:
        return reviews  # skip if no key

    for review in reviews:
        result = await score_with_bankr(
            review.get("review_text", review.get("reasoning", "")),
            review.get("task_intent", "general review"),
        )
        review["bankr_score"] = result.get("score", 50)
        review["bankr_reasoning"] = result.get("reasoning", "")

        # Blend: 70% heuristic + 30% Bankr
        heuristic_score = review.get("score", 50)
        blended = round(heuristic_score * 0.7 + review["bankr_score"] * 0.3)
        review["score"] = blended

        log(
            f"Bankr ensemble: {review.get('id', '?')} "
            f"heuristic={heuristic_score} bankr={review['bankr_score']} blended={blended}",
            action="bankr_score",
            claim_id=review.get("id"),
            bankr_score=review["bankr_score"],
            blended_score=blended,
        )

    return reviews


async def complete_and_reward(winner: dict):
    """Complete the ERC-8183 job and signal outcome."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            payload = {
                    "job_id": winner.get("job_id") or 0,
                    "winner_address": winner["reviewer_address"],
                    "review_id": winner["id"],
                    "score": winner["score"],
                    "reasoning": winner.get("reasoning", ""),
                    "rubric_scores": winner.get("rubric_scores"),
                    "source_claim_id": winner.get("id"),
                    "outcome_validated": winner.get("verdict") == "validated",
                }
            resp = await client.post(f"{API_BASE}/outcomes", json=payload)
            if resp.status_code != 200:
                log(f"Outcomes API error {resp.status_code}: {resp.text[:200]}", action="error")
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


async def run_cycle(cycle: int) -> bool:
    """Run a single agent cycle. Returns True if reviews were processed."""
    log(f"Cycle {cycle} starting", action="cycle_start")

    # 1. Fetch top reviews via x402
    reviews = await fetch_top_reviews_x402()
    log(f"Fetched {len(reviews)} reviews", action="fetch", count=len(reviews))

    if not reviews:
        log("No reviews available", action="wait")
        return False

    # 2. Score with local heuristic scorer
    scored = score_reviews_heuristic(reviews)
    log(f"Scored {len(scored)} reviews with heuristic scorer", action="score")

    # 2b. Ensemble scoring via Bankr LLM Gateway (if configured)
    scored = await score_with_bankr_ensemble(scored)

    # 2c. Query Olas mech for external intelligence (if configured)
    try:
        from api.services.olas import query_olas_mech
        if os.getenv("OLAS_MECH_ADDRESS"):
            for review in scored[:3]:  # top 3 reviews only
                olas_result = await query_olas_mech(
                    f"Evaluate review quality: {review.get('task_intent', '')}",
                    tool="prediction-online"
                )
                log(
                    f"Olas mech: {review.get('id', '?')} mode={olas_result.get('mode')}",
                    action="olas_query",
                    claim_id=review.get("id"),
                    olas_mode=olas_result.get("mode"),
                    olas_tool=olas_result.get("tool"),
                )
    except Exception as e:
        pass  # Olas is supplementary

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

    # 4. Log Locus wallet status (if configured)
    try:
        from api.services.locus import get_balance
        locus_balance = await get_balance()
        if locus_balance.get("mode") != "demo":
            log(
                f"Locus balance: {locus_balance.get('balance', '?')} USDC",
                action="locus_balance",
                balance=locus_balance.get("balance"),
                mode=locus_balance.get("mode"),
            )
    except Exception:
        pass  # Locus is supplementary

    # 5. Pin agent_log.json to Filecoin
    await pin_agent_log()

    return True


async def run(once: bool = False):
    """Main autonomous agent loop."""
    log("Agent starting autonomous loop", action="start")

    cycle = 0
    while True:
        cycle += 1
        try:
            await run_cycle(cycle)
        except Exception as e:
            log(f"Error in cycle {cycle}: {str(e)}", action="error")

        if once:
            log("Single cycle complete (--once mode)", action="stop")
            break

        await asyncio.sleep(60)


if __name__ == "__main__":
    once_mode = "--once" in sys.argv
    asyncio.run(run(once=once_mode))
