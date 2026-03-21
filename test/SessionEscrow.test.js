const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SessionEscrow", function () {
  let escrow, usdc, registry, owner, buyer, reviewer, feeRecipient;
  const REWARD = ethers.parseUnits("100", 6);
  const CLAIM_ID = ethers.keccak256(ethers.toUtf8Bytes("claim-001"));
  const PROMPT_HASH = ethers.keccak256(ethers.toUtf8Bytes("test prompt"));
  const OUTPUT_A = ethers.keccak256(ethers.toUtf8Bytes("output A"));
  const OUTPUT_B = ethers.keccak256(ethers.toUtf8Bytes("output B"));

  beforeEach(async function () {
    [owner, buyer, reviewer, feeRecipient] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    const Registry = await ethers.getContractFactory("ReceiptRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    const Escrow = await ethers.getContractFactory("SessionEscrow");
    escrow = await Escrow.deploy(await usdc.getAddress(), await registry.getAddress(), feeRecipient.address);
    await escrow.waitForDeployment();

    await usdc.mint(buyer.address, ethers.parseUnits("10000", 6));
    await usdc.connect(buyer).approve(await escrow.getAddress(), ethers.parseUnits("10000", 6));
  });

  describe("openSession", function () {
    it("transfers USDC from buyer to escrow", async function () {
      await escrow.connect(buyer).openSession(CLAIM_ID, reviewer.address, REWARD, PROMPT_HASH);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(REWARD);
    });

    it("emits SessionOpened event", async function () {
      await expect(escrow.connect(buyer).openSession(CLAIM_ID, reviewer.address, REWARD, PROMPT_HASH))
        .to.emit(escrow, "SessionOpened")
        .withArgs(0, buyer.address, CLAIM_ID, REWARD);
    });

    it("reverts on zero reward", async function () {
      await expect(escrow.connect(buyer).openSession(CLAIM_ID, reviewer.address, 0, PROMPT_HASH))
        .to.be.revertedWith("Reward required");
    });

    it("reverts on zero reviewer", async function () {
      await expect(escrow.connect(buyer).openSession(CLAIM_ID, ethers.ZeroAddress, REWARD, PROMPT_HASH))
        .to.be.revertedWith("Invalid reviewer");
    });
  });

  describe("recordOutputs", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).openSession(CLAIM_ID, reviewer.address, REWARD, PROMPT_HASH);
    });

    it("sets hashes and status to Generated", async function () {
      await escrow.recordOutputs(0, OUTPUT_A, OUTPUT_B);
      const s = await escrow.getSession(0);
      expect(s.outputHashA).to.equal(OUTPUT_A);
      expect(s.outputHashB).to.equal(OUTPUT_B);
      expect(s.status).to.equal(1); // Generated
    });

    it("emits OutputsRecorded", async function () {
      await expect(escrow.recordOutputs(0, OUTPUT_A, OUTPUT_B))
        .to.emit(escrow, "OutputsRecorded");
    });

    it("reverts from non-owner", async function () {
      await expect(escrow.connect(buyer).recordOutputs(0, OUTPUT_A, OUTPUT_B))
        .to.be.reverted;
    });
  });

  describe("settle", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).openSession(CLAIM_ID, reviewer.address, REWARD, PROMPT_HASH);
      await escrow.recordOutputs(0, OUTPUT_A, OUTPUT_B);
    });

    it("winner=1: pays reviewer 90%, fee 10%", async function () {
      const reviewerBefore = await usdc.balanceOf(reviewer.address);
      const feeBefore = await usdc.balanceOf(feeRecipient.address);

      await escrow.settle(0, 1);

      const reviewerAfter = await usdc.balanceOf(reviewer.address);
      const feeAfter = await usdc.balanceOf(feeRecipient.address);

      expect(reviewerAfter - reviewerBefore).to.equal(ethers.parseUnits("90", 6));
      expect(feeAfter - feeBefore).to.equal(ethers.parseUnits("10", 6));
    });

    it("winner=2: refunds buyer fully", async function () {
      const buyerBefore = await usdc.balanceOf(buyer.address);
      await escrow.settle(0, 2);
      const buyerAfter = await usdc.balanceOf(buyer.address);
      expect(buyerAfter - buyerBefore).to.equal(REWARD);
    });

    it("reverts if not Generated", async function () {
      await escrow.settle(0, 1);
      await expect(escrow.settle(0, 1)).to.be.revertedWith("Not generated");
    });

    it("emits SessionSettled", async function () {
      await expect(escrow.settle(0, 1)).to.emit(escrow, "SessionSettled");
    });
  });

  describe("refundExpired", function () {
    beforeEach(async function () {
      await escrow.connect(buyer).openSession(CLAIM_ID, reviewer.address, REWARD, PROMPT_HASH);
    });

    it("works after 7 days", async function () {
      await time.increase(7 * 24 * 60 * 60 + 1);
      const buyerBefore = await usdc.balanceOf(buyer.address);
      await escrow.refundExpired(0);
      const buyerAfter = await usdc.balanceOf(buyer.address);
      expect(buyerAfter - buyerBefore).to.equal(REWARD);
    });

    it("reverts before expiry", async function () {
      await expect(escrow.refundExpired(0)).to.be.revertedWith("Not expired");
    });
  });
});
