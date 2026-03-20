"""Web3 service — contract interactions on Base Mainnet."""

import json
import os
from pathlib import Path
from web3 import Web3
from eth_account import Account

_service = None


class Web3Service:
    def __init__(self):
        self.rpc_url = os.getenv("BASE_RPC_URL", "https://mainnet.base.org")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.account = Account.from_key(os.getenv("PRIVATE_KEY", "0x" + "0" * 64))

        # Load deployed addresses
        addr_file = Path("addresses.json")
        if addr_file.exists():
            self.addresses = json.loads(addr_file.read_text())["contracts"]
        else:
            self.addresses = {}

        # Load ABIs from Hardhat artifacts
        self.abis = {}
        for name in ["StakeHumanSignalJob", "LidoTreasury", "ReceiptRegistry"]:
            abi_file = Path(f"artifacts/contracts/{name}.sol/{name}.json")
            if abi_file.exists():
                self.abis[name] = json.loads(abi_file.read_text())["abi"]

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
