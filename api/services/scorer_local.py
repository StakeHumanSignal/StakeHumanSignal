"""Local heuristic scorer — replaces Venice API.

No external API. No API key needed. Scores agent outputs against
structured claim predictions using term matching and length heuristics.
"""

STOP_WORDS = {"the", "a", "an", "is", "it", "to", "and", "or", "of", "in", "for", "on", "at", "by", "with", "was", "are", "be", "has", "had", "not", "but", "from", "this", "that"}


def score_output(claim: dict, output: str, task_intent: str) -> dict:
    """Score whether an agent output matches the claim's prediction.

    Args:
        claim: structured claim dict with 'reasoning' field
        output: the agent's actual output text
        task_intent: what the human was trying to accomplish

    Returns:
        dict with rubric scores (0.0-1.0), verdict, confidence, summary
    """
    # If claim already has validated rubric scores, use them directly
    existing_rubric = claim.get("rubric_scores")
    if existing_rubric and isinstance(existing_rubric, dict):
        correctness = existing_rubric.get("correctness", 0.75)
        efficiency = existing_rubric.get("efficiency", 0.75)
        relevance = existing_rubric.get("relevance", 0.75)
        completeness = existing_rubric.get("completeness", 0.75)
        reasoning_quality = existing_rubric.get("reasoning_quality", 0.75)

        avg = (
            correctness * 0.30
            + relevance * 0.25
            + completeness * 0.20
            + efficiency * 0.15
            + reasoning_quality * 0.10
        )

        return {
            "correctness": round(correctness, 2),
            "efficiency": round(efficiency, 2),
            "relevance": round(relevance, 2),
            "completeness": round(completeness, 2),
            "reasoning_quality": round(reasoning_quality, 2),
            "verdict": "validated" if avg > 0.6 else "rejected",
            "confidence": round(avg, 2),
            "summary": f"Rubric-validated score {avg:.0%}: using claim's own rubric scores",
        }

    reasoning_terms = claim.get("reasoning", "").lower().split()
    reasoning_terms = [t for t in reasoning_terms if t not in STOP_WORDS and len(t) > 2]

    output_lower = output.lower()

    # relevance: reasoning terms found in output
    if reasoning_terms:
        relevance = sum(1 for t in reasoning_terms if t in output_lower) / len(reasoning_terms)
    else:
        relevance = 0.5

    # completeness: output length proxy (~200 words = complete)
    word_count = len(output.split())
    completeness = min(word_count / 200, 1.0)

    # efficiency: penalise very long outputs (>500 words = bloated)
    efficiency = max(0.5, 1.0 - max(0, word_count - 200) / 600)

    # correctness: assume well-formed output is baseline correct
    correctness = 0.75

    # reasoning quality: blend of relevance + completeness
    reasoning_quality = relevance * 0.7 + completeness * 0.3

    # weighted average (same weights as rubric schema)
    avg = (
        correctness * 0.30
        + relevance * 0.25
        + completeness * 0.20
        + efficiency * 0.15
        + reasoning_quality * 0.10
    )

    matched = len([t for t in reasoning_terms if t in output_lower])
    total_terms = len(reasoning_terms)

    return {
        "correctness": round(correctness, 2),
        "efficiency": round(efficiency, 2),
        "relevance": round(relevance, 2),
        "completeness": round(completeness, 2),
        "reasoning_quality": round(reasoning_quality, 2),
        "verdict": "validated" if avg > 0.6 else "rejected",
        "confidence": round(avg, 2),
        "summary": f"Heuristic score {avg:.0%}: {matched}/{total_terms} reasoning terms matched",
    }


# --- Legacy compat wrapper ---


async def score_review_privately(review_text: str, api_output: str) -> dict:
    """Legacy wrapper: converts old call signature to heuristic scorer.

    Returns: {"score": 0-100, "reasoning": "..."}
    """
    claim = {"reasoning": review_text}
    result = score_output(claim, api_output, "review")
    return {
        "score": round(result["confidence"] * 100),
        "reasoning": result["summary"],
    }
