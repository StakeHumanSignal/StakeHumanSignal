"""Tests for buyer agent autonomous loop."""

import json
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch


MOCK_REVIEWS = [
    {
        "id": "rev1",
        "api_url": "https://api.openai.com/v1/chat/completions",
        "review_text": "Good error handling with retry logic patterns",
        "reviewer_address": "0x557E1E07652B75ABaA667223B11704165fC94d09",
        "stake_amount": 10.0,
        "task_intent": "evaluate error handling quality",
        "reasoning": "found retry logic and error handling patterns",
        "score": None,
        "job_id": 0,
    }
]


class TestFetchTopReviews:
    """fetch_top_reviews_x402() fetches via x402 gateway or fallback."""

    @pytest.mark.asyncio
    async def test_fetch_returns_list_mock_mode(self):
        from api.agent.buyer_agent import fetch_top_reviews_x402

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"reviews": MOCK_REVIEWS, "count": 1}

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(return_value=mock_resp)

        with patch("api.agent.buyer_agent.httpx.AsyncClient", return_value=mock_client):
            reviews = await fetch_top_reviews_x402()
            assert isinstance(reviews, list)
            assert len(reviews) == 1
            assert reviews[0]["id"] == "rev1"

    @pytest.mark.asyncio
    async def test_fetch_returns_empty_on_failure(self):
        from api.agent.buyer_agent import fetch_top_reviews_x402
        import httpx

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))

        with patch("api.agent.buyer_agent.httpx.AsyncClient", return_value=mock_client):
            reviews = await fetch_top_reviews_x402()
            assert reviews == []


class TestScoreReviewsHeuristic:
    """score_reviews_heuristic() scores each review and sorts by confidence."""

    def test_scores_each_review(self):
        from api.agent.buyer_agent import score_reviews_heuristic

        reviews = [r.copy() for r in MOCK_REVIEWS]
        scored = score_reviews_heuristic(reviews)
        assert len(scored) == 1
        assert "verdict" in scored[0]
        assert "rubric_scores" in scored[0]
        assert scored[0]["score"] is not None

    def test_sorts_by_score_descending(self):
        from api.agent.buyer_agent import score_reviews_heuristic

        reviews = [
            {**MOCK_REVIEWS[0], "id": "a", "reasoning": "xyz unlikely terms"},
            {**MOCK_REVIEWS[0], "id": "b", "reasoning": "error handling retry logic patterns"},
        ]
        scored = score_reviews_heuristic(reviews)
        assert scored[0]["score"] >= scored[1]["score"]


class TestRunCycle:
    """run_cycle() executes one full agent cycle."""

    @pytest.mark.asyncio
    async def test_run_cycle_with_reviews(self, tmp_path):
        from api.agent import buyer_agent

        # Use temp log file
        log_file = tmp_path / "agent_log.json"
        buyer_agent.LOG_FILE = log_file

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"reviews": MOCK_REVIEWS, "count": 1}

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(return_value=mock_resp)
        mock_client.post = AsyncMock(return_value=MagicMock(
            status_code=200,
            json=MagicMock(return_value={"complete_tx": "0xmock", "receipt_token_id": 0}),
        ))

        with patch("api.agent.buyer_agent.httpx.AsyncClient", return_value=mock_client):
            with patch("api.agent.buyer_agent.pin_agent_log", new_callable=AsyncMock):
                result = await buyer_agent.run_cycle(1)

        assert log_file.exists()
        entries = json.loads(log_file.read_text())
        actions = [e.get("action") for e in entries]
        assert "x402_payment" in actions
        assert "heuristic_score" in actions
        # Should have either complete or reject
        assert "complete" in actions or "reject" in actions

    @pytest.mark.asyncio
    async def test_run_cycle_no_reviews(self, tmp_path):
        from api.agent import buyer_agent

        log_file = tmp_path / "agent_log.json"
        buyer_agent.LOG_FILE = log_file

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"reviews": [], "count": 0}

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(return_value=mock_resp)

        with patch("api.agent.buyer_agent.httpx.AsyncClient", return_value=mock_client):
            result = await buyer_agent.run_cycle(1)
            assert result is False


class TestOnceMode:
    """--once flag exits after single cycle."""

    @pytest.mark.asyncio
    async def test_once_mode_exits(self, tmp_path):
        from api.agent import buyer_agent

        log_file = tmp_path / "agent_log.json"
        buyer_agent.LOG_FILE = log_file

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"reviews": [], "count": 0}

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(return_value=mock_resp)

        with patch("api.agent.buyer_agent.httpx.AsyncClient", return_value=mock_client):
            # run(once=True) should return without looping forever
            await buyer_agent.run(once=True)

        entries = json.loads(log_file.read_text())
        actions = [e.get("action") for e in entries]
        assert "start" in actions
        assert "stop" in actions
