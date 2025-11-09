// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title I3Token - Intelligence Cubed Platform Token
 * @dev Simplified ERC20 token for check-in rewards and platform utility
 * @author Intelligence Cubed Team
 */
contract I3Token is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    // Token configuration
    uint8 private constant _DECIMALS = 18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**_DECIMALS; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 50_000_000 * 10**_DECIMALS;  // 50 million initial (reduced)
    
    // Platform integration
    address public checkInContract;
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public blacklisted;
    
    // Reward tracking
    mapping(address => uint256) public totalEarned;      // Total tokens earned by user
    mapping(address => uint256) public checkInRewards;   // Rewards from check-ins
    mapping(address => uint256) public lastRewardTime;   // Last reward timestamp
    
    // Simple staking for future features
    mapping(address => uint256) public stakingBalances;
    mapping(address => uint256) public stakingStartTime;
    uint256 public totalStaked;
    
    // Events
    event CheckInRewardMinted(address indexed user, uint256 amount, uint256 checkInStreak);
    event AuthorizedMinterAdded(address indexed minter);
    event AuthorizedMinterRemoved(address indexed minter);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    
    // Modifiers
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == checkInContract, 
                "Not authorized to mint");
        _;
    }
    
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }
    
    constructor() ERC20("Intelligence Cubed Token", "I3T") {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Set deployer as authorized minter initially
        authorizedMinters[msg.sender] = true;
    }
    
    /**
     * @dev Set check-in contract address
     * @param _checkInContract Address of the check-in contract
     */
    function setCheckInContract(address _checkInContract) external onlyOwner {
        require(_checkInContract != address(0), "Invalid check-in contract");
        checkInContract = _checkInContract;
        authorizedMinters[_checkInContract] = true;
        emit AuthorizedMinterAdded(_checkInContract);
    }
    
    /**
     * @dev Mint tokens as check-in rewards (only authorized contracts)
     * @param to Recipient address
     * @param amount Amount to mint
     * @param streak User's current check-in streak
     */
    function mintCheckInReward(
        address to, 
        uint256 amount,
        uint256 streak
    ) external onlyAuthorizedMinter notBlacklisted(to) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        require(amount > 0, "Amount must be greater than 0");
        
        // Convert credits to tokens (1 credit = 1 token with 18 decimals)
        uint256 tokenAmount = amount * 10**_DECIMALS;
        
        _mint(to, tokenAmount);
        
        // Track rewards
        totalEarned[to] += tokenAmount;
        checkInRewards[to] += tokenAmount;
        lastRewardTime[to] = block.timestamp;
        
        emit CheckInRewardMinted(to, tokenAmount, streak);
    }
    
    /**
     * @dev Mint tokens for other platform activities (owner only)
     * @param to Recipient address  
     * @param amount Amount to mint (in tokens, not wei)
     */
    function mintPlatformReward(address to, uint256 amount) external onlyOwner notBlacklisted(to) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(to, amount);
        totalEarned[to] += amount;
    }
    
    /**
     * @dev Stake tokens (simple version for future features)
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant notBlacklisted(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        stakingBalances[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        totalStaked += amount;
        
        emit TokensStaked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake tokens
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant notBlacklisted(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(stakingBalances[msg.sender] >= amount, "Insufficient staked balance");
        
        stakingBalances[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);
        
        emit TokensUnstaked(msg.sender, amount);
    }
    
    /**
     * @dev Add authorized minter
     * @param minter Address to authorize
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = true;
        emit AuthorizedMinterAdded(minter);
    }
    
    /**
     * @dev Remove authorized minter
     * @param minter Address to remove authorization
     */
    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit AuthorizedMinterRemoved(minter);
    }
    
    /**
     * @dev Update blacklist status
     * @param account Account to update
     * @param isBlacklisted New blacklist status
     */
    function updateBlacklist(address account, bool isBlacklisted) external onlyOwner {
        blacklisted[account] = isBlacklisted;
        emit BlacklistUpdated(account, isBlacklisted);
    }
    
    /**
     * @dev Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get user reward statistics
     * @param user User address
     */
    function getUserRewardStats(address user) external view returns (
        uint256 totalTokensEarned,
        uint256 checkInTokens,
        uint256 stakedAmount,
        uint256 lastReward
    ) {
        return (
            totalEarned[user],
            checkInRewards[user], 
            stakingBalances[user],
            lastRewardTime[user]
        );
    }
    
    /**
     * @dev Get platform token statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalSupplyAmount,
        uint256 maxSupplyAmount,
        uint256 totalStakedAmount,
        uint256 circulatingSupply
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            totalStaked,
            totalSupply() - balanceOf(address(this)) - totalStaked
        );
    }
    
    // Override functions to implement blacklist and pausing
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        require(!blacklisted[from] && !blacklisted[to], "Address is blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Override transfer to ensure blacklist compliance
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        notBlacklisted(msg.sender) 
        notBlacklisted(to) 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to ensure blacklist compliance
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        notBlacklisted(from) 
        notBlacklisted(to) 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }
}