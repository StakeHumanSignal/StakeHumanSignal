"""StakeHumanSignal API — FastAPI backend for staked human feedback marketplace.

x402 payment gate on /reviews/top using Coinbase x402 SDK.
Defaults to SDK middleware (real verification). Falls back to manual gate only on import error.
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

# --- x402 Payment Middleware (real verification via Coinbase facilitator) ---
# Always attempt to load SDK. Only fall back to manual gate if import fails.
X402_ACTIVE = False

try:
    from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
    from x402.http.middleware.fastapi import PaymentMiddlewareASGI
    from x402.http.types import RouteConfig
    from x402.mechanisms.evm.exact import ExactEvmServerScheme
    from x402.server import x402ResourceServer

    PAY_TO = os.getenv("RECEIVER_ADDRESS", "0x557E1E07652B75ABaA667223B11704165fC94d09")

    # Always use the public testnet facilitator for Base Sepolia
    # CDP production facilitator (api.cdp.coinbase.com) is for mainnet
    facilitator_url = "https://x402.org/facilitator"

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
            description="Access ranked staked reviews — agents pay 0.001 USDC on Base Sepolia",
        ),
    }

    app.add_middleware(PaymentMiddlewareASGI, routes=x402_routes, server=x402_server)
    X402_ACTIVE = True
    print(f"[x402] SDK middleware ACTIVE on /reviews/top (0.001 USDC, Base Sepolia)")
    print(f"[x402] Facilitator: {facilitator_url}")
    print(f"[x402] Pay to: {PAY_TO}")

except Exception as e:
    print(f"[x402] SDK not available: {e}")
    print(f"[x402] Manual 402 gate in reviews.py will be used as fallback")

# Export for reviews.py to check
os.environ["X402_ACTIVE"] = str(X402_ACTIVE).lower()

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
            "GET /reviews/top": "Ranked reviews (x402-gated: 0.001 USDC on Base Sepolia)",
            "POST /reviews": "Submit a review + stake proof",
            "POST /jobs": "Create ERC-8183 job on-chain",
            "GET /jobs/{id}": "Job status",
            "POST /outcomes": "Signal a winner (agent-only)",
        },
        "x402": "active" if X402_ACTIVE else "fallback",
        "standards": ["ERC-8183", "ERC-8004", "x402"],
        "network": "eip155:84532",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "x402": "sdk" if X402_ACTIVE else "manual"}
