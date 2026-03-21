"""Bankr LLM Gateway — multi-model ensemble scoring for reviews.

Uses Bankr's unified API (OpenAI-compatible) to access 20+ models.
Provides ensemble scoring by averaging results from multiple LLMs.
Docs: https://docs.bankr.bot/llm-gateway/overview
"""

import json
import os

import httpx

BANKR_BASE = "https://llm.bankr.bot/v1"

# Models for ensemble scoring — fast + accurate mix
ENSEMBLE_MODELS = [
    "claude-sonnet-4-6",
    "gemini-2.5-flash",
]

SCORING_PROMPT = (
    "You are a review quality scorer for StakeHumanSignal, a staked feedback marketplace. "
    "Evaluate how accurately the review describes the API's actual output quality. "
    "Score criteria: accuracy (40%), depth of analysis (30%), actionability (30%). "
    'Return ONLY a JSON object: {"score": 0-100, "reasoning": "one sentence"}'
)


async def _call_bankr(model: str, review_text: str, api_output: str) -> dict:
    """Call a single model via Bankr LLM Gateway."""
    api_key = os.getenv("BANKR_API_KEY")
    if not api_key:
        return {"score": 50, "reasoning": "Bankr API key not configured", "model": model}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{BANKR_BASE}/chat/completions",
                headers={
                    "X-API-Key": api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": SCORING_PROMPT},
                        {
                            "role": "user",
                            "content": f"Review: {review_text}\n\nAPI Output sample: {api_output[:500]}",
                        },
                    ],
                },
            )

        if response.status_code != 200:
            return {"score": 50, "reasoning": f"Bankr API error: {response.status_code}", "model": model}

        content = response.json()["choices"][0]["message"]["content"]
        result = json.loads(content)
        result["model"] = model
        return result

    except json.JSONDecodeError:
        return {"score": 50, "reasoning": content[:200] if content else "Parse error", "model": model}
    except Exception as e:
        return {"score": 50, "reasoning": str(e)[:200], "model": model}


async def score_with_bankr_ensemble(review_text: str, api_output: str) -> dict:
    """Score a review using multiple LLMs via Bankr and average the results.

    Returns: {"score": 0-100, "reasoning": "...", "models_used": [...], "scores": [...]}
    """
    results = []
    for model in ENSEMBLE_MODELS:
        result = await _call_bankr(model, review_text, api_output)
        results.append(result)

    scores = [r.get("score", 50) for r in results]
    avg_score = sum(scores) / len(scores) if scores else 50

    return {
        "score": round(avg_score, 1),
        "reasoning": results[0].get("reasoning", "") if results else "",
        "models_used": [r.get("model", "") for r in results],
        "individual_scores": scores,
    }


async def score_with_bankr_single(review_text: str, api_output: str, model: str = "claude-sonnet-4-6") -> dict:
    """Score a review using a single model via Bankr.

    Returns: {"score": 0-100, "reasoning": "...", "model": "..."}
    """
    return await _call_bankr(model, review_text, api_output)
