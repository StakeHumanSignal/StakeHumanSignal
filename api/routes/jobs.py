"""Job routes — ERC-8183 job lifecycle management."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# In-memory job tracker (mirrors on-chain state)
jobs_db: dict[int, dict] = {}


class JobCreate(BaseModel):
    api_url: str
    review_hash: str
    reviewer_address: str
    budget: float


class JobResponse(BaseModel):
    job_id: int
    api_url: str
    reviewer_address: str
    budget: float
    status: str
    deliverable_hash: Optional[str] = None
    tx_hash: Optional[str] = None


@router.post("", response_model=JobResponse)
async def create_job(job: JobCreate):
    """Create an ERC-8183 job on-chain.

    In production, this calls the StakeHumanSignalJob contract.
    Returns the job ID and transaction hash.
    """
    from api.services.web3_client import get_web3_service

    web3_svc = get_web3_service()
    result = await web3_svc.create_job(
        api_url=job.api_url,
        review_hash=job.review_hash,
        reviewer_address=job.reviewer_address,
    )

    job_entry = {
        "job_id": result["job_id"],
        "api_url": job.api_url,
        "reviewer_address": job.reviewer_address,
        "budget": job.budget,
        "status": "open",
        "deliverable_hash": None,
        "tx_hash": result.get("tx_hash"),
    }
    jobs_db[result["job_id"]] = job_entry
    return JobResponse(**job_entry)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int):
    """Get ERC-8183 job status."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**jobs_db[job_id])


@router.get("")
async def list_jobs():
    """List all jobs."""
    return {"jobs": list(jobs_db.values()), "count": len(jobs_db)}
