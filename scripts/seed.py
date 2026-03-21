"""Seed the API with 5 realistic reviews for demo/UAT."""

import httpx
import sys

API = "http://localhost:8000"

REVIEWS = [
    {
        "reviewer_address": "0x557E1E07652B75ABaA667223B11704165fC94d09",
        "task_intent": "evaluate Python async error handling across two LLM policies",
        "task_type": "code_review",
        "winner": "policy_a",
        "reasoning": "Policy A produced specific exception types with stack context. Policy B gave generic error messages.",
        "stake_amount": 2.5,
        "stake_tx_hash": "0x3dee4cc1a2f9c8b3e4d5f6a7b8c9d0e1f2a3b4c5",
        "api_url": "https://api.openai.com",
        "review_text": "Policy A produced specific exception types with stack context",
        "rubric_scores": {"correctness": 0.88, "efficiency": 0.75, "relevance": 0.92, "completeness": 0.85, "reasoning_quality": 0.90},
    },
    {
        "reviewer_address": "0x742d35Cc6634C0532925a3b8D4C9b8F1e2A3B4C5",
        "task_intent": "compare trading strategy analysis for BTC/USD volatility",
        "task_type": "analysis",
        "winner": "policy_b",
        "reasoning": "Policy B incorporated implied volatility and volume-weighted signals. Policy A only used price action.",
        "stake_amount": 5.0,
        "stake_tx_hash": "0x7f29a7b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
        "api_url": "https://api.anthropic.com",
        "review_text": "Policy B incorporated implied volatility and volume-weighted signals",
        "rubric_scores": {"correctness": 0.82, "efficiency": 0.80, "relevance": 0.88, "completeness": 0.91, "reasoning_quality": 0.85},
    },
    {
        "reviewer_address": "0x9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B",
        "task_intent": "assess customer support response tone for fintech users",
        "task_type": "customer_support",
        "winner": "policy_a",
        "reasoning": "Policy A maintained professional empathy while Policy B was too formal and missed the emotional context.",
        "stake_amount": 1.0,
        "stake_tx_hash": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
        "api_url": "https://api.openai.com",
        "review_text": "Policy A maintained professional empathy",
        "rubric_scores": {"correctness": 0.79, "efficiency": 0.85, "relevance": 0.87, "completeness": 0.72, "reasoning_quality": 0.83},
    },
    {
        "reviewer_address": "0x557E1E07652B75ABaA667223B11704165fC94d09",
        "task_intent": "extract structured data from unstructured medical notes",
        "task_type": "data_extraction",
        "winner": "policy_a",
        "reasoning": "Policy A correctly identified all ICD-10 codes. Policy B missed chronic condition flags.",
        "stake_amount": 3.0,
        "stake_tx_hash": "0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
        "api_url": "https://api.anthropic.com",
        "review_text": "Policy A correctly identified all ICD-10 codes",
        "rubric_scores": {"correctness": 0.93, "efficiency": 0.70, "relevance": 0.89, "completeness": 0.94, "reasoning_quality": 0.88},
    },
    {
        "reviewer_address": "0x742d35Cc6634C0532925a3b8D4C9b8F1e2A3B4C5",
        "task_intent": "generate creative marketing copy for Web3 developer tools",
        "task_type": "creative",
        "winner": "tie",
        "reasoning": "Both policies produced compelling copy. Policy A had better hooks but Policy B had stronger CTAs.",
        "stake_amount": 1.5,
        "stake_tx_hash": "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
        "api_url": "https://api.openai.com",
        "review_text": "Both policies produced compelling copy",
        "rubric_scores": {"correctness": 0.75, "efficiency": 0.88, "relevance": 0.91, "completeness": 0.78, "reasoning_quality": 0.80},
    },
]


def main():
    ok = 0
    for i, review in enumerate(REVIEWS):
        try:
            r = httpx.post(f"{API}/reviews", json=review, timeout=10)
            if r.status_code == 200:
                data = r.json()
                print(f"  [{i+1}] OK id={data.get('id')} cid={str(data.get('filecoin_cid','none'))[:30]}")
                ok += 1
            else:
                print(f"  [{i+1}] FAIL {r.status_code}: {r.text[:100]}")
        except Exception as e:
            print(f"  [{i+1}] ERROR: {e}")

    print(f"\nSeeded {ok}/{len(REVIEWS)} reviews")
    if ok < len(REVIEWS):
        sys.exit(1)


if __name__ == "__main__":
    main()
