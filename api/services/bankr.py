"""Bankr LLM Gateway — ensemble scoring via 20+ models."""

import os
import json
import httpx

BANKR_URL = "https://llm.bankr.bot/v1/chat/completions"
BANKR_KEY = os.getenv("BANKR_API_KEY", "")


async def score_with_bankr(review_text: str, task_intent: str) -> dict:
    """Score a review using Bankr LLM Gateway (OpenAI-compatible).

    Returns: {"score": 0-100, "reasoning": "...", "model": "..."}
    Falls back to default score if API key not set.
    """
    if not BANKR_KEY:
        return {"score": 50, "reasoning": "Bankr API key not set — using default", "model": "none"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                BANKR_URL,
                headers={"X-API-Key": BANKR_KEY},
                json={
                    "model": "claude-sonnet-4-20250514",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a review quality scorer for StakeHumanSignal marketplace. "
                                "Score the review quality 0-100 based on: specificity (40%), "
                                "evidence quality (30%), actionability (30%). "
                                "Return ONLY valid JSON: {\"score\": <number>, \"reasoning\": \"<one sentence>\"}"
                            ),
                        },
                        {
                            "role": "user",
                            "content": f"Review: {review_text}\n\nTask intent: {task_intent}",
                        },
                    ],
                },
            )

            if r.status_code != 200:
                return {"score": 50, "reasoning": f"Bankr API error: {r.status_code}", "model": "error"}

            content = r.json()["choices"][0]["message"]["content"]
            try:
                parsed = json.loads(content)
                parsed["model"] = "bankr-claude-sonnet"
                return parsed
            except json.JSONDecodeError:
                return {"score": 50, "reasoning": content[:200], "model": "bankr-parse-error"}

    except Exception as e:
        return {"score": 50, "reasoning": f"Bankr request failed: {str(e)}", "model": "error"}
