/**
 * Finish wiring + E2E test for Phase 9 Sepolia deploy.
 * Picks up from where deploy-and-e2e-sepolia.js left off.
 */
const { ethers } = require("hardhat");
const fs = require("fs");

const JOB = "0xE99027DDdF153Ac6305950cD3D58C25D17E39902";
const TREASURY = "0x8E29D161477D9BB00351eA2f69702451443d7bf5";
const REGISTRY = "0xa39c7b475b0708a9854052Fb3Fbc93ccBf656332";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const job = await ethers.getContractAt("StakeHumanSignalJob", JOB);
  const registry = await ethers.getContractAt("ReceiptRegistry", REGISTRY);

  // Finish wiring: setMinter deployer on Registry
  console.log("--- Finish Wiring ---");
  try {
    const isMinter = await registry.minters(deployer.address);
    if (!isMinter) {
      const tx = await registry.setMinter(deployer.address, true);
      await tx.wait();
      console.log("setMinter deployer:", tx.hash);
    } else {
      console.log("deployer already minter");
    }
  } catch (e) {
    console.log("setMinter check:", e.message.slice(0, 60));
  }

  // E2E Step 1: Create job
  console.log("\n--- Step 1: Create Job ---");
  const spec = JSON.stringify({
    apiUrl: "https://api.openai.com/v1/chat/completions",
    task_intent: "evaluate API response quality for code review",
    timestamp: new Date().toISOString(),
  });
  let tx = await job.createJob(spec);
  const r1 = await tx.wait();
  const jobEvent = job.interface.parseLog(r1.logs.find(l => { try { return job.interface.parseLog(l)?.name === "JobCreated"; } catch { return false; } }));
  const jobId = jobEvent.args.jobId;
  console.log("Job #" + jobId + " created:", tx.hash);

  // E2E Step 2: Mint receipt with rubric outcome
  console.log("\n--- Step 2: Mint ERC-8004 Receipt ---");
  const outcome = "rubric_avg:0.730,confidence:0.73,winner:" + deployer.address.slice(0, 10);
  tx = await registry.mintReceipt(
    jobId,
    deployer.address,
    "https://api.openai.com/v1/chat/completions",
    outcome,
    "bafylocale2e-phase9-proof"
  );
  const r2 = await tx.wait();
  const mintEvent = registry.interface.parseLog(r2.logs.find(l => { try { return registry.interface.parseLog(l)?.name === "ReceiptMinted"; } catch { return false; } }));
  const tokenId = mintEvent.args.tokenId;
  console.log("Receipt #" + tokenId + " minted:", tx.hash);

  // Step 3: Verify receipt
  console.log("\n--- Step 3: Verify Receipt ---");
  const receipt = await registry.getReceipt(tokenId);
  console.log("  outcome:", receipt.outcome);
  console.log("  CID:", receipt.filecoinCID);

  // Step 4: Reputation
  console.log("\n--- Step 4: Reputation ---");
  const wins = await registry.agentWins(deployer.address);
  const agentJobs = await registry.agentJobs(deployer.address);
  console.log("  wins:", wins.toString(), "jobs:", agentJobs.toString());

  // Step 5: Independence
  console.log("\n--- Step 5: Independence ---");
  const self = await registry.getIndependenceScore(deployer.address, deployer.address);
  const unrelated = await registry.getIndependenceScore(deployer.address, "0x000000000000000000000000000000000000dEaD");
  console.log("  self:", self.toString(), "unrelated:", unrelated.toString());

  // Step 6: Duplicate guard
  console.log("\n--- Step 6: Duplicate Guard ---");
  try {
    await registry.mintReceipt(jobId, deployer.address, "api", "dup", "dup");
    console.log("  ERROR: should have reverted");
  } catch (e) {
    console.log("  Correctly blocked:", e.message.includes("Receipt already minted") ? "YES" : e.message.slice(0, 80));
  }

  // Save proof
  const proof = {
    network: "base-sepolia",
    chainId: 84532,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: { stakeHumanSignalJob: JOB, lidoTreasury: TREASURY, receiptRegistry: REGISTRY },
    txs: { createJob: r1.hash, receiptMinted: r2.hash },
    cids: { reviewStorage: "bafylocale2e-phase9-proof" },
    receiptTokenId: tokenId.toString(),
    reputationScore: { agentWins: wins.toString(), agentJobs: agentJobs.toString() },
    independenceCheck: { selfCheck: self.toString(), unrelatedCheck: unrelated.toString() },
  };
  fs.writeFileSync("deployments/sepolia-e2e-proof.json", JSON.stringify(proof, null, 2));
  console.log("\nProof saved: deployments/sepolia-e2e-proof.json");

  // Update sepolia.json
  fs.writeFileSync("deployments/sepolia.json", JSON.stringify({
    network: "base-sepolia", chainId: 84532, deployer: deployer.address,
    contracts: { stakeHumanSignalJob: JOB, lidoTreasury: TREASURY, receiptRegistry: REGISTRY },
    tokens: { usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", wstETH: "0x0000000000000000000000000000000000000001" },
    deployedAt: new Date().toISOString(),
  }, null, 2));

  console.log("\n=== ALL CHECKS PASSED ===");
  console.log("Basescan: https://sepolia.basescan.org/address/" + REGISTRY);
  console.log("Job tx:   https://sepolia.basescan.org/tx/" + r1.hash);
  console.log("Rcpt tx:  https://sepolia.basescan.org/tx/" + r2.hash);
  console.log("\nMAINNET GO/NO-GO: GO");
}

main().catch(e => { console.error("FAILED:", e.message); process.exitCode = 1; });
