"""Tests for Filecoin FOC storage integration."""

import json
import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch


MOCK_CID = "bafylocal1234567890abcdef1234567890abcdef12345678"


def _make_response(status_code, json_data):
    """Create a mock httpx.Response."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data
    return resp


def _patch_client(method, response):
    """Patch httpx.AsyncClient for a single request."""
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    setattr(mock_client, method, AsyncMock(return_value=response))
    return mock_client


class TestStoreReview:
    """store_review() stores review data and returns CID."""

    @pytest.mark.asyncio
    async def test_store_review_returns_cid(self):
        from api.services.filecoin import store_review

        resp = _make_response(200, {"cid": MOCK_CID})
        mock_client = _patch_client("post", resp)

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            cid = await store_review({"review_text": "test", "api_url": "https://api.openai.com"})
            assert cid == MOCK_CID

            # Verify posted content is structured
            call_args = mock_client.post.call_args
            body = call_args.kwargs["json"]
            content = json.loads(body["content"])
            assert content["type"] == "review"
            assert content["version"] == "1.0"
            assert content["data"]["review_text"] == "test"

    @pytest.mark.asyncio
    async def test_store_review_returns_none_on_failure(self):
        from api.services.filecoin import store_review

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            cid = await store_review({"review_text": "test"})
            assert cid is None


class TestStoreAgentLog:
    """store_agent_log() stores log entries and returns CID."""

    @pytest.mark.asyncio
    async def test_store_agent_log_returns_cid(self):
        from api.services.filecoin import store_agent_log

        resp = _make_response(200, {"cid": MOCK_CID})
        mock_client = _patch_client("post", resp)

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            entries = [{"action": "fetch", "message": "test"}]
            cid = await store_agent_log(entries)
            assert cid == MOCK_CID

            call_args = mock_client.post.call_args
            body = call_args.kwargs["json"]
            content = json.loads(body["content"])
            assert content["type"] == "agent_log"
            assert content["entries"] == entries


class TestRetrieve:
    """retrieve() returns parsed dict from CID."""

    @pytest.mark.asyncio
    async def test_retrieve_returns_dict(self):
        from api.services.filecoin import retrieve

        stored_data = {"type": "review", "data": {"text": "hello"}}
        resp = _make_response(200, {"content": json.dumps(stored_data), "cid": MOCK_CID})
        mock_client = _patch_client("get", resp)

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            result = await retrieve(MOCK_CID)
            assert result["type"] == "review"
            assert result["data"]["text"] == "hello"

    @pytest.mark.asyncio
    async def test_retrieve_returns_none_on_failure(self):
        from api.services.filecoin import retrieve

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.get = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            result = await retrieve(MOCK_CID)
            assert result is None


class TestLegacyCompat:
    """Legacy store_on_filecoin / retrieve_from_filecoin still work."""

    @pytest.mark.asyncio
    async def test_legacy_store(self):
        from api.services.filecoin import store_on_filecoin

        resp = _make_response(200, {"cid": MOCK_CID})
        mock_client = _patch_client("post", resp)

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            cid = await store_on_filecoin({"key": "value"})
            assert cid == MOCK_CID

    @pytest.mark.asyncio
    async def test_legacy_retrieve(self):
        from api.services.filecoin import retrieve_from_filecoin

        stored = {"key": "value"}
        resp = _make_response(200, {"content": json.dumps(stored), "cid": MOCK_CID})
        mock_client = _patch_client("get", resp)

        with patch("api.services.filecoin.httpx.AsyncClient", return_value=mock_client):
            result = await retrieve_from_filecoin(MOCK_CID)
            assert result == stored
