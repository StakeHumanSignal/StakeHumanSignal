const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Read existing registry address
  const sepolia = JSON.parse(fs.readFileSync("deployments/sepolia.json", "utf8"));
  const REGISTRY = sepolia.contracts.receiptRegistry;

  console.log("Using ReceiptRegistry:", REGISTRY);
  console.log("Using USDC:", USDC_SEPOLIA);
  console.log("Fee recipient:", deployer.address);

  const SessionEscrow = await ethers.getContractFactory("SessionEscrow");
  const escrow = await SessionEscrow.deploy(USDC_SEPOLIA, REGISTRY, deployer.address);
  await escrow.waitForDeployment();
  const addr = await escrow.getAddress();
  console.log("SessionEscrow deployed:", addr);
  console.log("TX:", (await escrow.deploymentTransaction()).hash);

  // Update sepolia.json
  sepolia.contracts.sessionEscrow = addr;
  fs.writeFileSync("deployments/sepolia.json", JSON.stringify(sepolia, null, 2));
  console.log("Updated deployments/sepolia.json");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
