"""Send 10+ Olas mech requests on Base mainnet to meet track requirement."""

import asyncio
import json
import time
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from api.services.olas import query_olas_mech

PROMPTS = [
    "Rate this AI review quality 1-10: Policy A produced accurate async error handling with proper exception types.",
    "Evaluate which model is better for code review: the one that catches edge cases or the one with cleaner syntax.",
    "Score this human feedback: 'Claude gives more structured responses for data extraction tasks than GPT-4o.'",
    "Assess review credibility: reviewer staked 5 USDC claiming Model A handles JSON parsing better.",
    "Rate signal quality: 'For customer support tasks, shorter responses with action items outperform detailed explanations.'",
    "Evaluate claim: 'GPT-4o is 40% faster for summarization but Claude is more accurate for technical content.'",
    "Score this A/B comparison: reviewer picked Policy B for async Python, reasoning: better await patterns.",
    "Assess review: 'The API with structured output mode reduces hallucination by 60% compared to free-form.'",
    "Rate this evaluation: 'For code generation, the model that produces tests alongside code is strictly better.'",
    "Evaluate: 'Staked reviewers who specialize in one domain have 3x higher accuracy than generalists.'",
    "Score this meta-review: 'Reviews with specific examples are 5x more useful than reviews with only ratings.'",
    "Assess: 'The two-layer signal model (passive + active) produces more calibrated rankings than pure stake weighting.'",
]


async def main():
    print(f"=== Olas Mech Batch Requests ({len(PROMPTS)} prompts) ===")
    print(f"Mech: {os.getenv('OLAS_MECH_ADDRESS', '0xe535d7ac...')}")
    print(f"Chain: Base mainnet\n")

    results = []
    for i, prompt in enumerate(PROMPTS):
        print(f"Request {i+1}/{len(PROMPTS)}: {prompt[:60]}...")
        result = await query_olas_mech(prompt)
        mode = result.get("mode", "?")
        req_id = result.get("request_id", "")[:20]
        print(f"  → {mode} | request_id={req_id}...")
        results.append(result)
        if i < len(PROMPTS) - 1:
            await asyncio.sleep(5)  # Rate limit for on-chain TXs

    live = sum(1 for r in results if r["mode"] == "live")
    errors = sum(1 for r in results if r["mode"] == "error")
    demo = sum(1 for r in results if r["mode"] == "demo")

    print(f"\n=== RESULTS: {live} live, {errors} errors, {demo} demo ===")

    if live >= 10:
        print("PASS: 10+ live mech requests completed on Base mainnet")
    else:
        print(f"NEED MORE: only {live} live requests (need 10)")

    # Save results
    proof_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                              "deployments", "olas-mech-proof.json")
    proof = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "chain": "base",
        "mech": os.getenv("OLAS_MECH_ADDRESS", "0xe535d7acdeed905dddcb5443f41980436833ca2b"),
        "total_requests": len(results),
        "live_requests": live,
        "results": results,
    }
    with open(proof_file, "w") as f:
        json.dump(proof, f, indent=2)
    print(f"\nProof saved to {proof_file}")


asyncio.run(main())
