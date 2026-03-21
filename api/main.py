"""StakeHumanSignal API — FastAPI backend for staked human feedback marketplace."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import reviews, jobs, outcomes
from api.routes.agent import router as agent_router
from api.routes.leaderboard import router as leaderboard_router

app = FastAPI(
    title="StakeHumanSignal",
    description="Staked human feedback marketplace — humans stake crypto on AI review quality, agents pay via x402, winners earn Lido stETH yield.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(outcomes.router, prefix="/outcomes", tags=["outcomes"])
app.include_router(agent_router)
app.include_router(leaderboard_router)


@app.get("/")
async def root():
    return {
        "name": "StakeHumanSignal",
        "description": "Staked human feedback marketplace",
        "endpoints": {
            "GET /reviews": "Public review list (free)",
            "GET /reviews/top": "Ranked reviews (x402-gated: 0.001 USDC on Base)",
            "POST /reviews": "Submit a review + stake proof",
            "POST /jobs": "Create ERC-8183 job on-chain",
            "GET /jobs/{id}": "Job status",
            "POST /outcomes": "Signal a winner (agent-only)",
        },
        "standards": ["ERC-8183", "ERC-8004"],
        "network": "base-mainnet",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
