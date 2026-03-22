"""Web3 service — contract interactions on Base Sepolia / Mainnet."""

import json
import os
from pathlib import Path
from web3 import Web3
from eth_account import Account

_service = None

# Minimal ABIs for the contract functions we call from Python.
# Web3.py requires JSON ABI format (not ethers human-readable strings).
MINIMAL_ABIS = {
    "StakeHumanSignalJob": [
        {"type": "function", "name": "createJob", "inputs": [{"name": "spec", "type": "string"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "nonpayable"},
        {"type": "function", "name": "complete", "inputs": [{"name": "jobId", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable"},
        {"type": "function", "name": "reject", "inputs": [{"name": "jobId", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable"},
        {"type": "function", "name": "getJob", "inputs": [{"name": "jobId", "type": "uint256"}], "outputs": [{"name": "client", "type": "address"}, {"name": "provider", "type": "address"}, {"name": "budget", "type": "uint256"}, {"name": "status", "type": "uint8"}, {"name": "deliverableHash", "type": "bytes32"}], "stateMutability": "view"},
        {"type": "function", "name": "getJobCount", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "event", "name": "JobCreated", "inputs": [{"name": "jobId", "type": "uint256", "indexed": True}, {"name": "client", "type": "address", "indexed": True}, {"name": "spec", "type": "string", "indexed": False}]},
    ],
    "LidoTreasury": [
        {"type": "function", "name": "totalPrincipal", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "totalYieldDistributed", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "availableYield", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "totalBalance", "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "deposits", "inputs": [{"name": "", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "depositPrincipal", "inputs": [{"name": "amount", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable"},
        {"type": "function", "name": "distributeYield", "inputs": [{"name": "winner", "type": "address"}, {"name": "amount", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable"},
        {"type": "function", "name": "receiveStake", "inputs": [{"name": "reviewer", "type": "address"}, {"name": "usdcAmount", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable"},
    ],
    "ReceiptRegistry": [
        {"type": "function", "name": "mintReceipt", "inputs": [{"name": "jobId", "type": "uint256"}, {"name": "winner", "type": "address"}, {"name": "apiUrl", "type": "string"}, {"name": "outcome", "type": "string"}, {"name": "filecoinCID", "type": "string"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "nonpayable"},
        {"type": "function", "name": "getIndependenceScore", "inputs": [{"name": "reviewer", "type": "address"}, {"name": "agentOwner", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "getHumanReputationScore", "inputs": [{"name": "human", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "agentToOwner", "inputs": [{"name": "", "type": "address"}], "outputs": [{"name": "", "type": "address"}], "stateMutability": "view"},
        {"type": "function", "name": "agentWins", "inputs": [{"name": "", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "function", "name": "agentJobs", "inputs": [{"name": "", "type": "address"}], "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view"},
        {"type": "event", "name": "ReceiptMinted", "inputs": [{"name": "tokenId", "type": "uint256", "indexed": True}, {"name": "jobId", "type": "uint256", "indexed": True}, {"name": "winner", "type": "address", "indexed": True}]},
    ],
}


class Web3Service:
    def __init__(self):
        # Use Sepolia by default for hackathon; override with BASE_RPC_URL for mainnet
        self.rpc_url = os.getenv(
            "BASE_RPC_URL",
            os.getenv("BASE_SEPOLIA_RPC_URL", "https://sepolia.base.org"),
        )
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        pk = os.getenv("PRIVATE_KEY") or os.getenv("BASE_SEPOLIA_PRIVATE_KEY")
        if pk:
            self.account = Account.from_key(pk)
        else:
            self.account = None

        # Load deployed addresses from deployments/sepolia.json (canonical source)
        self.addresses = {}
        for candidate in [
            Path("deployments/sepolia.json"),
            Path("addresses.json"),  # legacy fallback
        ]:
            if candidate.exists():
                try:
                    data = json.loads(candidate.read_text())
                    self.addresses = data.get("contracts", data)
                    break
                except Exception:
                    pass

        # Use minimal human-readable ABIs (no Hardhat artifact dependency)
        self.abis = MINIMAL_ABIS

        # Expose receipt_registry contract for independence checks
        self.receipt_registry = self._get_contract("ReceiptRegistry")

    def _get_contract(self, name: str):
        key_map = {
            "StakeHumanSignalJob": "stakeHumanSignalJob",
            "LidoTreasury": "lidoTreasury",
            "ReceiptRegistry": "receiptRegistry",
        }
        addr = self.addresses.get(key_map.get(name, ""))
        abi = self.abis.get(name)
        if not addr or not abi:
            return None
        return self.w3.eth.contract(address=addr, abi=abi)

    def _send_tx(self, contract, fn_name: str, *args):
        if not self.account:
            raise RuntimeError("PRIVATE_KEY or BASE_SEPOLIA_PRIVATE_KEY required for transactions")
        fn = getattr(contract.functions, fn_name)(*args)
        tx = fn.build_transaction({
            "from": self.account.address,
            "nonce": self.w3.eth.get_transaction_count(self.account.address),
            "gas": 500000,
            "maxFeePerGas": self.w3.eth.gas_price * 2,
            "maxPriorityFeePerGas": self.w3.to_wei(0.001, "gwei"),
        })
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt

    async def create_job(self, api_url: str, review_hash: str, reviewer_address: str) -> dict:
        contract = self._get_contract("StakeHumanSignalJob")
        if not contract:
            return {"job_id": 0, "tx_hash": None, "error": "Contract not deployed"}

        spec = json.dumps({"apiUrl": api_url, "reviewHash": review_hash})
        receipt = self._send_tx(contract, "createJob", spec)

        # Parse job ID from event
        job_created_event = contract.events.JobCreated().process_receipt(receipt)
        job_id = job_created_event[0]["args"]["jobId"] if job_created_event else 0

        return {"job_id": job_id, "tx_hash": receipt.transactionHash.hex()}

    async def complete_job(self, job_id: int) -> dict:
        contract = self._get_contract("StakeHumanSignalJob")
        if not contract:
            return {"tx_hash": None, "error": "Contract not deployed"}

        receipt = self._send_tx(contract, "complete", job_id)
        return {"tx_hash": receipt.transactionHash.hex()}

    async def mint_receipt(self, job_id: int, winner: str, api_url: str, outcome: str) -> dict:
        contract = self._get_contract("ReceiptRegistry")
        if not contract:
            return {"token_id": None, "tx_hash": None}

        # Store on Filecoin first
        from api.services.filecoin import store_on_filecoin
        cid = await store_on_filecoin({
            "jobId": job_id, "winner": winner,
            "apiUrl": api_url, "outcome": outcome,
        })

        receipt = self._send_tx(
            contract, "mintReceipt",
            job_id, winner, api_url, outcome, cid or ""
        )

        mint_event = contract.events.ReceiptMinted().process_receipt(receipt)
        token_id = mint_event[0]["args"]["tokenId"] if mint_event else None

        return {
            "token_id": token_id,
            "tx_hash": receipt.transactionHash.hex(),
            "filecoin_cid": cid,
        }

    async def distribute_yield(self, winner: str, amount: int) -> dict:
        contract = self._get_contract("LidoTreasury")
        if not contract:
            return {"tx_hash": None}

        receipt = self._send_tx(contract, "distributeYield", winner, amount)
        return {"tx_hash": receipt.transactionHash.hex()}


def get_web3_service() -> Web3Service:
    global _service
    if _service is None:
        _service = Web3Service()
    return _service
