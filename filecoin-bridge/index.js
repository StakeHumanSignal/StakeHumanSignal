/**
 * Filecoin FOC Storage Bridge — real Synapse SDK integration.
 * Stores data on Filecoin Onchain Cloud (calibration testnet).
 * Python API calls this bridge to store/retrieve review data permanently.
 * Runs on port 3001.
 *
 * Docs: https://docs.filecoin.cloud/developer-guides/synapse/
 * SDK: @filoz/synapse-sdk v0.40.0
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: "../.env" });

import express from "express";
import crypto from "crypto";
import { Synapse, calibration, mainnet } from "@filoz/synapse-sdk";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
const PORT = process.env.FILECOIN_BRIDGE_PORT || 3001;
const NETWORK = process.env.FILECOIN_NETWORK || "calibration"; // "mainnet" or "calibration"

app.use(express.json({ limit: "10mb" }));

// In-memory fallback store
const localStore = new Map();
let synapse = null;
let focConnected = false;

async function initSynapse() {
  const pk = process.env.FILECOIN_PRIVATE_KEY || process.env.BASE_SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!pk) {
    console.log("[FOC] No private key — using local CID fallback");
    return null;
  }

  try {
    const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
    const chain = NETWORK === "mainnet" ? mainnet : calibration;

    synapse = Synapse.create({
      account,
      chain,
      source: "stakehumansignal",
    });

    console.log(`[FOC] Synapse SDK connected to ${chain.name} (chain ${chain.id})`);
    console.log(`[FOC] Account: ${account.address}`);
    focConnected = true;
    return synapse;
  } catch (err) {
    console.log("[FOC] Synapse SDK init failed:", err.message);
    console.log("[FOC] Falling back to local CID store");
    return null;
  }
}

/**
 * Generate a deterministic CID-like hash for local storage fallback.
 */
function localCID(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(str).digest("hex");
  return `bafylocal${hash.slice(0, 48)}`;
}

/**
 * POST /store — Store JSON data on Filecoin FOC.
 * Returns: { cid, url, size, storage }
 */
app.post("/store", async (req, res) => {
  try {
    const { content, filename } = req.body;
    const rawData = content || req.body;
    const jsonStr = typeof rawData === "string" ? rawData : JSON.stringify(rawData);
    const size = Buffer.byteLength(jsonStr, "utf8");

    if (!jsonStr || jsonStr === "{}" || jsonStr === "null") {
      return res.status(400).json({ error: "Empty data" });
    }

    if (synapse && focConnected) {
      try {
        // Upload via Synapse SDK to FOC
        const data = new TextEncoder().encode(jsonStr);
        const result = await synapse.storage.upload(data, {
          pieceMetadata: {
            source: "stakehumansignal",
            type: filename || "data.json",
            timestamp: new Date().toISOString(),
          },
        });

        const cid = result.pieceCid || result.pieceCID || result.cid || null;
        if (cid) {
          console.log(`[FOC] Stored on Filecoin: ${cid} (${size} bytes)`);
          return res.json({
            cid: cid.toString(),
            url: `https://calibration.filecoin.tools/${cid}`,
            size,
            storage: "filecoin-foc",
            network: NETWORK,
            txHash: result.txHash || null,
          });
        }
      } catch (focErr) {
        console.log("[FOC] Upload failed, falling back:", focErr.message?.slice(0, 200));
      }
    }

    // Local fallback
    const cid = localCID(jsonStr);
    localStore.set(cid, jsonStr);
    console.log(`[FOC] Stored locally: ${cid} (${size} bytes)`);
    return res.json({ cid, url: `http://localhost:${PORT}/retrieve/${cid}`, size, storage: "local-fallback" });
  } catch (err) {
    console.error("[FOC] Store error:", err.message);
    const jsonStr = JSON.stringify(req.body);
    const cid = localCID(jsonStr);
    localStore.set(cid, jsonStr);
    return res.json({ cid, url: `http://localhost:${PORT}/retrieve/${cid}`, size: Buffer.byteLength(jsonStr, "utf8"), storage: "local-error-fallback" });
  }
});

/**
 * GET /retrieve/:cid — Retrieve data from Filecoin FOC by CID.
 */
app.get("/retrieve/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    // Check local store first
    if (localStore.has(cid)) {
      return res.json({ content: localStore.get(cid), cid, source: "local" });
    }

    if (synapse && focConnected) {
      try {
        const data = await synapse.storage.download({ pieceCid: cid });
        const content = new TextDecoder().decode(data);
        return res.json({ content, cid, source: "filecoin-foc" });
      } catch (focErr) {
        console.log("[FOC] Download failed:", focErr.message?.slice(0, 200));
      }
    }

    return res.status(404).json({ error: "CID not found" });
  } catch (err) {
    console.error("[FOC] Retrieve error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /health — Health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    network: focConnected ? NETWORK : "local-fallback",
    synapse: focConnected ? "connected" : "disconnected",
    sdk: "@filoz/synapse-sdk@0.40.0",
    stored_locally: localStore.size,
  });
});

async function start() {
  await initSynapse();
  app.listen(PORT, () => {
    console.log(`[FOC] Bridge on port ${PORT}`);
    console.log(`[FOC] POST /store — store JSON on Filecoin FOC`);
    console.log(`[FOC] GET /retrieve/:cid — retrieve by CID`);
    console.log(`[FOC] GET /health — connection status`);
  });
}

start().catch(console.error);
