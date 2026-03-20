const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying to Base Sepolia with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Base Sepolia test token addresses
  // For testnet: deploy mock USDC and wstETH, or use known Sepolia addresses
  // Using deployer as placeholder token addresses for testnet testing
  const USDC_SEPOLIA =
    process.env.USDC_SEPOLIA_ADDRESS ||
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Circle USDC on Base Sepolia
  const WSTETH_SEPOLIA =
    process.env.WSTETH_SEPOLIA_ADDRESS ||
    "0x0000000000000000000000000000000000000001"; // Placeholder — no official wstETH on Sepolia

  console.log("Using USDC:", USDC_SEPOLIA);
  console.log("Using wstETH:", WSTETH_SEPOLIA);

  // 1. Deploy StakeHumanSignalJob (ERC-8183)
  const Job = await ethers.getContractFactory("StakeHumanSignalJob");
  const job = await Job.deploy(USDC_SEPOLIA, deployer.address);
  await job.waitForDeployment();
  const jobAddr = await job.getAddress();
  console.log("StakeHumanSignalJob deployed:", jobAddr);

  // 2. Deploy LidoTreasury
  const Treasury = await ethers.getContractFactory("LidoTreasury");
  const treasury = await Treasury.deploy(WSTETH_SEPOLIA, USDC_SEPOLIA);
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
    network: "base-sepolia",
    chainId: 84532,
    deployer: deployer.address,
    contracts: {
      stakeHumanSignalJob: jobAddr,
      lidoTreasury: treasuryAddr,
      receiptRegistry: registryAddr,
    },
    tokens: {
      usdc: USDC_SEPOLIA,
      wstETH: WSTETH_SEPOLIA,
    },
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "addresses-sepolia.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("Addresses saved to addresses-sepolia.json");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
