const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Wiring contracts with:", deployer.address);

  const JOB = "0x5298F4D8d8043C14e5F2683Ad642fEbC8B54638f";
  const TREASURY = "0xE78f6c235FD1686547DBea41F742D649607316B1";
  const REGISTRY = "0xA471D2C45F03518E47c7Fc71C897d244dF01859D";

  const job = await ethers.getContractAt("StakeHumanSignalJob", JOB);
  const treasury = await ethers.getContractAt("LidoTreasury", TREASURY);
  const registry = await ethers.getContractAt("ReceiptRegistry", REGISTRY);

  // Check what's already wired
  const currentTreasury = await job.lidoTreasury();
  const currentRegistry = await job.receiptRegistry();
  console.log("Current treasury on Job:", currentTreasury);
  console.log("Current registry on Job:", currentRegistry);

  // Wire step by step with confirmations
  if (currentTreasury === ethers.ZeroAddress) {
    console.log("1/5 Setting treasury on Job...");
    const tx1 = await job.setLidoTreasury(TREASURY);
    await tx1.wait();
    console.log("   tx:", tx1.hash);
  } else {
    console.log("1/5 Treasury already set on Job");
  }

  if (currentRegistry === ethers.ZeroAddress) {
    console.log("2/5 Setting registry on Job...");
    const tx2 = await job.setReceiptRegistry(REGISTRY);
    await tx2.wait();
    console.log("   tx:", tx2.hash);
  } else {
    console.log("2/5 Registry already set on Job");
  }

  const jobWhitelisted = await treasury.whitelisted(JOB);
  if (!jobWhitelisted) {
    console.log("3/5 Whitelisting Job on Treasury...");
    const tx3 = await treasury.setWhitelisted(JOB, true);
    await tx3.wait();
    console.log("   tx:", tx3.hash);
  } else {
    console.log("3/5 Job already whitelisted on Treasury");
  }

  const deployerWhitelisted = await treasury.whitelisted(deployer.address);
  if (!deployerWhitelisted) {
    console.log("4/5 Whitelisting deployer on Treasury...");
    const tx4 = await treasury.setWhitelisted(deployer.address, true);
    await tx4.wait();
    console.log("   tx:", tx4.hash);
  } else {
    console.log("4/5 Deployer already whitelisted on Treasury");
  }

  const jobMinter = await registry.minters(JOB);
  if (!jobMinter) {
    console.log("5/5 Setting Job as minter on Registry...");
    const tx5 = await registry.setMinter(JOB, true);
    await tx5.wait();
    console.log("   tx:", tx5.hash);
  } else {
    console.log("5/5 Job already minter on Registry");
  }

  // Also set deployer as minter for manual testing
  const deployerMinter = await registry.minters(deployer.address);
  if (!deployerMinter) {
    console.log("6/6 Setting deployer as minter on Registry...");
    const tx6 = await registry.setMinter(deployer.address, true);
    await tx6.wait();
    console.log("   tx:", tx6.hash);
  } else {
    console.log("6/6 Deployer already minter on Registry");
  }

  console.log("\nAll contracts wired successfully!");

  // Save addresses
  const addresses = {
    network: "base-sepolia",
    chainId: 84532,
    deployer: deployer.address,
    contracts: {
      stakeHumanSignalJob: JOB,
      lidoTreasury: TREASURY,
      receiptRegistry: REGISTRY,
    },
    tokens: {
      usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      wstETH: "0x0000000000000000000000000000000000000001",
    },
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("deployments/sepolia.json", JSON.stringify(addresses, null, 2));
  fs.writeFileSync("addresses-sepolia.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to deployments/sepolia.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
