/**
 * x402 Payment Gateway — Express proxy with self-verified x402 payments.
 * Protects /reviews/top with x402 micropayment (0.001 USDC on Base Sepolia).
 * Uses local wallet verification — no Coinbase CDP dependency.
 * Forwards all other requests to the Python FastAPI backend.
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.X402_PORT || 3000;
const API_BACKEND = process.env.API_BACKEND || "http://localhost:8000";
const RECEIVER = process.env.RECEIVER_ADDRESS;
const NETWORK = process.env.X402_NETWORK || "base-sepolia";

app.use(express.json());

/**
 * Initialize x402 payment middleware using @x402/express with local verification.
 * Falls back to manual header check if @x402/express setup fails.
 */
async function setupX402() {
  try {
    const { paymentMiddleware } = require("@x402/express");
    const { ExactEvmScheme, toFacilitatorEvmSigner } = require("@x402/evm");
    const { x402ResourceServer } = require("@x402/core/server");
    const { createWalletClient, http } = require("viem");
    const { privateKeyToAccount } = require("viem/accounts");
    const { baseSepolia, base } = require("viem/chains");

    const facilitatorKey = process.env.FACILITATOR_PRIVATE_KEY || process.env.BASE_SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY;

    if (!facilitatorKey || !RECEIVER) {
      console.log("[x402] No facilitator key or receiver — using manual verification mode");
      return null;
    }

    const chain = NETWORK === "base-mainnet" ? base : baseSepolia;
    const account = privateKeyToAccount(facilitatorKey.startsWith("0x") ? facilitatorKey : `0x${facilitatorKey}`);
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    const signer = toFacilitatorEvmSigner(walletClient);
    const scheme = new ExactEvmScheme();
    const server = new x402ResourceServer(signer);
    server.register(scheme);

    const routes = {
      "/reviews/top": {
        price: "$0.001",
        network: NETWORK,
        config: { description: "Access top-ranked staked reviews" },
      },
    };

    const middleware = paymentMiddleware(routes, server);
    console.log(`[x402] SDK middleware initialized on ${NETWORK}`);
    console.log(`[x402] Receiver: ${RECEIVER}`);
    return middleware;
  } catch (err) {
    console.log("[x402] SDK setup failed, using manual mode:", err.message);
    return null;
  }
}

/**
 * Manual x402 verification fallback.
 * Checks for payment header presence and structure.
 * Accepts dryRun for testing without payment.
 */
function manualX402Gate(req, res, next) {
  const paymentHeader =
    req.headers["payment-signature"] ||
    req.headers["x-payment"] ||
    req.headers["x-402-payment"];

  // Dry run bypass for testing
  if (req.query.dryRun === "true") {
    return next();
  }

  if (!paymentHeader) {
    return res.status(402).json({
      x402Version: 2,
      error: "X-402: Payment Required",
      accepts: [
        {
          scheme: "exact",
          network: NETWORK,
          maxAmountRequired: "1000", // 0.001 USDC (6 decimals)
          resource: req.path,
          description: "Access top-ranked staked reviews",
          payTo: RECEIVER || "SET_RECEIVER_ADDRESS",
          maxTimeoutSeconds: 300,
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
          extra: {},
        },
      ],
    });
  }

  // Payment header present — accept it
  // In production, decode and verify the EIP-3009/Permit2 signature
  // For hackathon demo: presence of valid-looking header = paid
  try {
    const decoded = JSON.parse(
      Buffer.from(paymentHeader, "base64").toString("utf-8")
    );
    if (decoded && (decoded.signature || decoded.authorization)) {
      console.log("[x402] Payment accepted from:", decoded.authorization?.from || "unknown");
      return next();
    }
  } catch {
    // Not base64 JSON — try raw check
    if (paymentHeader.startsWith("0x") && paymentHeader.length > 20) {
      console.log("[x402] Payment signature accepted");
      return next();
    }
  }

  return res.status(402).json({ error: "Invalid payment header" });
}

async function start() {
  const x402Middleware = await setupX402();

  if (x402Middleware) {
    // Use SDK middleware — handles all x402 routes automatically
    app.use(x402Middleware);
  } else {
    // Manual gate on /reviews/top only
    app.get("/reviews/top", manualX402Gate);
  }

  // Proxy /reviews/top to backend after payment verified
  app.get("/reviews/top", async (req, res) => {
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
    console.log(`[x402] Network: ${NETWORK}`);
    console.log(`[x402] dryRun: add ?dryRun=true to bypass payment`);
  });
}

start().catch(console.error);
