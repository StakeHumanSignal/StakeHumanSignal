const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReceiptRegistry — Independence & Reputation", function () {
  let registry, owner, minter, agentA, agentB, humanOwner, unrelated;

  beforeEach(async function () {
    [owner, minter, agentA, agentB, humanOwner, unrelated] =
      await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ReceiptRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // Grant minter role
    await registry.setMinter(minter.address, true);
  });

  // --- Ownership Mapping ---

  describe("registerAgentOwnership", function () {
    it("agent registers itself to an owner", async function () {
      const tx = await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);

      await expect(tx)
        .to.emit(registry, "AgentRegistered")
        .withArgs(agentA.address, humanOwner.address);

      expect(await registry.agentToOwner(agentA.address)).to.equal(
        humanOwner.address
      );
    });

    it("contract owner can register on behalf", async function () {
      await registry
        .connect(owner)
        .registerAgentOwnership(agentA.address, humanOwner.address);

      expect(await registry.agentToOwner(agentA.address)).to.equal(
        humanOwner.address
      );
    });

    it("reverts if caller is not agent or owner", async function () {
      await expect(
        registry
          .connect(unrelated)
          .registerAgentOwnership(agentA.address, humanOwner.address)
      ).to.be.revertedWith("Only agent or contract owner");
    });

    it("agent can only have one owner (overwrites)", async function () {
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, unrelated.address);

      expect(await registry.agentToOwner(agentA.address)).to.equal(
        unrelated.address
      );
    });

    it("owner can have many agents", async function () {
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);
      await registry
        .connect(agentB)
        .registerAgentOwnership(agentB.address, humanOwner.address);

      expect(await registry.agentToOwner(agentA.address)).to.equal(
        humanOwner.address
      );
      expect(await registry.agentToOwner(agentB.address)).to.equal(
        humanOwner.address
      );
    });
  });

  // --- Independence Score ---

  describe("getIndependenceScore", function () {
    it("same wallet returns 0", async function () {
      const score = await registry.getIndependenceScore(
        agentA.address,
        agentA.address
      );
      expect(score).to.equal(0);
    });

    it("agent of owner returns 0", async function () {
      // Register agentA as owned by humanOwner
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);

      // agentA reviewing humanOwner's job → not independent
      const score = await registry.getIndependenceScore(
        agentA.address,
        humanOwner.address
      );
      expect(score).to.equal(0);
    });

    it("reverse relationship returns 0", async function () {
      // Register agentA as owned by humanOwner
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);

      // humanOwner reviewing agentA's job → not independent (agentToOwner[agentA] == humanOwner)
      // The agentOwner param is agentA, so we check if reviewer == agentToOwner[agentOwner]
      const score = await registry.getIndependenceScore(
        humanOwner.address,
        agentA.address
      );
      expect(score).to.equal(0);
    });

    it("unrelated wallet returns 100", async function () {
      const score = await registry.getIndependenceScore(
        unrelated.address,
        humanOwner.address
      );
      expect(score).to.equal(100);
    });

    it("zero address returns 0", async function () {
      const score = await registry.getIndependenceScore(
        ethers.ZeroAddress,
        humanOwner.address
      );
      expect(score).to.equal(0);
    });
  });

  // --- Human Reputation Score ---

  describe("getHumanReputationScore", function () {
    it("returns (0, 0) with no agents registered", async function () {
      const [score, totalJobs] = await registry.getHumanReputationScore(
        humanOwner.address
      );
      expect(score).to.equal(0);
      expect(totalJobs).to.equal(0);
    });

    it("tracks wins and jobs from mintReceipt", async function () {
      // Mint 5 receipts for agentA (winner), 0 for others
      for (let i = 0; i < 5; i++) {
        await registry
          .connect(minter)
          .mintReceipt(i, agentA.address, "api", "ok", "cid");
      }

      expect(await registry.agentWins(agentA.address)).to.equal(5);
      expect(await registry.agentJobs(agentA.address)).to.equal(5);
    });

    it("computes reputation with 2 agents", async function () {
      // Register both agents under humanOwner
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);
      await registry
        .connect(agentB)
        .registerAgentOwnership(agentB.address, humanOwner.address);

      // agentA: 4 wins out of 5 jobs = 80%
      for (let i = 0; i < 4; i++) {
        await registry
          .connect(minter)
          .mintReceipt(i, agentA.address, "api", "ok", "cid");
      }
      // 1 job where agentA participates but doesn't win
      await registry
        .connect(minter)
        .mintReceipt(4, agentB.address, "api", "ok", "cid");
      // Record agentA's participation in job 4
      await registry.connect(minter).recordParticipation(agentA.address);

      // agentB: 2 wins out of 5 jobs = 40%
      // agentB already has 1 win from job 4 above
      await registry
        .connect(minter)
        .mintReceipt(5, agentB.address, "api", "ok", "cid");
      // Record 3 more participations for agentB without wins
      await registry.connect(minter).recordParticipation(agentB.address);
      await registry.connect(minter).recordParticipation(agentB.address);
      await registry.connect(minter).recordParticipation(agentB.address);

      // agentA: 4/5 = 80, agentB: 2/5 = 40, average = (80 + 40) / 2 = 60
      const [score, totalJobs] = await registry.getHumanReputationScore(
        humanOwner.address
      );
      expect(score).to.equal(60);
      expect(totalJobs).to.equal(10);
    });
  });

  // --- Self-Review Blocked at Contract Level ---

  describe("self-review blocked", function () {
    let jobContract, usdc;

    beforeEach(async function () {
      // Deploy mock USDC
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
      await usdc.waitForDeployment();

      // Deploy StakeHumanSignalJob with agentA as evaluator
      const Job = await ethers.getContractFactory("StakeHumanSignalJob");
      jobContract = await Job.deploy(
        await usdc.getAddress(),
        agentA.address
      );
      await jobContract.waitForDeployment();

      // Wire registry
      await jobContract
        .connect(owner)
        .setReceiptRegistry(await registry.getAddress());

      // Register agentA as owned by humanOwner
      await registry
        .connect(agentA)
        .registerAgentOwnership(agentA.address, humanOwner.address);

      // humanOwner creates + funds + submits a job
      await usdc.mint(humanOwner.address, ethers.parseUnits("100", 6));
      await usdc
        .connect(humanOwner)
        .approve(await jobContract.getAddress(), ethers.parseUnits("100", 6));
      await jobContract.connect(humanOwner).createJob("test-spec");
      await jobContract
        .connect(humanOwner)
        .fund(0, ethers.parseUnits("10", 6));
      const hash = ethers.keccak256(ethers.toUtf8Bytes("review"));
      await jobContract.connect(humanOwner).submit(0, hash);
    });

    it("reverts when evaluator is owned by job client", async function () {
      // agentA (evaluator) is owned by humanOwner (job client)
      // This is a self-review → should revert
      await expect(
        jobContract.connect(agentA).complete(0)
      ).to.be.revertedWith("Evaluator not independent");
    });

    it("allows completion when evaluator is independent", async function () {
      // Create a job where the client is unrelated to the evaluator
      await usdc.mint(unrelated.address, ethers.parseUnits("100", 6));
      await usdc
        .connect(unrelated)
        .approve(await jobContract.getAddress(), ethers.parseUnits("100", 6));
      await jobContract.connect(unrelated).createJob("independent-spec");
      await jobContract
        .connect(unrelated)
        .fund(1, ethers.parseUnits("10", 6));
      const hash = ethers.keccak256(ethers.toUtf8Bytes("review2"));
      await jobContract.connect(unrelated).submit(1, hash);

      // agentA (owned by humanOwner) evaluating unrelated's job → independent
      await expect(jobContract.connect(agentA).complete(1)).to.not.be.reverted;
    });
  });
});
