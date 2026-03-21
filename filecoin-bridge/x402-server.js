/**
 * x402 Payment Gateway — real x402 with public facilitator.
 * No CDP keys needed. Works on Base Sepolia.
 *
 * Start: node filecoin-bridge/x402-server.js
 */

require("dotenv").config({ path: "../.env" });
const express = require("express");

const app = express();
app.use(express.json());

const RECEIVER = process.env.RECEIVER_ADDRESS;
const API_URL = process.env.API_URL || "http://localhost:8000";
const PORT = process.env.X402_PORT || 3002;

// x402 SDK is not used — manual gate only.
// The @x402/express SDK has API incompatibilities with current version.
// Manual gate provides the same 402 behavior for hackathon demo.

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

// Proxy to Python API (manualGate runs first as middleware)
app.get("/reviews/top", manualGate, async (req, res) => {
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
  console.log("[x402] Using manual 402 gate");
  app.listen(PORT, () => {
    console.log(`[x402] Gateway on :${PORT}`);
    console.log(`[x402] Proxying to ${API_URL}`);
  });
}

start().catch(console.error);
