/**
 * Deploy a fresh LidoTreasury with a mock wstETH on Base Sepolia,
 * fund it, and call distributeYield to prove the mechanism works on-chain.
 *
 * Steps:
 * 1. Deploy MockERC20 as "wstETH" (18 decimals)
 * 2. Deploy MockERC20 as "USDC" (6 decimals)
 * 3. Deploy LidoTreasury(wstETH, USDC)
 * 4. Mint 1.0 mock wstETH to deployer
 * 5. Approve treasury to spend wstETH
 * 6. depositPrincipal(0.5 wstETH) — locks principal
 * 7. Transfer 0.3 extra wstETH to treasury (simulates yield accrual)
 * 8. Call availableYield() — should show 0.3
 * 9. setWhitelisted(deployer, true)
 * 10. distributeYield(deployer, 0.1 wstETH) — REAL ON-CHAIN TX
 */

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("ETH balance:", hre.ethers.formatEther(balance));

  if (balance === 0n) {
    console.log("ERROR: No ETH for gas. Fund the wallet first.");
    process.exit(1);
  }

  // 1. Deploy mock wstETH
  console.log("\n--- Deploying mock wstETH ---");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const wstETH = await MockERC20.deploy("Wrapped stETH (Mock)", "wstETH", 18);
  await wstETH.waitForDeployment();
  const wstETHAddr = await wstETH.getAddress();
  console.log("Mock wstETH deployed:", wstETHAddr);

  // 2. Deploy mock USDC
  console.log("\n--- Deploying mock USDC ---");
  const usdc = await MockERC20.deploy("USD Coin (Mock)", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log("Mock USDC deployed:", usdcAddr);

  // 3. Deploy LidoTreasury
  console.log("\n--- Deploying LidoTreasury ---");
  const LidoTreasury = await hre.ethers.getContractFactory("LidoTreasury");
  const treasury = await LidoTreasury.deploy(wstETHAddr, usdcAddr);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("LidoTreasury deployed:", treasuryAddr);

  // 4. Mint mock wstETH
  console.log("\n--- Minting 1.0 mock wstETH ---");
  const mintAmount = hre.ethers.parseEther("1.0");
  const mintTx = await wstETH.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 1.0 wstETH to", deployer.address);

  // 5. Approve treasury
  console.log("\n--- Approving treasury ---");
  const approveTx = await wstETH.approve(treasuryAddr, mintAmount);
  await approveTx.wait();
  console.log("Approved treasury to spend wstETH");

  // 6. Deposit principal (0.5 wstETH)
  console.log("\n--- Depositing 0.5 wstETH as principal ---");
  const depositAmount = hre.ethers.parseEther("0.5");
  const depositTx = await treasury.depositPrincipal(depositAmount);
  const depositReceipt = await depositTx.wait();
  console.log("depositPrincipal TX:", depositTx.hash);
  console.log("Block:", depositReceipt.blockNumber);

  // 7. Transfer extra wstETH to treasury (simulates yield accrual from stETH rebasing)
  console.log("\n--- Simulating yield accrual (0.3 wstETH) ---");
  const yieldAmount = hre.ethers.parseEther("0.3");
  const transferTx = await wstETH.transfer(treasuryAddr, yieldAmount);
  await transferTx.wait();
  console.log("Transferred 0.3 wstETH to treasury (simulated yield)");

  // 8. Check available yield
  const available = await treasury.availableYield();
  const principal = await treasury.totalPrincipal();
  console.log("\nAvailable yield:", hre.ethers.formatEther(available), "wstETH");
  console.log("Total principal:", hre.ethers.formatEther(principal), "wstETH");

  // 9. Whitelist deployer
  console.log("\n--- Whitelisting deployer ---");
  const wlTx = await treasury.setWhitelisted(deployer.address, true);
  await wlTx.wait();
  console.log("Deployer whitelisted");

  // 10. Distribute yield!
  console.log("\n--- Calling distributeYield ---");
  const distributeAmount = hre.ethers.parseEther("0.1");
  const distributeTx = await treasury.distributeYield(deployer.address, distributeAmount);
  const distributeReceipt = await distributeTx.wait();
  console.log("distributeYield TX:", distributeTx.hash);
  console.log("Block:", distributeReceipt.blockNumber);
  console.log("Basescan:", `https://sepolia.basescan.org/tx/${distributeTx.hash}`);

  // Final state
  const finalYield = await treasury.availableYield();
  const totalDistributed = await treasury.totalYieldDistributed();
  console.log("\n=== FINAL STATE ===");
  console.log("Remaining yield:", hre.ethers.formatEther(finalYield), "wstETH");
  console.log("Total distributed:", hre.ethers.formatEther(totalDistributed), "wstETH");
  console.log("SUCCESS: distributeYield called on-chain");

  // Save proof
  const proof = {
    network: "base-sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      mockWstETH: wstETHAddr,
      mockUSDC: usdcAddr,
      lidoTreasury: treasuryAddr,
    },
    txs: {
      depositPrincipal: depositTx.hash,
      depositPrincipalBlock: depositReceipt.blockNumber,
      distributeYield: distributeTx.hash,
      distributeYieldBlock: distributeReceipt.blockNumber,
    },
    state: {
      principalLocked: hre.ethers.formatEther(principal),
      yieldDistributed: hre.ethers.formatEther(distributeAmount),
      yieldRemaining: hre.ethers.formatEther(finalYield),
    },
  };

  fs.writeFileSync(
    "deployments/treasury-yield-proof.json",
    JSON.stringify(proof, null, 2)
  );
  console.log("\nProof saved to deployments/treasury-yield-proof.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
