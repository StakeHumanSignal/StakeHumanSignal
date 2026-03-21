"""Agent routes — expose agent_log.json via API."""

from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter(prefix="/agent", tags=["agent"])

LOG_FILE = Path("agent_log.json")


@router.get("/log")
async def get_agent_log():
    """Return agent decision log entries."""
    if not LOG_FILE.exists():
        return []
    try:
        return json.loads(LOG_FILE.read_text())
    except Exception:
        return []
