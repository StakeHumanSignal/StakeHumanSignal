const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LidoTreasury", function () {
  let treasury, wstETH, usdc, owner, whitelisted, winner, other;

  beforeEach(async function () {
    [owner, whitelisted, winner, other] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    wstETH = await MockERC20.deploy("Wrapped stETH", "wstETH", 18);
    await wstETH.waitForDeployment();
    usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();

    // Deploy LidoTreasury
    const Treasury = await ethers.getContractFactory("LidoTreasury");
    treasury = await Treasury.deploy(
      await wstETH.getAddress(),
      await usdc.getAddress()
    );
    await treasury.waitForDeployment();

    // Whitelist a caller
    await treasury.setWhitelisted(whitelisted.address, true);

    // Mint wstETH to owner for deposits
    await wstETH.mint(owner.address, ethers.parseEther("100"));
    await wstETH.approve(await treasury.getAddress(), ethers.parseEther("100"));
  });

  describe("constructor", function () {
    it("sets tokens correctly", async function () {
      expect(await treasury.wstETH()).to.equal(await wstETH.getAddress());
      expect(await treasury.usdc()).to.equal(await usdc.getAddress());
    });

    it("reverts on zero wstETH address", async function () {
      const Treasury = await ethers.getContractFactory("LidoTreasury");
      await expect(
        Treasury.deploy(ethers.ZeroAddress, await usdc.getAddress())
      ).to.be.revertedWith("wstETH address cannot be zero");
    });

    it("reverts on zero usdc address", async function () {
      const Treasury = await ethers.getContractFactory("LidoTreasury");
      await expect(
        Treasury.deploy(await wstETH.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("USDC address cannot be zero");
    });
  });

  describe("depositPrincipal", function () {
    it("accepts wstETH deposit", async function () {
      const amount = ethers.parseEther("10");
      const tx = await treasury.depositPrincipal(amount);
      await expect(tx)
        .to.emit(treasury, "PrincipalDeposited")
        .withArgs(owner.address, amount);

      expect(await treasury.totalPrincipal()).to.equal(amount);
      expect(await treasury.totalBalance()).to.equal(amount);
    });

    it("reverts on zero amount", async function () {
      await expect(treasury.depositPrincipal(0)).to.be.revertedWith(
        "Amount must be greater than zero"
      );
    });

    it("allows multiple deposits", async function () {
      await treasury.depositPrincipal(ethers.parseEther("5"));
      await treasury.depositPrincipal(ethers.parseEther("3"));
      expect(await treasury.totalPrincipal()).to.equal(ethers.parseEther("8"));
    });
  });

  describe("distributeYield", function () {
    beforeEach(async function () {
      // Deposit 10 wstETH as principal
      await treasury.depositPrincipal(ethers.parseEther("10"));

      // Simulate yield by sending extra wstETH directly to treasury
      await wstETH.mint(await treasury.getAddress(), ethers.parseEther("2"));
    });

    it("distributes available yield", async function () {
      const yieldAmount = ethers.parseEther("1");
      const tx = await treasury
        .connect(whitelisted)
        .distributeYield(winner.address, yieldAmount);

      await expect(tx)
        .to.emit(treasury, "YieldDistributed")
        .withArgs(winner.address, yieldAmount);

      expect(await wstETH.balanceOf(winner.address)).to.equal(yieldAmount);
      expect(await treasury.totalYieldDistributed()).to.equal(yieldAmount);
    });

    it("reverts if exceeds available yield", async function () {
      await expect(
        treasury
          .connect(whitelisted)
          .distributeYield(winner.address, ethers.parseEther("5"))
      ).to.be.revertedWith("Exceeds available yield");
    });

    it("reverts on zero amount", async function () {
      await expect(
        treasury.connect(whitelisted).distributeYield(winner.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("reverts on zero winner address", async function () {
      await expect(
        treasury
          .connect(whitelisted)
          .distributeYield(ethers.ZeroAddress, ethers.parseEther("1"))
      ).to.be.revertedWith("Winner cannot be zero address");
    });

    it("reverts from non-whitelisted caller", async function () {
      await expect(
        treasury
          .connect(other)
          .distributeYield(winner.address, ethers.parseEther("1"))
      ).to.be.revertedWith("Not whitelisted");
    });

    it("principal is NEVER withdrawable — yield cannot exceed surplus", async function () {
      // Available yield is 2 ETH (12 total - 10 principal)
      const availYield = await treasury.availableYield();
      expect(availYield).to.equal(ethers.parseEther("2"));

      // Distribute all yield
      await treasury
        .connect(whitelisted)
        .distributeYield(winner.address, ethers.parseEther("2"));

      // No more yield available
      expect(await treasury.availableYield()).to.equal(0);

      // Cannot withdraw any more — principal is locked
      await expect(
        treasury
          .connect(whitelisted)
          .distributeYield(winner.address, ethers.parseEther("1"))
      ).to.be.revertedWith("Exceeds available yield");

      // Principal still intact
      expect(await treasury.totalPrincipal()).to.equal(ethers.parseEther("10"));
      expect(await treasury.totalBalance()).to.equal(ethers.parseEther("10"));
    });
  });

  describe("receiveStake", function () {
    it("tracks stake deposits", async function () {
      const tx = await treasury
        .connect(whitelisted)
        .receiveStake(winner.address, ethers.parseUnits("100", 6));

      await expect(tx)
        .to.emit(treasury, "USDCReceived")
        .withArgs(winner.address, ethers.parseUnits("100", 6));

      expect(await treasury.deposits(winner.address)).to.equal(
        ethers.parseUnits("100", 6)
      );
    });

    it("reverts from non-whitelisted caller", async function () {
      await expect(
        treasury
          .connect(other)
          .receiveStake(winner.address, ethers.parseUnits("100", 6))
      ).to.be.revertedWith("Not whitelisted");
    });

    it("reverts on zero reviewer address", async function () {
      await expect(
        treasury
          .connect(whitelisted)
          .receiveStake(ethers.ZeroAddress, ethers.parseUnits("100", 6))
      ).to.be.revertedWith("Reviewer cannot be zero address");
    });

    it("reverts on zero amount", async function () {
      await expect(
        treasury.connect(whitelisted).receiveStake(winner.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });
  });

  describe("whitelist management", function () {
    it("owner can whitelist and remove", async function () {
      await treasury.setWhitelisted(other.address, true);
      expect(await treasury.whitelisted(other.address)).to.be.true;

      await treasury.setWhitelisted(other.address, false);
      expect(await treasury.whitelisted(other.address)).to.be.false;
    });

    it("emits WhitelistUpdated event", async function () {
      await expect(treasury.setWhitelisted(other.address, true))
        .to.emit(treasury, "WhitelistUpdated")
        .withArgs(other.address, true);
    });

    it("reverts whitelisting zero address", async function () {
      await expect(
        treasury.setWhitelisted(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Cannot whitelist zero address");
    });

    it("non-owner cannot whitelist", async function () {
      await expect(
        treasury.connect(other).setWhitelisted(other.address, true)
      ).to.be.reverted;
    });
  });
});
