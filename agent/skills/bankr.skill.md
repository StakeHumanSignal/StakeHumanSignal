# Skill: Bankr LLM Gateway
## Track: Best Bankr LLM Gateway Use — $5,000 pool

## What the judge wants
- Use Bankr LLM Gateway as load-bearing inference
- Real on-chain execution tied to LLM output
- Bonus: self-sustaining economics (fees fund inference)

## API (verified)
```
Base URL: https://llm.bankr.bot
Auth: X-API-Key: bk_YOUR_KEY (get at bankr.bot/api)

POST /v1/chat/completions (OpenAI-compatible)
{
  "model": "claude-sonnet-4-20250514",
  "messages": [{"role": "user", "content": "..."}]
}

Response: standard OpenAI shape
{ "choices": [{"message": {"content": "..."}}] }
```

## Available models
Claude, Gemini (Vertex AI), GPT (via OpenRouter)

## Where to inject in our codebase
File: `api/services/bankr.py` (DELETED in Phase 13 — recreate)
Injection point: `buyer_agent.py` → after heuristic scoring, use Bankr for ensemble validation

## Pattern
```python
import os, httpx

BANKR_URL = "https://llm.bankr.bot/v1/chat/completions"
BANKR_KEY = os.getenv("BANKR_API_KEY", "")

async def score_with_bankr(review_text: str, task_intent: str) -> dict:
    if not BANKR_KEY:
        return {"score": 50, "reasoning": "Bankr API key not set"}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(BANKR_URL, headers={"X-API-Key": BANKR_KEY}, json={
            "model": "claude-sonnet-4-20250514",
            "messages": [
                {"role": "system", "content": "Score this review 0-100. Return JSON: {score, reasoning}"},
                {"role": "user", "content": f"Review: {review_text}\nTask: {task_intent}"}
            ]
        })
        # parse response
```

## Do NOT
- Don't change ReceiptRegistry.sol
- Don't change scorer.py weights
- Don't remove heuristic scorer — Bankr is ADDITIONAL signal

## Verify
```bash
grep "bankr" agent_log.json | tail -5
python3 -c "from api.services.bankr import score_with_bankr; print('OK')"
```

## Env var
BANKR_API_KEY=bk_... (add to .env.example + Railway)
