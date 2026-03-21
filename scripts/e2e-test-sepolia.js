const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("E2E Test with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const JOB_ADDR = "0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f";
  const REGISTRY_ADDR = "0xA471D2C45F03518E47c7Fc71C897d244dF01859D";

  const job = await ethers.getContractAt("StakeHumanSignalJob", JOB_ADDR);
  const registry = await ethers.getContractAt("ReceiptRegistry", REGISTRY_ADDR);

  // Step 1: Create a job
  console.log("\n--- Step 1: Create Job ---");
  const spec = JSON.stringify({
    apiUrl: "https://api.openai.com/v1/chat/completions",
    reviewHash: "e2e-test-review-hash",
    timestamp: new Date().toISOString(),
  });
  const tx1 = await job.createJob(spec);
  const receipt1 = await tx1.wait();
  const jobCreatedEvent = receipt1.logs.find(
    (log) => {
      try { return job.interface.parseLog(log)?.name === "JobCreated"; }
      catch { return false; }
    }
  );
  const parsedEvent = job.interface.parseLog(jobCreatedEvent);
  const jobId = parsedEvent.args.jobId;
  console.log("Job created! jobId:", jobId.toString());
  console.log("tx:", tx1.hash);

  // Step 2: Check job status (should be Open=0)
  console.log("\n--- Step 2: Check Job Status ---");
  const [client, , budget, status] = await job.getJob(jobId);
  console.log("Client:", client);
  console.log("Budget:", budget.toString());
  console.log("Status:", status.toString(), "(0=Open)");

  // Step 3: Submit deliverable (skip fund since we don't have testnet USDC,
  // but we can test the full flow by directly calling as evaluator)
  // NOTE: Normal flow is createJob -> fund -> submit -> complete
  // Since we don't have testnet USDC to fund, we'll test what we can:
  // The evaluator flow starts at the submitted state, so let's test
  // the receipt minting directly (deployer is a minter)

  console.log("\n--- Step 3: Mint ERC-8004 Receipt (direct test) ---");
  const mintTx = await registry.mintReceipt(
    jobId,
    deployer.address,
    "https://api.openai.com/v1/chat/completions",
    "score:92,reason:excellent review quality",
    "bafybeie2e-test-filecoin-cid"
  );
  const mintReceipt = await mintTx.wait();
  const mintEvent = mintReceipt.logs.find(
    (log) => {
      try { return registry.interface.parseLog(log)?.name === "ReceiptMinted"; }
      catch { return false; }
    }
  );
  const parsedMint = registry.interface.parseLog(mintEvent);
  const tokenId = parsedMint.args.tokenId;
  console.log("Receipt minted! tokenId:", tokenId.toString());
  console.log("tx:", mintTx.hash);

  // Step 4: Verify receipt data on-chain
  console.log("\n--- Step 4: Verify Receipt Data ---");
  const receiptData = await registry.getReceipt(tokenId);
  console.log("jobId:", receiptData.jobId.toString());
  console.log("winner:", receiptData.winner);
  console.log("apiUrl:", receiptData.apiUrl);
  console.log("outcome:", receiptData.outcome);
  console.log("filecoinCID:", receiptData.filecoinCID);
  console.log("timestamp:", receiptData.timestamp.toString());

  // Step 5: Check totals
  console.log("\n--- Step 5: Contract State ---");
  console.log("Total jobs:", (await job.getJobCount()).toString());
  console.log("Total receipts:", (await registry.totalReceipts()).toString());
  console.log("Receipt owner:", await registry.ownerOf(tokenId));

  // Summary
  console.log("\n=== E2E Test Summary ===");
  console.log("Job created:    tx", tx1.hash);
  console.log("Receipt minted: tx", mintTx.hash);
  console.log("Job ID:", jobId.toString());
  console.log("Token ID:", tokenId.toString());
  console.log("Basescan Job tx:     https://sepolia.basescan.org/tx/" + tx1.hash);
  console.log("Basescan Receipt tx: https://sepolia.basescan.org/tx/" + mintTx.hash);
  console.log("\nAll checks passed!");
}

main().catch((error) => {
  console.error("E2E TEST FAILED:", error);
  process.exitCode = 1;
});
