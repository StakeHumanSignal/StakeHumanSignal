import { ethers } from "ethers";
import { config } from "dotenv";
import { readFileSync } from "fs";
config();

const provider = new ethers.JsonRpcProvider(
  process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
);
const deployments = JSON.parse(readFileSync("deployments/sepolia.json"));

const abi = [
  "function availableYield() view returns (uint256)",
  "function totalPrincipal() view returns (uint256)",
  "function whitelisted(address) view returns (bool)",
  "function owner() view returns (address)",
];

const treasury = new ethers.Contract(
  deployments.contracts.lidoTreasury,
  abi,
  provider
);

const pk = process.env.BASE_SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY;
const wallet = pk ? new ethers.Wallet(pk) : null;

const yield_ = await treasury.availableYield();
const principal = await treasury.totalPrincipal();
const owner = await treasury.owner();
const balance = await provider.getBalance(deployments.contracts.lidoTreasury);

console.log("Treasury address:", deployments.contracts.lidoTreasury);
console.log("Owner:", owner);
console.log("Available yield:", ethers.formatEther(yield_));
console.log("Total principal:", ethers.formatEther(principal));
console.log("Contract ETH balance:", ethers.formatEther(balance));

if (wallet) {
  const isWhitelisted = await treasury.whitelisted(wallet.address);
  const walletBalance = await provider.getBalance(wallet.address);
  console.log("Wallet:", wallet.address);
  console.log("Wallet ETH balance:", ethers.formatEther(walletBalance));
  console.log("Is whitelisted:", isWhitelisted);
} else {
  console.log("No private key set — cannot check whitelist status");
}
