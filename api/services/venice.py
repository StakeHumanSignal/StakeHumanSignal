"""Venice API — private LLM scoring for reviews."""

import os
import json
import httpx

VENICE_BASE = "https://api.venice.ai/api/v1"


async def score_review_privately(review_text: str, api_output: str) -> dict:
    """Score a review privately using Venice LLM.

    Returns: {"score": 0-100, "reasoning": "..."}
    """
    api_key = os.getenv("VENICE_API_KEY")
    if not api_key:
        return {"score": 50, "reasoning": "Venice API key not configured — default score"}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{VENICE_BASE}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "llama-3.3-70b",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a private review scorer for StakeHumanSignal marketplace. "
                            "Analyze the review quality against the actual API output. "
                            "Score criteria: accuracy (40%), depth (30%), actionability (30%). "
                            "Return ONLY a JSON object: {\"score\": 0-100, \"reasoning\": \"one sentence\"}"
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Review: {review_text}\n\nAPI Output sample: {api_output[:500]}",
                    },
                ],
                "venice_parameters": {"include_venice_system_prompt": False},
            },
        )

    if response.status_code != 200:
        return {"score": 50, "reasoning": f"Venice API error: {response.status_code}"}

    content = response.json()["choices"][0]["message"]["content"]
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {"score": 50, "reasoning": content[:200]}
