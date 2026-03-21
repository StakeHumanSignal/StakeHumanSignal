const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReceiptRegistry", function () {
  let registry, owner, minter, winner, other;

  beforeEach(async function () {
    [owner, minter, winner, other] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ReceiptRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // Grant minter role
    await registry.setMinter(minter.address, true);
  });

  describe("constructor", function () {
    it("sets name and symbol", async function () {
      expect(await registry.name()).to.equal("StakeHumanSignal Receipt");
      expect(await registry.symbol()).to.equal("SHS-RECEIPT");
    });

    it("starts with zero receipts", async function () {
      expect(await registry.totalReceipts()).to.equal(0);
    });
  });

  describe("mintReceipt", function () {
    it("mints a receipt to winner", async function () {
      const tx = await registry
        .connect(minter)
        .mintReceipt(
          42,
          winner.address,
          "https://api.openai.com",
          "score:87",
          "bafyabc123"
        );

      await expect(tx)
        .to.emit(registry, "ReceiptMinted")
        .withArgs(0, 42, winner.address, "bafyabc123");

      expect(await registry.ownerOf(0)).to.equal(winner.address);
      expect(await registry.totalReceipts()).to.equal(1);
    });

    it("stores correct receipt metadata", async function () {
      await registry
        .connect(minter)
        .mintReceipt(
          42,
          winner.address,
          "https://api.openai.com",
          "score:87,reason:good",
          "bafyabc123"
        );

      const receipt = await registry.getReceipt(0);
      expect(receipt.jobId).to.equal(42);
      expect(receipt.winner).to.equal(winner.address);
      expect(receipt.apiUrl).to.equal("https://api.openai.com");
      expect(receipt.outcome).to.equal("score:87,reason:good");
      expect(receipt.filecoinCID).to.equal("bafyabc123");
      expect(receipt.timestamp).to.be.greaterThan(0);
    });

    it("mints multiple receipts with incrementing IDs", async function () {
      await registry
        .connect(minter)
        .mintReceipt(1, winner.address, "api1", "ok", "cid1");
      await registry
        .connect(minter)
        .mintReceipt(2, winner.address, "api2", "ok", "cid2");
      await registry
        .connect(minter)
        .mintReceipt(3, other.address, "api3", "ok", "cid3");

      expect(await registry.totalReceipts()).to.equal(3);
      expect(await registry.ownerOf(0)).to.equal(winner.address);
      expect(await registry.ownerOf(1)).to.equal(winner.address);
      expect(await registry.ownerOf(2)).to.equal(other.address);
    });

    it("reverts from non-minter", async function () {
      await expect(
        registry
          .connect(other)
          .mintReceipt(
            42,
            winner.address,
            "https://api.openai.com",
            "score:87",
            "cid"
          )
      ).to.be.revertedWith("Not minter");
    });

    it("reverts on zero winner address", async function () {
      await expect(
        registry
          .connect(minter)
          .mintReceipt(42, ethers.ZeroAddress, "https://api.openai.com", "ok", "cid")
      ).to.be.revertedWith("Winner cannot be zero address");
    });

    it("reverts on empty API URL", async function () {
      await expect(
        registry
          .connect(minter)
          .mintReceipt(42, winner.address, "", "ok", "cid")
      ).to.be.revertedWith("API URL cannot be empty");
    });

    it("owner can mint without being listed as minter", async function () {
      await registry
        .connect(owner)
        .mintReceipt(99, winner.address, "api", "ok", "cid");
      expect(await registry.ownerOf(0)).to.equal(winner.address);
    });

    it("reverts on duplicate receipt for same jobId", async function () {
      await registry
        .connect(minter)
        .mintReceipt(42, winner.address, "api", "ok", "cid1");
      await expect(
        registry
          .connect(minter)
          .mintReceipt(42, winner.address, "api", "ok2", "cid2")
      ).to.be.revertedWith("Receipt already minted for job");
    });
  });

  describe("getReceipt", function () {
    it("reverts for non-existent token", async function () {
      await expect(registry.getReceipt(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });

  describe("minter management", function () {
    it("owner can add and remove minter", async function () {
      await registry.setMinter(other.address, true);
      expect(await registry.minters(other.address)).to.be.true;

      await registry.setMinter(other.address, false);
      expect(await registry.minters(other.address)).to.be.false;
    });

    it("emits MinterUpdated event", async function () {
      await expect(registry.setMinter(other.address, true))
        .to.emit(registry, "MinterUpdated")
        .withArgs(other.address, true);
    });

    it("reverts setting zero address as minter", async function () {
      await expect(
        registry.setMinter(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Cannot set zero address as minter");
    });

    it("non-owner cannot set minter", async function () {
      await expect(
        registry.connect(other).setMinter(other.address, true)
      ).to.be.reverted;
    });
  });
});
