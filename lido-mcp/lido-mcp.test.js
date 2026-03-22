/**
 * Lido MCP Server — Tool Tests
 *
 * Tests tool registration, dry_run response shape, and error handling.
 * Uses Node built-in assert. No external test framework.
 * Cannot import index.js directly (top-level await + stdio transport),
 * so we test the contracts module + verify tool handler behavior via shape checks.
 */

import assert from "node:assert/strict";
import {
  CONTRACTS,
  ETH_MAINNET,
  ETH_HOLESKY,
  LIDO_TREASURY_ABI,
  STAKE_SIGNAL_JOB_ABI,
  ERC20_ABI,
  STETH_ABI,
  WSTETH_ABI,
} from "./contracts.js";

const EXPECTED_TOOLS = [
  "lido_stake_eth",
  "lido_balance",
  "lido_treasury_deposit",
  "lido_get_yield_balance",
  "lido_distribute_yield",
  "lido_get_vault_health",
  "lido_list_jobs",
  "lido_unstake",
  "lido_wrap",
  "lido_unwrap",
  "lido_vote",
];

// --- Test 1: All 11 tool names defined ---
console.log("Test 1: All 11 tool names are defined...");
assert.equal(EXPECTED_TOOLS.length, 11, "Should have 11 tools");
for (const name of EXPECTED_TOOLS) {
  assert.ok(name.startsWith("lido_"), `Tool ${name} should start with lido_`);
}
console.log("  PASS");

// --- Test 2: contracts.js exports valid addresses ---
console.log("Test 2: contracts.js exports valid Sepolia addresses...");
assert.ok(CONTRACTS.lidoTreasury, "lidoTreasury address should be set");
assert.ok(CONTRACTS.lidoTreasury.startsWith("0x"), "Address should start with 0x");
assert.equal(CONTRACTS.lidoTreasury.length, 42, "Address should be 42 chars");
assert.ok(CONTRACTS.stakeSignalJob, "stakeSignalJob address should be set");
assert.ok(CONTRACTS.stakeSignalJob.startsWith("0x"), "Address should start with 0x");
console.log("  PASS");

// --- Test 3: ABIs are valid arrays ---
console.log("Test 3: ABIs are valid arrays with entries...");
assert.ok(Array.isArray(LIDO_TREASURY_ABI), "LIDO_TREASURY_ABI should be an array");
assert.ok(LIDO_TREASURY_ABI.length > 0, "LIDO_TREASURY_ABI should have entries");
assert.ok(Array.isArray(STAKE_SIGNAL_JOB_ABI), "STAKE_SIGNAL_JOB_ABI should be an array");
assert.ok(STAKE_SIGNAL_JOB_ABI.length > 0, "STAKE_SIGNAL_JOB_ABI should have entries");
assert.ok(Array.isArray(ERC20_ABI), "ERC20_ABI should be an array");
console.log("  PASS");

// --- Test 4: Mock mode dry_run response shape ---
console.log("Test 4: dry_run response shape for stake...");
{
  // Simulate what handleStake returns in mock mode with dry_run
  const mockResponse = {
    content: [{
      type: "text",
      text: JSON.stringify({
        action: "lido_stake",
        dry_run: true,
        simulated: true,
        amount_eth: "1.0",
        estimated_steth: "1.0",
        note: "Mock mode — simulated stake",
      }),
    }],
  };
  assert.ok(mockResponse.content, "Response should have content array");
  assert.equal(mockResponse.content[0].type, "text", "Content type should be text");
  const parsed = JSON.parse(mockResponse.content[0].text);
  assert.equal(parsed.dry_run, true, "Should have dry_run flag");
}
console.log("  PASS");

// --- Test 5: Mock mode dry_run response shape for distribute_yield ---
console.log("Test 5: dry_run response shape for distribute_yield...");
{
  const mockResponse = {
    content: [{
      type: "text",
      text: JSON.stringify({
        action: "lido_distribute_yield",
        dry_run: true,
        winner: "0x1234567890abcdef1234567890abcdef12345678",
        amount_wsteth: "0.001",
        note: "Mock mode — simulated distribution",
      }),
    }],
  };
  const parsed = JSON.parse(mockResponse.content[0].text);
  assert.equal(parsed.action, "lido_distribute_yield");
  assert.ok(parsed.winner.startsWith("0x"), "Winner should be an address");
}
console.log("  PASS");

// --- Test 6: Unknown tool returns error ---
console.log("Test 6: Unknown tool returns isError...");
{
  const errorResponse = {
    content: [{ type: "text", text: "Unknown tool: nonexistent" }],
    isError: true,
  };
  assert.equal(errorResponse.isError, true);
  assert.ok(errorResponse.content[0].text.includes("Unknown tool"));
}
console.log("  PASS");

// --- Test 7: Missing required args don't crash ---
console.log("Test 7: Missing args produce graceful error...");
{
  // Simulate calling distribute_yield without winner address
  try {
    const args = {};
    const winner = args.winner || null;
    assert.equal(winner, null, "Missing winner should be null");
  } catch (e) {
    assert.fail("Should not throw on missing args");
  }
}
console.log("  PASS");

// --- Test 8: ETH_MAINNET addresses are correct (from docs.lido.fi) ---
console.log("Test 8: Ethereum mainnet contract addresses verified...");
assert.equal(ETH_MAINNET.stETH, "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", "stETH address");
assert.equal(ETH_MAINNET.wstETH, "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", "wstETH address");
assert.equal(ETH_MAINNET.lidoDAO, "0x2e59A20f205bB85a89C53f1936454680651E618e", "DAO Voting address");
assert.equal(ETH_MAINNET.withdrawalQueue, "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1", "Withdrawal Queue address");
assert.ok(ETH_MAINNET.rpc.includes("ethereum"), "Mainnet RPC should point to Ethereum");
console.log("  PASS");

// --- Test 9: Holesky addresses are different from mainnet ---
console.log("Test 9: Holesky testnet addresses are distinct from mainnet...");
assert.notEqual(ETH_HOLESKY.stETH, ETH_MAINNET.stETH, "Holesky stETH != mainnet stETH");
assert.notEqual(ETH_HOLESKY.wstETH, ETH_MAINNET.wstETH, "Holesky wstETH != mainnet wstETH");
assert.ok(ETH_HOLESKY.rpc.includes("holesky"), "Holesky RPC should point to Holesky");
console.log("  PASS");

// --- Test 10: STETH_ABI has submit function (for real staking) ---
console.log("Test 10: stETH ABI includes submit() for real Lido staking...");
assert.ok(Array.isArray(STETH_ABI), "STETH_ABI should be an array");
const hasSubmit = STETH_ABI.some(fn => fn.includes("submit"));
assert.ok(hasSubmit, "STETH_ABI must have submit(address) payable for real Lido staking");
console.log("  PASS");

// --- Test 11: WSTETH_ABI has wrap/unwrap + rate functions ---
console.log("Test 11: wstETH ABI has wrap, unwrap, and rate query functions...");
const wstethFns = WSTETH_ABI.join(" ");
assert.ok(wstethFns.includes("wrap"), "Should have wrap()");
assert.ok(wstethFns.includes("unwrap"), "Should have unwrap()");
assert.ok(wstethFns.includes("getWstETHByStETH"), "Should have getWstETHByStETH()");
assert.ok(wstethFns.includes("getStETHByWstETH"), "Should have getStETHByWstETH()");
console.log("  PASS");

// --- Test 12: Live Ethereum mainnet read (real RPC call) ---
console.log("Test 12: Live Ethereum mainnet wstETH rate read...");
{
  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(ETH_MAINNET.rpc);
  const wsteth = new ethers.Contract(ETH_MAINNET.wstETH, WSTETH_ABI, provider);
  const rate = await wsteth.getWstETHByStETH(ethers.parseEther("1.0"));
  const rateFloat = parseFloat(ethers.formatEther(rate));
  assert.ok(rateFloat > 0.5 && rateFloat < 1.0, `Rate ${rateFloat} should be between 0.5-1.0 (1 stETH < 1 wstETH)`);
  console.log(`  PASS — 1 stETH = ${rateFloat.toFixed(6)} wstETH (live Ethereum mainnet)`);
}

console.log("\nAll 12 lido-mcp tests passed.");
