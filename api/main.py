"""StakeHumanSignal API — FastAPI backend for staked human feedback marketplace.

x402 payment gate on /reviews/top using Coinbase CDP facilitator.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import reviews, jobs, outcomes
from api.routes.agent import router as agent_router
from api.routes.leaderboard import router as leaderboard_router
from api.routes.sessions import router as sessions_router

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

# --- x402 Payment Middleware (real Coinbase CDP verification) ---
X402_ENABLED = os.getenv("X402_ENABLED", "false").lower() == "true"
if not X402_ENABLED:
    print("[x402] Disabled (set X402_ENABLED=true to activate SDK middleware)")
    print("[x402] Manual gate in reviews.py will handle 402 responses")

if X402_ENABLED:
  try:
    from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
    from x402.http.middleware.fastapi import PaymentMiddlewareASGI
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer

    PAY_TO = os.getenv("RECEIVER_ADDRESS", "0x557E1E07652B75ABaA667223B11704165fC94d09")
    CDP_KEY_ID = os.getenv("CDP_API_KEY_ID", "")
    CDP_KEY_SECRET = os.getenv("CDP_API_KEY_SECRET", "")

    # Use CDP facilitator if keys available, otherwise public testnet facilitator
    if CDP_KEY_ID and CDP_KEY_SECRET:
        facilitator_url = "https://api.cdp.coinbase.com/platform/v2/x402"
        print(f"[x402] Using CDP facilitator (production)")
    else:
        facilitator_url = "https://x402.org/facilitator"
        print(f"[x402] Using public testnet facilitator (no CDP keys)")

    facilitator = HTTPFacilitatorClient(FacilitatorConfig(url=facilitator_url))
    x402_server = x402ResourceServer(facilitator)
    x402_server.register("eip155:84532", ExactEvmServerScheme())

    x402_routes = {
        "GET /reviews/top": RouteConfig(
            accepts=[PaymentOption(
                scheme="exact",
                pay_to=PAY_TO,
                price="$0.001",
                network="eip155:84532",
            )],
            mime_type="application/json",
            description="Access ranked staked reviews — agents pay 0.001 USDC",
        ),
    }

    app.add_middleware(PaymentMiddlewareASGI, routes=x402_routes, server=x402_server)
    print(f"[x402] Payment middleware active on /reviews/top (0.001 USDC, Base Sepolia)")
    print(f"[x402] Pay to: {PAY_TO}")

  except Exception as e:
    print(f"[x402] Middleware not loaded: {e}. Falling back to manual gate in reviews.py")

app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(outcomes.router, prefix="/outcomes", tags=["outcomes"])
app.include_router(agent_router)
app.include_router(leaderboard_router)
app.include_router(sessions_router)


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
