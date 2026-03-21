#!/usr/bin/env node
/**
 * Lido Vault Position Monitor + Alert Agent
 *
 * Polls vault health every N seconds and logs alerts when yield
 * drops below the 7-day Lido benchmark APY.
 *
 * Usage:
 *   node vault-monitor.js                # default 300s (5 min)
 *   node vault-monitor.js --interval 60  # poll every 60s
 *
 * Also exposed as MCP tool: monitor_vault
 */

import "dotenv/config";
import { ethers } from "ethers";
import { CONTRACTS, LIDO_TREASURY_ABI } from "./contracts.js";

const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BENCHMARK_APY = 3.5; // Lido historical average %

let provider = null;
let treasuryContract = null;
let mockMode = true;

try {
  provider = new ethers.JsonRpcProvider(RPC_URL);
  if (CONTRACTS.lidoTreasury) {
    treasuryContract = new ethers.Contract(
      CONTRACTS.lidoTreasury,
      LIDO_TREASURY_ABI,
      provider
    );
    mockMode = false;
  }
} catch (err) {
  console.error("[Monitor] Setup error:", err.message);
}

async function checkVaultHealth() {
  const now = new Date().toISOString();

  if (mockMode) {
    const mockApy = 3.2 + Math.random() * 0.6; // 3.2-3.8% range
    const below = mockApy < BENCHMARK_APY;
    const status = {
      timestamp: now,
      mode: "mock",
      current_apy: `${mockApy.toFixed(1)}%`,
      benchmark_apy: `${BENCHMARK_APY}%`,
      below_benchmark: below,
      alert: below
        ? `⚠ Yield ${mockApy.toFixed(1)}% below benchmark ${BENCHMARK_APY}%`
        : null,
    };
    console.log(JSON.stringify(status));
    return status;
  }

  const [principal, yieldAvailable, totalDistributed] = await Promise.all([
    treasuryContract.totalPrincipal(),
    treasuryContract.availableYield(),
    treasuryContract.totalYieldDistributed(),
  ]);

  const principalFloat = parseFloat(ethers.formatUnits(principal, 18));
  const yieldFloat = parseFloat(ethers.formatUnits(yieldAvailable, 18));
  const distributedFloat = parseFloat(ethers.formatUnits(totalDistributed, 18));

  const currentApy =
    principalFloat > 0 ? (yieldFloat / principalFloat) * 100 : 0;
  const belowBenchmark = currentApy < BENCHMARK_APY;

  const status = {
    timestamp: now,
    current_apy: `${currentApy.toFixed(1)}%`,
    benchmark_apy: `${BENCHMARK_APY}%`,
    below_benchmark: belowBenchmark,
    principal: `${principalFloat.toFixed(6)} wstETH`,
    yield_available: `${yieldFloat.toFixed(6)} wstETH`,
    total_distributed: `${distributedFloat.toFixed(6)} wstETH`,
    alert: belowBenchmark
      ? `⚠ Yield ${currentApy.toFixed(1)}% below benchmark (${currentApy.toFixed(1)}% vs ${BENCHMARK_APY}%)`
      : null,
  };

  console.log(JSON.stringify(status));

  if (belowBenchmark) {
    console.error(
      `[ALERT] ${now} — Vault yield ${currentApy.toFixed(1)}% is below ${BENCHMARK_APY}% benchmark`
    );
  }

  return status;
}

async function monitor(intervalSeconds) {
  console.error(
    `[Monitor] Starting vault monitor (${mockMode ? "mock" : "live"} mode, ${intervalSeconds}s interval)`
  );
  console.error(
    `[Monitor] Benchmark APY: ${BENCHMARK_APY}%`
  );

  // Initial check
  await checkVaultHealth();

  // Continuous polling
  setInterval(async () => {
    try {
      await checkVaultHealth();
    } catch (err) {
      console.error(`[Monitor] Error: ${err.message}`);
    }
  }, intervalSeconds * 1000);
}

// Parse CLI args
const args = process.argv.slice(2);
const intervalIdx = args.indexOf("--interval");
const interval = intervalIdx >= 0 ? parseInt(args[intervalIdx + 1]) || 300 : 300;

monitor(interval);
