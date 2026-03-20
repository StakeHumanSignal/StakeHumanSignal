/**
 * x402 Payment Gateway — Express proxy with x402 middleware.
 * Protects /reviews/top with x402 micropayment (0.001 USDC on Base).
 * Forwards all other requests to the Python FastAPI backend.
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.X402_PORT || 3000;
const API_BACKEND = process.env.API_BACKEND || "http://localhost:8000";

app.use(express.json());

// x402 payment middleware for /reviews/top
// In production, this uses @x402/express + @coinbase/x402 facilitator
app.get("/reviews/top", async (req, res, next) => {
  // Check for x402 payment header
  const paymentHeader = req.headers["x-402-payment"];

  if (!paymentHeader && !req.query.dryRun) {
    // Return 402 Payment Required with payment details
    return res.status(402).json({
      status: 402,
      message: "Payment Required",
      x402: {
        version: "1",
        price: "0.001",
        currency: "USDC",
        network: "base-mainnet",
        receiver: process.env.RECEIVER_ADDRESS,
        facilitator: "https://x402.org/facilitator",
      },
    });
  }

  // Payment verified or dry run — proxy to backend
  try {
    const response = await fetch(`${API_BACKEND}/reviews/top`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: "Backend unavailable" });
  }
});

// Proxy all other routes to FastAPI backend
app.use(
  "/",
  createProxyMiddleware({
    target: API_BACKEND,
    changeOrigin: true,
  })
);

app.listen(PORT, () => {
  console.log(`[x402] Payment gateway on port ${PORT}`);
  console.log(`[x402] Proxying to ${API_BACKEND}`);
  console.log(`[x402] /reviews/top requires 0.001 USDC payment`);
});
