const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeHumanSignalJob", function () {
  let job, usdc, owner, evaluator, reviewer, other;

  beforeEach(async function () {
    [owner, evaluator, reviewer, other] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy StakeHumanSignalJob
    const Job = await ethers.getContractFactory("StakeHumanSignalJob");
    job = await Job.deploy(await usdc.getAddress(), evaluator.address);
    await job.waitForDeployment();

    // Mint USDC to reviewer
    await usdc.mint(reviewer.address, ethers.parseUnits("1000", 6));
    await usdc
      .connect(reviewer)
      .approve(await job.getAddress(), ethers.parseUnits("1000", 6));
  });

  describe("constructor", function () {
    it("sets usdc and evaluator correctly", async function () {
      expect(await job.usdc()).to.equal(await usdc.getAddress());
      expect(await job.evaluator()).to.equal(evaluator.address);
    });

    it("reverts on zero usdc address", async function () {
      const Job = await ethers.getContractFactory("StakeHumanSignalJob");
      await expect(
        Job.deploy(ethers.ZeroAddress, evaluator.address)
      ).to.be.revertedWith("USDC address cannot be zero");
    });

    it("reverts on zero evaluator address", async function () {
      const Job = await ethers.getContractFactory("StakeHumanSignalJob");
      await expect(
        Job.deploy(await usdc.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("Evaluator address cannot be zero");
    });
  });

  describe("createJob", function () {
    it("creates a job with correct spec", async function () {
      const tx = await job
        .connect(reviewer)
        .createJob('{"apiUrl":"https://api.openai.com"}');
      await expect(tx).to.emit(job, "JobCreated").withArgs(0, reviewer.address, '{"apiUrl":"https://api.openai.com"}');

      const [client, , budget, status] = await job.getJob(0);
      expect(client).to.equal(reviewer.address);
      expect(budget).to.equal(0);
      expect(status).to.equal(0); // Open
    });

    it("increments job ID", async function () {
      await job.connect(reviewer).createJob("spec1");
      await job.connect(reviewer).createJob("spec2");
      expect(await job.getJobCount()).to.equal(2);
    });

    it("reverts on empty spec", async function () {
      await expect(
        job.connect(reviewer).createJob("")
      ).to.be.revertedWith("Spec cannot be empty");
    });
  });

  describe("fund", function () {
    beforeEach(async function () {
      await job.connect(reviewer).createJob("test-spec");
    });

    it("funds a job with USDC", async function () {
      const amount = ethers.parseUnits("10", 6);
      const tx = await job.connect(reviewer).fund(0, amount);
      await expect(tx).to.emit(job, "JobFunded").withArgs(0, amount);

      const [, , budget, status] = await job.getJob(0);
      expect(budget).to.equal(amount);
      expect(status).to.equal(1); // Funded
    });

    it("reverts if not the client", async function () {
      await expect(
        job.connect(other).fund(0, ethers.parseUnits("10", 6))
      ).to.be.revertedWith("Not job client");
    });

    it("reverts on zero amount", async function () {
      await expect(
        job.connect(reviewer).fund(0, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("reverts if job already funded", async function () {
      await job.connect(reviewer).fund(0, ethers.parseUnits("10", 6));
      await expect(
        job.connect(reviewer).fund(0, ethers.parseUnits("5", 6))
      ).to.be.revertedWith("Job not open");
    });

    it("forwards USDC to treasury when set", async function () {
      const treasury = other; // use other as mock treasury
      await job.connect(owner).setLidoTreasury(treasury.address);

      const amount = ethers.parseUnits("10", 6);
      await job.connect(reviewer).fund(0, amount);

      expect(await usdc.balanceOf(treasury.address)).to.equal(amount);
    });
  });

  describe("submit", function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("review-content"));

    beforeEach(async function () {
      await job.connect(reviewer).createJob("test-spec");
      await job.connect(reviewer).fund(0, ethers.parseUnits("10", 6));
    });

    it("submits a deliverable", async function () {
      const tx = await job.connect(reviewer).submit(0, hash);
      await expect(tx).to.emit(job, "JobSubmitted").withArgs(0, hash);

      const [, , , status, deliverableHash] = await job.getJob(0);
      expect(status).to.equal(2); // Submitted
      expect(deliverableHash).to.equal(hash);
    });

    it("reverts on zero hash", async function () {
      await expect(
        job.connect(reviewer).submit(0, ethers.ZeroHash)
      ).to.be.revertedWith("Deliverable hash cannot be zero");
    });

    it("reverts if not the client", async function () {
      await expect(
        job.connect(other).submit(0, hash)
      ).to.be.revertedWith("Not job client");
    });

    it("reverts if job not funded", async function () {
      await job.connect(reviewer).createJob("spec2");
      await expect(
        job.connect(reviewer).submit(1, hash)
      ).to.be.revertedWith("Job not funded");
    });
  });

  describe("complete", function () {
    beforeEach(async function () {
      await job.connect(reviewer).createJob("test-spec");
      await job.connect(reviewer).fund(0, ethers.parseUnits("10", 6));
      const hash = ethers.keccak256(ethers.toUtf8Bytes("review"));
      await job.connect(reviewer).submit(0, hash);
    });

    it("evaluator completes the job", async function () {
      const tx = await job.connect(evaluator).complete(0);
      await expect(tx)
        .to.emit(job, "JobCompleted")
        .withArgs(0, evaluator.address);

      const [, , , status] = await job.getJob(0);
      expect(status).to.equal(3); // Completed
    });

    it("reverts if not the evaluator", async function () {
      await expect(
        job.connect(other).complete(0)
      ).to.be.revertedWith("Only evaluator");
    });

    it("reverts if job not submitted", async function () {
      await job.connect(reviewer).createJob("spec2");
      await expect(
        job.connect(evaluator).complete(1)
      ).to.be.revertedWith("Job not submitted");
    });
  });

  describe("reject", function () {
    beforeEach(async function () {
      await job.connect(reviewer).createJob("test-spec");
      await job.connect(reviewer).fund(0, ethers.parseUnits("10", 6));
      const hash = ethers.keccak256(ethers.toUtf8Bytes("review"));
      await job.connect(reviewer).submit(0, hash);
    });

    it("evaluator rejects the job", async function () {
      const tx = await job.connect(evaluator).reject(0);
      await expect(tx)
        .to.emit(job, "JobRejected")
        .withArgs(0, evaluator.address);

      const [, , , status] = await job.getJob(0);
      expect(status).to.equal(4); // Rejected
    });

    it("reverts if not the evaluator", async function () {
      await expect(
        job.connect(other).reject(0)
      ).to.be.revertedWith("Only evaluator");
    });
  });

  describe("admin functions", function () {
    it("owner can set evaluator", async function () {
      await job.connect(owner).setEvaluator(other.address);
      expect(await job.evaluator()).to.equal(other.address);
    });

    it("reverts setting zero address evaluator", async function () {
      await expect(
        job.connect(owner).setEvaluator(ethers.ZeroAddress)
      ).to.be.revertedWith("Evaluator address cannot be zero");
    });

    it("non-owner cannot set evaluator", async function () {
      await expect(
        job.connect(other).setEvaluator(other.address)
      ).to.be.reverted;
    });

    it("reverts setting zero address treasury", async function () {
      await expect(
        job.connect(owner).setLidoTreasury(ethers.ZeroAddress)
      ).to.be.revertedWith("Treasury address cannot be zero");
    });

    it("reverts setting zero address registry", async function () {
      await expect(
        job.connect(owner).setReceiptRegistry(ethers.ZeroAddress)
      ).to.be.revertedWith("Registry address cannot be zero");
    });
  });
});
