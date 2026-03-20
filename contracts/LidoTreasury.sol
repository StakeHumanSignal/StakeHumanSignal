// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LidoTreasury - Yield-bearing treasury backed by wstETH
/// @notice Holds wstETH principal (locked forever), distributes only yield to winners.
/// @dev Human stakes USDC → treasury swaps to wstETH → yield accrues → winners claim yield.
contract LidoTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable wstETH;
    IERC20 public immutable usdc;

    /// @notice Total wstETH principal locked (never withdrawable)
    uint256 public totalPrincipal;

    /// @notice Total yield distributed so far
    uint256 public totalYieldDistributed;

    /// @notice Whitelisted callers (StakeHumanSignalJob contract)
    mapping(address => bool) public whitelisted;

    /// @notice Track deposits per reviewer
    mapping(address => uint256) public deposits;

    event PrincipalDeposited(address indexed from, uint256 wstETHAmount);
    event YieldDistributed(address indexed winner, uint256 wstETHAmount);
    event USDCReceived(address indexed from, uint256 amount);

    modifier onlyWhitelisted() {
        require(whitelisted[msg.sender] || msg.sender == owner(), "Not whitelisted");
        _;
    }

    constructor(address _wstETH, address _usdc) Ownable(msg.sender) {
        wstETH = IERC20(_wstETH);
        usdc = IERC20(_usdc);
    }

    function setWhitelisted(address addr, bool status) external onlyOwner {
        whitelisted[addr] = status;
    }

    /// @notice Receive USDC from StakeHumanSignalJob (stake deposits)
    /// @dev In production, this would swap USDC→wstETH via DEX.
    ///      For hackathon: tracks USDC received, uses pre-funded wstETH balance.
    function receiveStake(address reviewer, uint256 usdcAmount) external onlyWhitelisted {
        deposits[reviewer] += usdcAmount;
        emit USDCReceived(reviewer, usdcAmount);
    }

    /// @notice Deposit wstETH as principal (locked forever)
    function depositPrincipal(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        wstETH.safeTransferFrom(msg.sender, address(this), amount);
        totalPrincipal += amount;
        emit PrincipalDeposited(msg.sender, amount);
    }

    /// @notice Distribute yield to winning reviewer
    /// @dev Yield = current wstETH balance - totalPrincipal
    function distributeYield(address winner, uint256 amount) external onlyWhitelisted nonReentrant {
        uint256 currentBalance = wstETH.balanceOf(address(this));
        uint256 yieldAvailable = currentBalance > totalPrincipal ? currentBalance - totalPrincipal : 0;
        require(amount <= yieldAvailable, "Exceeds available yield");
        require(amount > 0, "Zero yield");

        wstETH.safeTransfer(winner, amount);
        totalYieldDistributed += amount;

        emit YieldDistributed(winner, amount);
    }

    /// @notice View available yield (balance minus locked principal)
    function availableYield() external view returns (uint256) {
        uint256 currentBalance = wstETH.balanceOf(address(this));
        return currentBalance > totalPrincipal ? currentBalance - totalPrincipal : 0;
    }

    /// @notice View total wstETH balance
    function totalBalance() external view returns (uint256) {
        return wstETH.balanceOf(address(this));
    }
}
