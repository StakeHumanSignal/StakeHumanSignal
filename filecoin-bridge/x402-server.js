/**
 * x402 Payment Gateway — real x402 with public facilitator.
 * No CDP keys needed. Works on Base Sepolia.
 *
 * Start: node filecoin-bridge/x402-server.js
 */

import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const app = express();
app.use(express.json());

const RECEIVER = process.env.RECEIVER_ADDRESS;
const API_URL = process.env.API_URL ?? "http://localhost:8000";
const PORT = process.env.X402_PORT ?? 3002;

// Try real x402 middleware, fall back to manual gate
async function setup() {
  try {
    const { paymentMiddleware } = await import("@x402/express");

    if (!RECEIVER) {
      console.log("[x402] No RECEIVER_ADDRESS — using manual mode");
      return null;
    }

    // Public facilitator — no CDP keys needed
    const facilitator = { url: "https://x402.org/facilitator" };

    app.use(
      paymentMiddleware(
        RECEIVER,
        {
          "GET /reviews/top": {
            price: "$0.001",
            network: "base-sepolia",
          },
        },
        facilitator
      )
    );
    console.log(`[x402] SDK middleware active, receiver: ${RECEIVER}`);
    return true;
  } catch (err) {
    console.log("[x402] SDK not available:", err.message);
    return null;
  }
}

// Manual fallback gate
function manualGate(req, res, next) {
  const payment =
    req.headers["x-402-payment"] ||
    req.headers["payment-signature"] ||
    req.headers["x-payment"];

  if (req.query.dryRun === "true") return next();

  if (!payment) {
    return res.status(402).json({
      x402Version: 2,
      error: "Payment Required",
      accepts: [
        {
          scheme: "exact",
          network: "base-sepolia",
          maxAmountRequired: "1000",
          resource: "/reviews/top",
          description: "Access top-ranked staked reviews",
          payTo: RECEIVER || "SET_RECEIVER_ADDRESS",
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        },
      ],
    });
  }
  next();
}

// Proxy to Python API
app.get("/reviews/top", async (req, res) => {
  try {
    const upstream = await fetch(`${API_URL}/reviews/top`);
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "upstream failed", detail: err.message });
  }
});

app.get("/health", (_, res) =>
  res.json({
    status: "ok",
    facilitator: "https://x402.org/facilitator",
    network: "base-sepolia",
    receiver: RECEIVER || "not set",
  })
);

async function start() {
  const sdkActive = await setup();
  if (!sdkActive) {
    app.use("/reviews/top", manualGate);
  }
  app.listen(PORT, () => {
    console.log(`[x402] Gateway on :${PORT}`);
    console.log(`[x402] Proxying to ${API_URL}`);
  });
}

start().catch(console.error);
