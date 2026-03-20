const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Base Mainnet addresses
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WSTETH_BASE = "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452";

  // 1. Deploy StakeHumanSignalJob (ERC-8183)
  const Job = await ethers.getContractFactory("StakeHumanSignalJob");
  const job = await Job.deploy(USDC_BASE, deployer.address);
  await job.waitForDeployment();
  const jobAddr = await job.getAddress();
  console.log("StakeHumanSignalJob deployed:", jobAddr);

  // 2. Deploy LidoTreasury
  const Treasury = await ethers.getContractFactory("LidoTreasury");
  const treasury = await Treasury.deploy(WSTETH_BASE, USDC_BASE);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();
  console.log("LidoTreasury deployed:", treasuryAddr);

  // 3. Deploy ReceiptRegistry (ERC-8004)
  const Registry = await ethers.getContractFactory("ReceiptRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("ReceiptRegistry deployed:", registryAddr);

  // 4. Wire contracts together
  console.log("Wiring contracts...");
  await (await job.setLidoTreasury(treasuryAddr)).wait();
  await (await job.setReceiptRegistry(registryAddr)).wait();
  await (await treasury.setWhitelisted(jobAddr, true)).wait();
  await (await treasury.setWhitelisted(deployer.address, true)).wait();
  await (await registry.setMinter(jobAddr, true)).wait();
  await (await registry.setMinter(deployer.address, true)).wait();
  console.log("Contracts wired.");

  // 5. Save addresses
  const addresses = {
    network: "base-mainnet",
    chainId: 8453,
    deployer: deployer.address,
    contracts: {
      stakeHumanSignalJob: jobAddr,
      lidoTreasury: treasuryAddr,
      receiptRegistry: registryAddr,
    },
    tokens: {
      usdc: USDC_BASE,
      wstETH: WSTETH_BASE,
    },
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync("addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to addresses.json");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
