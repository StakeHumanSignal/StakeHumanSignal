/**
 * Filecoin FOC Storage Bridge — Node.js service for Synapse SDK.
 * Python API calls this bridge to store/retrieve data on Filecoin.
 * Runs on port 3001.
 *
 * Docs: https://docs.filecoin.cloud/developer-guides/synapse/
 */

require("dotenv").config({ path: "../.env" });
const express = require("express");

const app = express();
const PORT = process.env.FILECOIN_BRIDGE_PORT || 3001;

app.use(express.json({ limit: "10mb" }));

// In-memory fallback store for when Synapse SDK is unavailable
const localStore = new Map();
let synapseClient = null;

async function initSynapse() {
  try {
    const { Synapse } = require("@filoz/synapse-sdk");
    const privateKey = process.env.FILECOIN_PRIVATE_KEY;

    if (!privateKey) {
      console.log("[Filecoin] No FILECOIN_PRIVATE_KEY — using local CID store");
      return null;
    }

    synapseClient = new Synapse({ privateKey });
    console.log("[Filecoin] Synapse SDK initialized");
    return synapseClient;
  } catch (err) {
    console.log("[Filecoin] Synapse SDK not available:", err.message);
    console.log("[Filecoin] Falling back to local CID store");
    return null;
  }
}

/**
 * Generate a deterministic CID-like hash for local storage fallback.
 */
function localCID(data) {
  const crypto = require("crypto");
  const str = typeof data === "string" ? data : JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(str).digest("hex");
  return `bafylocal${hash.slice(0, 48)}`;
}

/**
 * POST /store — Store JSON data on Filecoin FOC.
 * Returns: { cid: "bafy..." }
 */
app.post("/store", async (req, res) => {
  try {
    const { content, filename } = req.body;
    // Support both formats: { content, filename } and raw JSON body
    const rawData = content || req.body;
    const jsonStr = typeof rawData === "string" ? rawData : JSON.stringify(rawData);
    const size = Buffer.byteLength(jsonStr, "utf8");

    if (!jsonStr || jsonStr === "{}" || jsonStr === "null") {
      return res.status(400).json({ error: "Empty data" });
    }

    if (synapseClient) {
      // Real Filecoin storage
      const cid = await synapseClient.uploadPiece(jsonStr);
      console.log(`[Filecoin] Stored on FOC: ${cid} (${size} bytes)`);
      return res.json({ cid, url: `https://gateway.filecoin.cloud/ipfs/${cid}`, size, storage: "filecoin-foc" });
    }

    // Local fallback
    const cid = localCID(jsonStr);
    localStore.set(cid, jsonStr);
    console.log(`[Filecoin] Stored locally: ${cid} (${size} bytes)`);
    return res.json({ cid, url: `http://localhost:${PORT}/retrieve/${cid}`, size, storage: "local" });
  } catch (err) {
    console.error("[Filecoin] Store error:", err.message);
    const jsonStr = JSON.stringify(req.body);
    const cid = localCID(jsonStr);
    localStore.set(cid, jsonStr);
    return res.json({ cid, url: `http://localhost:${PORT}/retrieve/${cid}`, size: Buffer.byteLength(jsonStr, "utf8"), storage: "local-fallback" });
  }
});

/**
 * GET /retrieve/:cid — Retrieve data from Filecoin FOC by CID.
 * Returns: the stored JSON object
 */
app.get("/retrieve/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    // Check local store first
    if (localStore.has(cid)) {
      const content = localStore.get(cid);
      return res.json({ content, cid });
    }

    if (synapseClient) {
      const data = await synapseClient.downloadPiece(cid);
      return res.json({ content: data, cid });
    }

    return res.status(404).json({ error: "CID not found" });
  } catch (err) {
    console.error("[Filecoin] Retrieve error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /health — Health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    network: synapseClient ? "mainnet" : "mock",
    synapse: synapseClient ? "connected" : "local-fallback",
    stored: localStore.size,
  });
});

async function start() {
  await initSynapse();
  app.listen(PORT, () => {
    console.log(`[Filecoin] Bridge on port ${PORT}`);
    console.log(`[Filecoin] POST /store — store JSON, returns CID`);
    console.log(`[Filecoin] GET /retrieve/:cid — retrieve by CID`);
  });
}

start().catch(console.error);
